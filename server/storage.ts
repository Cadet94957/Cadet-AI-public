import {
  users,
  type User,
  type InsertUser,
  documents,
  type Document,
  type InsertDocument,
  studyMaterials,
  type StudyMaterial,
  type InsertStudyMaterial,
  conversations,
  type Conversation,
  type InsertConversation,
  chatMessages,
  type ChatMessage,
  type InsertChatMessage,
  externalTokens,
  type ExternalToken,
  type InsertExternalToken,
  chunks,
  type Chunk,
  type InsertChunk,
  documentTables,
  type DocumentTable,
  type InsertDocumentTable,
  companyConfig,
  type CompanyConfig,
  type InsertCompanyConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

// define the storage interface with all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProgress(id: number, progress: {
    onboardingStep?: number;
    lastVisitedPage?: string;
    onboardingCompletedAt?: Date | null;
    onboardingData?: any;
    adminOnboardingStep?: number;
    adminOnboardingData?: any;
    adminOnboardingCompletedAt?: Date | null;
  }): Promise<User>;

  // Document methods
  getDocuments(filters?: {
    category?: string;
    fileType?: string;
  }): Promise<(Document & { uploaderRole?: string })[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByIds(ids: number[]): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(
    id: number,
    updates: Partial<Pick<Document, "title" | "description" | "thumbnailUrl" | "metadata">>,
  ): Promise<Document | undefined>;
  incrementDocumentViews(id: number): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Study Material methods
  getStudyMaterials(userId: number, type?: string): Promise<StudyMaterial[]>;
  getStudyMaterial(id: number): Promise<StudyMaterial | undefined>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  deleteStudyMaterial(id: number): Promise<boolean>;

  // Conversation methods
  getConversations(userId: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationTitle(
    id: number,
    title: string,
  ): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;

  // Chat Message methods
  getChatMessages(conversationId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // External Token methods
  getGoogleTokens(userId: number): Promise<any | null>;
  getMicrosoftTokens(userId: number): Promise<any | null>;
  saveGoogleTokens(userId: number, tokens: any): Promise<ExternalToken>;
  saveMicrosoftTokens(userId: number, tokens: any): Promise<ExternalToken>;
  deleteGoogleTokens(userId: number): Promise<boolean>;
  deleteMicrosoftTokens(userId: number): Promise<boolean>;

  // Chunk methods (RAG)
  bulkUpsertChunks(chunks: InsertChunk[]): Promise<void>;
  listChunks(documentId?: number): Promise<Chunk[]>;

  // Document Table methods (RAG)
  bulkUpsertTables(tables: InsertDocumentTable[]): Promise<void>;
  listTablesByDocumentId(documentId: number): Promise<DocumentTable[]>;

  // Company Config methods
  getCompanyConfig(): Promise<CompanyConfig | undefined>;
  updateCompanyConfig(config: Partial<InsertCompanyConfig>): Promise<CompanyConfig>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Recent questions employees asked the AI — signal for knowledge gaps.
  async getRecentUserQuestions(limit = 50): Promise<Array<{ userId: number; content: string; createdAt: Date }>> {
    const rows = await db
      .select({
        userId: chatMessages.userId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.isUserMessage, true))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return rows;
  }

  async updateUserProgress(id: number, progress: {
    onboardingStep?: number;
    lastVisitedPage?: string;
    onboardingCompletedAt?: Date | null;
    onboardingData?: any;
    adminOnboardingStep?: number;
    adminOnboardingData?: any;
    adminOnboardingCompletedAt?: Date | null;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(progress)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Document methods
  async getDocuments(filters?: {
    category?: string;
    fileType?: string;
  }): Promise<(Document & { uploaderRole?: string })[]> {
    let baseQuery = db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        fileName: documents.fileName,
        fileType: documents.fileType,
        fileSize: documents.fileSize,
        category: documents.category,
        uploadedBy: documents.uploadedBy,
        viewCount: documents.viewCount,
        thumbnailUrl: documents.thumbnailUrl,
        createdAt: documents.createdAt,
        uploaderRole: users.role,
      })
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.id));

    if (filters) {
      const conditions = [];

      if (filters.category) {
        conditions.push(eq(documents.category, filters.category));
      }

      if (filters.fileType) {
        conditions.push(eq(documents.fileType, filters.fileType));
      }

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
      }
    }

    const result = await baseQuery.orderBy(desc(documents.createdAt));
    return result as (Document & { uploaderRole?: string })[];
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByIds(ids: number[]): Promise<Document[]> {
    if (ids.length === 0) return [];
    return await db
      .select()
      .from(documents)
      .where(inArray(documents.id, ids));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(
    id: number,
    updates: Partial<Pick<Document, "title" | "description" | "thumbnailUrl" | "metadata">>,
  ): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async incrementDocumentViews(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!document) {
      return undefined;
    }

    const [updatedDocument] = await db
      .update(documents)
      .set({ viewCount: document.viewCount + 1 })
      .where(eq(documents.id, id))
      .returning();

    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
    return true; // In Drizzle, delete doesn't return the number of affected rows
  }

  // Get documents by category for RAG
  async getOnboardingDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.category, "onboarding"))
      .orderBy(desc(documents.createdAt));
  }

  async getCadetDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.category, "cadet"))
      .orderBy(desc(documents.createdAt));
  }

  // Update document category
  async updateDocumentCategory(id: number, category: string): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ category })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  // External token methods
  async saveGoogleTokens(userId: number, tokens: any): Promise<ExternalToken> {
    // First try to update existing token
    const existingToken = await db
      .select()
      .from(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "google")))
      .limit(1);

    const tokenData = {
      userId,
      provider: "google" as const,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      tokenData: tokens,
    };

    if (existingToken.length > 0) {
      const [updatedToken] = await db
        .update(externalTokens)
        .set({ ...tokenData, updatedAt: new Date() })
        .where(eq(externalTokens.id, existingToken[0].id))
        .returning();
      return updatedToken;
    } else {
      const [newToken] = await db
        .insert(externalTokens)
        .values(tokenData)
        .returning();
      return newToken;
    }
  }

  async getGoogleTokens(userId: number): Promise<any | null> {
    const [token] = await db
      .select()
      .from(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "google")))
      .limit(1);
    
    return token ? token.tokenData : null;
  }

  async saveMicrosoftTokens(userId: number, tokens: any): Promise<ExternalToken> {
    // First try to update existing token
    const existingToken = await db
      .select()
      .from(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "microsoft")))
      .limit(1);

    const tokenData = {
      userId,
      provider: "microsoft" as const,
      accessToken: tokens.accessToken || tokens.access_token,
      refreshToken: tokens.refreshToken || tokens.refresh_token,
      expiresAt: tokens.expiresOn ? new Date(tokens.expiresOn) : null,
      tokenData: tokens,
    };

    if (existingToken.length > 0) {
      const [updatedToken] = await db
        .update(externalTokens)
        .set({ ...tokenData, updatedAt: new Date() })
        .where(eq(externalTokens.id, existingToken[0].id))
        .returning();
      return updatedToken;
    } else {
      const [newToken] = await db
        .insert(externalTokens)
        .values(tokenData)
        .returning();
      return newToken;
    }
  }

  async getMicrosoftTokens(userId: number): Promise<any | null> {
    const [token] = await db
      .select()
      .from(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "microsoft")))
      .limit(1);
    
    return token ? token.tokenData : null;
  }

  async deleteGoogleTokens(userId: number): Promise<boolean> {
    await db
      .delete(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "google")));
    return true;
  }

  async deleteMicrosoftTokens(userId: number): Promise<boolean> {
    await db
      .delete(externalTokens)
      .where(and(eq(externalTokens.userId, userId), eq(externalTokens.provider, "microsoft")));
    return true;
  }

  // Chunk methods (RAG)
  async bulkUpsertChunks(chunksToInsert: InsertChunk[]): Promise<void> {
    if (chunksToInsert.length === 0) return;
    
    // Delete existing chunks for these documents
    const documentIds = Array.from(new Set(chunksToInsert.map(c => c.documentId)));
    for (const docId of documentIds) {
      await db.delete(chunks).where(eq(chunks.documentId, docId));
    }
    
    // Insert new chunks
    await db.insert(chunks).values(chunksToInsert);
  }

  async listChunks(documentId?: number): Promise<Chunk[]> {
    if (documentId === undefined) {
      return await db
        .select()
        .from(chunks)
        .orderBy(asc(chunks.documentId), asc(chunks.order));
    }
    return await db
      .select()
      .from(chunks)
      .where(eq(chunks.documentId, documentId))
      .orderBy(asc(chunks.order));
  }

  // Document Table methods (RAG)
  async bulkUpsertTables(tablesToInsert: InsertDocumentTable[]): Promise<void> {
    if (tablesToInsert.length === 0) return;
    
    // Delete existing tables for these documents
    const documentIds = Array.from(new Set(tablesToInsert.map(t => t.documentId)));
    for (const docId of documentIds) {
      await db.delete(documentTables).where(eq(documentTables.documentId, docId));
    }
    
    // Insert new tables
    await db.insert(documentTables).values(tablesToInsert);
  }

  async listTablesByDocumentId(documentId: number): Promise<DocumentTable[]> {
    return await db
      .select()
      .from(documentTables)
      .where(eq(documentTables.documentId, documentId));
  }

  // Study Material methods
  async getStudyMaterials(
    userId: number,
    type?: string,
  ): Promise<StudyMaterial[]> {
    const whereConditions = [eq(studyMaterials.createdBy, userId)];
    
    if (type) {
      whereConditions.push(eq(studyMaterials.type, type));
    }

    return await db
      .select()
      .from(studyMaterials)
      .where(and(...whereConditions))
      .orderBy(desc(studyMaterials.createdAt));
  }

  async getStudyMaterial(id: number): Promise<StudyMaterial | undefined> {
    const [material] = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.id, id));
    return material;
  }

  async createStudyMaterial(
    insertMaterial: InsertStudyMaterial,
  ): Promise<StudyMaterial> {
    const [material] = await db
      .insert(studyMaterials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async deleteStudyMaterial(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(studyMaterials)
        .where(eq(studyMaterials.id, id));
      console.log("Delete result:", result);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting study material:", error);
      return false;
    }
  }

  // Conversation methods
  async getConversations(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(
    insertConversation: InsertConversation,
  ): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversationTitle(
    id: number,
    title: string,
  ): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  // Chat Message methods
  async getChatMessages(conversationId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(
    insertMessage: InsertChatMessage,
  ): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();

    // Update the conversation's updatedAt timestamp
    if (insertMessage.conversationId) {
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, insertMessage.conversationId));
    }

    return message;
  }

  async deleteConversation(id: number): Promise<boolean> {
    try {
      // First delete all chat messages in this conversation
      await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));

      // Then delete the conversation
      const result = await db
        .delete(conversations)
        .where(eq(conversations.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  }

  // Company Config methods
  async getCompanyConfig(): Promise<CompanyConfig | undefined> {
    const [config] = await db.select().from(companyConfig).limit(1);
    return config;
  }

  async updateCompanyConfig(config: Partial<InsertCompanyConfig>): Promise<CompanyConfig> {
    const existingConfig = await this.getCompanyConfig();
    
    if (existingConfig) {
      // Update existing config
      const [updated] = await db
        .update(companyConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(companyConfig.id, existingConfig.id))
        .returning();
      return updated;
    } else {
      // Create new config
      const [newConfig] = await db
        .insert(companyConfig)
        .values(config as InsertCompanyConfig)
        .returning();
      return newConfig;
    }
  }
}

// Note: Database seeding removed since we're using Supabase for authentication

export const storage = new DatabaseStorage();
