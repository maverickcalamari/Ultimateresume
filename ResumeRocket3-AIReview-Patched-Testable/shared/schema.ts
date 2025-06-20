import { pgTable, text, serial, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalContent: text("original_content").notNull(),
  optimizedContent: text("optimized_content"),
  industry: text("industry").notNull(),
  atsScore: integer("ats_score"),
  analysis: json("analysis").$type<ResumeAnalysis>(),
  suggestions: json("suggestions").$type<ResumeSuggestion[]>(),
  skillsGap: json("skills_gap").$type<SkillGap[]>(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  resumesAnalyzed: integer("resumes_analyzed").default(0),
  avgScore: integer("avg_score").default(0),
  interviews: integer("interviews").default(0),
  totalOptimizations: integer("total_optimizations").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
});

export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  industry: text("industry").notNull(),
  skills: json("skills").$type<AssessedSkill[]>(),
  overallScore: integer("overall_score"),
  recommendations: json("recommendations").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'upload', 'analyze', 'optimize', 'login', etc.
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced types for analysis data
export interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  keywordMatch: number;
  formatting: number;
  content: number;
  readability: number;
  atsCompatibility: number;
  employmentGaps?: EmploymentGap[];
  sectionAnalysis: SectionAnalysis[];
  industryAlignment: number;
  competitiveAnalysis?: CompetitiveAnalysis;
}

export interface SectionAnalysis {
  section: string;
  score: number;
  feedback: string;
  suggestions: string[];
  missingElements?: string[];
}

export interface CompetitiveAnalysis {
  percentile: number;
  comparison: string;
  benchmarkScore: number;
  improvementPotential: number;
}

export interface ResumeSuggestion {
  id: number;
  type: 'keywords' | 'quantify' | 'section' | 'formatting' | 'employment_gap' | 'template' | 'content' | 'structure';
  title: string;
  description: string;
  keywords?: string[];
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'difficult';
  category: string;
  beforeExample?: string;
  afterExample?: string;
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  importance: number;
  marketDemand: number;
  learningResources?: LearningResource[];
}

export interface LearningResource {
  title: string;
  type: 'course' | 'certification' | 'book' | 'practice';
  provider: string;
  url?: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface EmploymentGap {
  startDate: string;
  endDate: string;
  duration: number; // in months
  severity: 'minor' | 'moderate' | 'significant';
  recommendations: string[];
  explanationSuggestions: string[];
}

export interface AssessedSkill {
  name: string;
  currentLevel: number;
  targetLevel: number;
  importance: number;
  confidence: number;
}

export interface ResumeTemplate {
  id: string;
  industry: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  keywords: string[];
  formatting: TemplateFormatting;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export interface TemplateSection {
  name: string;
  required: boolean;
  order: number;
  content: string;
  tips: string[];
  examples?: string[];
}

export interface TemplateFormatting {
  font: string;
  fontSize: string;
  margins: string;
  spacing: string;
  bulletStyle: string;
  colorScheme?: string;
}

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  lastActivityAt: true,
});

export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Login/Register schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;