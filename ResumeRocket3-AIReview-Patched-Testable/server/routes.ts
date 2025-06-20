import type { Express } from "express";
import { createServer, type Server } from "http";
import { MongoStorage } from "./mongoStorage";
import { analyzeResume, generateResumeTemplate, buildResume, optimizeResumeContent } from "./openai";
import { insertResumeSchema, loginSchema, registerSchema } from "@shared/schema";
import { authenticateToken, optionalAuth, requireAdmin, hashPassword, comparePassword, generateToken, type AuthRequest } from "./auth";
import multer from "multer";
import { z } from "zod";

// Use MongoDB storage
const storage = new MongoStorage();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Helper function to log user actions
async function logUserAction(userId: number | undefined, action: string, details: any, req: any) {
  if (userId) {
    await storage.createAuditLog({
      userId,
      action,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'user'
      });

      // Generate token
      const token = generateToken(user.id);

      // Log registration
      await logUserAction(user.id, 'register', { email: user.email }, req);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await comparePassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user.id);

      // Log login
      await logUserAction(user.id, 'login', { email: user.email }, req);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    res.json({
      user: {
        id: req.user!.id,
        username: req.user!.username,
        email: req.user!.email,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        role: req.user!.role
      }
    });
  });

  // Resume routes
  app.post('/api/resumes/upload', optionalAuth, upload.single('resume'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { industry } = req.body;
      if (!industry) {
        return res.status(400).json({ message: 'Industry is required' });
      }

      // Extract text content from file
      let originalContent: string;
      
      if (req.file.mimetype === 'text/plain') {
        originalContent = req.file.buffer.toString('utf-8');
      } else {
        // For PDF and DOC files, we'll use the buffer as text for now
        // In production, you'd want to use proper PDF/DOC parsing libraries
        originalContent = req.file.buffer.toString('utf-8');
      }
      
      // Analyze resume with AI
      const analysis = await analyzeResume(originalContent, industry);
      
      // Save resume to storage
      const resumeData = {
        userId: req.user?.id || null,
        filename: req.file.originalname,
        originalContent,
        industry,
        atsScore: analysis.score,
        analysis: analysis.analysis,
        suggestions: analysis.suggestions,
        skillsGap: analysis.skillsGap,
      };

      const resume = await storage.createResume(resumeData);
      
      // Update user stats if user is logged in
      if (req.user) {
        const currentStats = await storage.getUserStats(req.user.id) || {
          userId: req.user.id,
          resumesAnalyzed: 0,
          avgScore: 0,
          interviews: 0,
          totalOptimizations: 0,
        };
        
        const newResumeCount = (currentStats.resumesAnalyzed || 0) + 1;
        const newAvgScore = Math.round(
          (((currentStats.avgScore || 0) * (currentStats.resumesAnalyzed || 0)) + analysis.score) / newResumeCount
        );
        
        await storage.updateUserStats(req.user.id, {
          resumesAnalyzed: newResumeCount,
          avgScore: newAvgScore,
        });

        // Log the upload
        await logUserAction(req.user.id, 'upload_resume', { 
          filename: req.file.originalname, 
          industry, 
          atsScore: analysis.score 
        }, req);
      }

      res.json(resume);
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ message: 'Failed to analyze resume' });
    }
  });

  // Optimize resume content
  app.post('/api/resumes/:id/optimize', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Check if user owns the resume (if authenticated)
      if (req.user && resume.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const optimizedContent = await optimizeResumeContent(
        resume.originalContent,
        resume.suggestions || [],
        resume.industry
      );

      // Update resume with optimized content
      const updatedResume = await storage.updateResume(id, {
        optimizedContent
      });

      // Update user stats
      if (req.user) {
        const currentStats = await storage.getUserStats(req.user.id);
        if (currentStats) {
          await storage.updateUserStats(req.user.id, {
            totalOptimizations: (currentStats.totalOptimizations || 0) + 1
          });
        }

        // Log the optimization
        await logUserAction(req.user.id, 'optimize_resume', { resumeId: id }, req);
      }

      res.json({ 
        optimizedContent,
        resume: updatedResume 
      });
    } catch (error) {
      console.error('Resume optimization error:', error);
      res.status(500).json({ message: 'Failed to optimize resume' });
    }
  });

  // Build resume from scratch
  app.post('/api/resumes/build', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { personalInfo, sections, industry, template } = req.body;
      
      if (!personalInfo || !sections || !industry) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const builtResume = await buildResume(personalInfo, sections, industry, template);
      
      // Save the built resume
      const resumeData = {
        userId: req.user?.id || null,
        filename: `${personalInfo.fullName}_Built_Resume.txt`,
        originalContent: builtResume,
        industry,
        atsScore: null,
        analysis: null,
        suggestions: null,
        skillsGap: null,
      };

      const resume = await storage.createResume(resumeData);
      
      // Log the build action
      if (req.user) {
        await logUserAction(req.user.id, 'build_resume', { 
          industry, 
          template,
          sections: sections.length 
        }, req);
      }
      
      res.json({ 
        content: builtResume,
        resume: resume
      });
    } catch (error) {
      console.error('Resume build error:', error);
      res.status(500).json({ message: 'Failed to build resume' });
    }
  });

  // Export resume as PDF (placeholder)
  app.post('/api/resumes/export-pdf', async (req, res) => {
    try {
      const { content, personalInfo, template } = req.body;
      
      // In a real implementation, you would use a PDF generation library like puppeteer or jsPDF
      res.status(501).json({ 
        message: 'PDF export not yet implemented. Please use text download.' 
      });
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: 'Failed to export PDF' });
    }
  });

  // Get resume by ID
  app.get('/api/resumes/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Check if user owns the resume or if resume is public
      if (resume.userId && req.user?.id !== resume.userId && !resume.isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(resume);
    } catch (error) {
      console.error('Get resume error:', error);
      res.status(500).json({ message: 'Failed to get resume' });
    }
  });

  // Get user's resumes
  app.get('/api/resumes', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const resumes = await storage.getResumesByUser(req.user!.id);
      res.json(resumes);
    } catch (error) {
      console.error('Get resumes error:', error);
      res.status(500).json({ message: 'Failed to get resumes' });
    }
  });

  // Get user stats
  app.get('/api/stats', optionalAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        // Return default stats for non-authenticated users
        return res.json({
          resumesAnalyzed: 0,
          avgScore: 0,
          interviews: 0,
          totalOptimizations: 0
        });
      }

      const stats = await storage.getUserStats(req.user.id) || {
        userId: req.user.id,
        resumesAnalyzed: 0,
        avgScore: 0,
        interviews: 0,
        totalOptimizations: 0
      };
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  // Update resume content
  app.patch('/api/resumes/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Check if user owns the resume
      if (resume.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { originalContent, industry } = req.body;
      
      if (originalContent && industry) {
        // Re-analyze with updated content
        const analysis = await analyzeResume(originalContent, industry);
        
        const updatedResume = await storage.updateResume(id, {
          originalContent,
          industry,
          atsScore: analysis.score,
          analysis: analysis.analysis,
          suggestions: analysis.suggestions,
          skillsGap: analysis.skillsGap,
        });
        
        // Log the update
        await logUserAction(req.user!.id, 'update_resume', { resumeId: id }, req);
        
        res.json(updatedResume);
      } else {
        const updatedResume = await storage.updateResume(id, req.body);
        res.json(updatedResume);
      }
    } catch (error) {
      console.error('Update resume error:', error);
      res.status(500).json({ message: 'Failed to update resume' });
    }
  });

  // Delete resume
  app.delete('/api/resumes/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Check if user owns the resume
      if (resume.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const deleted = await storage.deleteResume(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Log the deletion
      await logUserAction(req.user!.id, 'delete_resume', { resumeId: id }, req);

      res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(500).json({ message: 'Failed to delete resume' });
    }
  });

  // Generate resume template
  app.post('/api/templates/generate', async (req, res) => {
    try {
      const { industry } = req.body;
      
      if (!industry) {
        return res.status(400).json({ message: 'Industry is required' });
      }
      
      const template = await generateResumeTemplate(industry);
      res.json(template);
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: 'Failed to generate template' });
    }
  });

  // Skills assessment endpoint
  app.post('/api/skills/assess', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { skills, industry, overallScore, recommendations } = req.body;
      
      const assessment = await storage.createSkillAssessment({
        userId: req.user!.id,
        industry,
        skills,
        overallScore,
        recommendations
      });

      // Log the assessment
      await logUserAction(req.user!.id, 'skills_assessment', { 
        industry, 
        overallScore,
        skillsCount: skills?.length || 0 
      }, req);
      
      res.json({ 
        message: 'Skills assessment saved successfully',
        assessment,
        recommendations: recommendations || [
          'Focus on improving your weakest skills first',
          'Consider taking online courses for skill gaps',
          'Practice with real-world projects',
          'Get certifications for important skills'
        ]
      });
    } catch (error) {
      console.error('Skills assessment error:', error);
      res.status(500).json({ message: 'Failed to save skills assessment' });
    }
  });

  // Get user's skill assessments
  app.get('/api/skills/assessments', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const assessments = await storage.getSkillAssessmentsByUser(req.user!.id);
      res.json(assessments);
    } catch (error) {
      console.error('Get assessments error:', error);
      res.status(500).json({ message: 'Failed to get assessments' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const users = await storage.getAllUsers(limit, offset);
      const totalUsers = await storage.getUserCount();

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.get('/api/admin/resumes', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const resumes = await storage.getAllResumes(limit, offset);
      const totalResumes = await storage.getResumeCount();

      res.json({
        resumes,
        pagination: {
          page,
          limit,
          total: totalResumes,
          pages: Math.ceil(totalResumes / limit)
        }
      });
    } catch (error) {
      console.error('Get all resumes error:', error);
      res.status(500).json({ message: 'Failed to get resumes' });
    }
  });

  app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getAnalyticsData();
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to get analytics' });
    }
  });

  app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = (page - 1) * limit;

      const logs = await storage.getAuditLogs(limit, offset);

      res.json({
        logs,
        pagination: {
          page,
          limit,
          total: logs.length,
          pages: Math.ceil(logs.length / limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ message: 'Failed to get audit logs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}