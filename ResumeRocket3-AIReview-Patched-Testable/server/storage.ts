import { 
  resumes, 
  userStats,
  skillAssessments,
  auditLogs,
  users,
  type Resume, 
  type InsertResume,
  type UserStats,
  type InsertUser,
  type User,
  type SkillAssessment,
  type InsertSkillAssessmentSchema,
  type AuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<void>;
  
  // Resume management
  createResume(resume: InsertResume): Promise<Resume>;
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUser(userId: number): Promise<Resume[]>;
  getAllResumes(limit?: number, offset?: number): Promise<Resume[]>;
  updateResume(id: number, updates: Partial<InsertResume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // User stats
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats>;
  
  // Skill assessments
  createSkillAssessment(assessment: any): Promise<SkillAssessment>;
  getSkillAssessmentsByUser(userId: number): Promise<SkillAssessment[]>;
  
  // Audit logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  
  // Admin functions
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  getResumeCount(): Promise<number>;
  getAnalyticsData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create default user stats
    await db.insert(userStats).values({
      userId: user.id,
      resumesAnalyzed: 0,
      avgScore: 0,
      interviews: 0,
      totalOptimizations: 0,
    });
    
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const [resume] = await db.insert(resumes).values({
      ...insertResume,
      updatedAt: new Date(),
    }).returning();
    return resume;
  }

  async getResume(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  async getResumesByUser(userId: number): Promise<Resume[]> {
    return db.select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  }

  async getAllResumes(limit = 50, offset = 0): Promise<Resume[]> {
    return db.select()
      .from(resumes)
      .orderBy(desc(resumes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateResume(id: number, updates: Partial<InsertResume>): Promise<Resume | undefined> {
    const [resume] = await db.update(resumes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resumes.id, id))
      .returning();
    return resume;
  }

  async deleteResume(id: number): Promise<boolean> {
    const result = await db.delete(resumes).where(eq(resumes.id, id));
    return result.rowCount > 0;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async updateUserStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    const [stats] = await db.update(userStats)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return stats;
  }

  async createSkillAssessment(assessment: any): Promise<SkillAssessment> {
    const [result] = await db.insert(skillAssessments).values(assessment).returning();
    return result;
  }

  async getSkillAssessmentsByUser(userId: number): Promise<SkillAssessment[]> {
    return db.select()
      .from(skillAssessments)
      .where(eq(skillAssessments.userId, userId))
      .orderBy(desc(skillAssessments.createdAt));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    return db.select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getResumeCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(resumes);
    return result.count;
  }

  async getAnalyticsData(): Promise<any> {
    // Get various analytics data
    const [userCount] = await db.select({ count: count() }).from(users);
    const [resumeCount] = await db.select({ count: count() }).from(resumes);
    
    // Get average ATS score
    const [avgScore] = await db.select({ 
      avg: sql<number>`AVG(${resumes.atsScore})` 
    }).from(resumes).where(sql`${resumes.atsScore} IS NOT NULL`);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentResumes] = await db.select({ count: count() })
      .from(resumes)
      .where(sql`${resumes.createdAt} >= ${thirtyDaysAgo}`);
    
    const [recentUsers] = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);

    return {
      totalUsers: userCount.count,
      totalResumes: resumeCount.count,
      averageAtsScore: Math.round(avgScore.avg || 0),
      recentResumes: recentResumes.count,
      recentUsers: recentUsers.count,
    };
  }
}

// Create storage instance
export const storage = new DatabaseStorage();