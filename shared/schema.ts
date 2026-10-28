import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  department: text("department").notNull(),
  jobTitle: text("job_title").notNull(),
  startDate: date("start_date"),
  onboardingStep: integer("onboarding_step").notNull().default(1),
  lastVisitedPage: text("last_visited_page"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("employee"), // "employee", "manager", or "admin"
  onboardingData: jsonb("onboarding_data"), // Day 1 onboarding progress data
  adminOnboardingStep: integer("admin_onboarding_step").notNull().default(1),
  adminOnboardingData: jsonb("admin_onboarding_data"), // Admin onboarding configuration data
  adminOnboardingCompletedAt: timestamp("admin_onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  category: text("category").default("cadet").notNull(), // "onboarding" or "cadet"
  uploadedBy: integer("uploaded_by").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata"), // RAG: extracted metadata (department, region, docType, etc.)
});

export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  level: text("level").notNull(), // "document" | "section" | "paragraph" | "sentence"
  order: integer("order").notNull(),
  text: text("text").notNull(),
  section: text("section"),
  embedding: jsonb("embedding"), // OpenAI embedding vector
  department: text("department"),
  region: text("region"),
  docType: text("doc_type"),
  effectiveDateISO: text("effective_date_iso"),
  complianceTags: text("compliance_tags").array(),
});

export const documentTables = pgTable("document_tables", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  section: text("section"),
  csv: jsonb("csv").notNull(), // 2D array of table data
  summary: text("summary").notNull(),
});

export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // presentation, study notes
  details: text("details"),
  content: jsonb("content").notNull(),
  fileUrl: text("file_url"), // URL to generated file (PPTX/PDF)
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conversationId: integer("conversation_id"),
  isUserMessage: boolean("is_user_message").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const externalTokens = pgTable("external_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull(), // "google" or "microsoft"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  tokenData: jsonb("token_data"), // Store complete token response
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks created by the AI agent or managers (local single-tenant mode)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // "todo" | "in_progress" | "done"
  assignedToEmail: text("assigned_to_email").notNull(),
  createdByEmail: text("created_by_email").notNull(),
  dueAt: timestamp("due_at"),
  source: text("source").default("help_center"),
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support tickets filed via the AI agent (local single-tenant mode)
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  orgId: text("org_id").notNull(),
  createdByEmail: text("created_by_email").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("open"), // "open" | "closed"
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Buddy/mentor assignments made via the AI agent (local single-tenant mode)
export const buddyAssignments = pgTable("buddy_assignments", {
  id: serial("id").primaryKey(),
  orgId: text("org_id").notNull(),
  employeeEmail: text("employee_email").notNull(),
  buddyEmail: text("buddy_email").notNull(),
  assignedByEmail: text("assigned_by_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Help center analytics events (questions asked, answers shown, actions executed)
export const helpCenterEvents = pgTable("help_center_events", {
  id: serial("id").primaryKey(),
  orgId: text("org_id").notNull(),
  userEmail: text("user_email").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company-wide configuration for onboarding content
export const companyConfig = pgTable("company_config", {
  id: serial("id").primaryKey(),
  // HR Benefits content - each item has title, description, and detailed content
  benefitsContent: jsonb("benefits_content"), // Array of {id, title, description, content}
  // Compliance modules content
  complianceContent: jsonb("compliance_content"), // Array of {id, title, description, content, required}
  // Org chart data
  orgChart: jsonb("org_chart"), // Array of {id, name, role, email, managerId, department}
  // Sandbox task configuration
  sandboxTask: jsonb("sandbox_task"), // {title, description, instructions}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertExternalTokenSchema = createInsertSchema(externalTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyConfigSchema = createInsertSchema(companyConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChunkSchema = createInsertSchema(chunks).omit({
  id: true,
});

export const insertDocumentTableSchema = createInsertSchema(documentTables).omit({
  id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
});

export const insertBuddyAssignmentSchema = createInsertSchema(buddyAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertHelpCenterEventSchema = createInsertSchema(helpCenterEvents).omit({
  id: true,
  createdAt: true,
});

// Infer types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type StudyMaterial = typeof studyMaterials.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertExternalToken = z.infer<typeof insertExternalTokenSchema>;
export type ExternalToken = typeof externalTokens.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertCompanyConfig = z.infer<typeof insertCompanyConfigSchema>;
export type CompanyConfig = typeof companyConfig.$inferSelect;

export type InsertChunk = z.infer<typeof insertChunkSchema>;
export type Chunk = typeof chunks.$inferSelect;

export type InsertDocumentTable = z.infer<typeof insertDocumentTableSchema>;
export type DocumentTable = typeof documentTables.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertBuddyAssignment = z.infer<typeof insertBuddyAssignmentSchema>;
export type BuddyAssignment = typeof buddyAssignments.$inferSelect;

export type InsertHelpCenterEvent = z.infer<typeof insertHelpCenterEventSchema>;
export type HelpCenterEvent = typeof helpCenterEvents.$inferSelect;

// Additional schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationId: z.number().optional(),
  userEmail: z.string().email().optional(),
});

export const generateStudyMaterialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["presentation", "studyNotes"], {
    invalid_type_error: "Invalid study material type",
  }),
  details: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Help Center / Multi-tenant schemas
// -----------------------------------------------------------------------------

export const OrgRoleSchema = z.enum(["admin", "manager", "employee"]);
export type OrgRole = z.infer<typeof OrgRoleSchema>;

export const HelpCenterActionTypeSchema = z.enum([
  "create_task",
  "open_link",
  "file_ticket",
  "assign_buddy",
  "schedule_checkin",
]);
export type HelpCenterActionType = z.infer<typeof HelpCenterActionTypeSchema>;

export const HelpCenterActionModeSchema = z.enum(["auto", "approval"]);
export type HelpCenterActionMode = z.infer<typeof HelpCenterActionModeSchema>;

export const HelpCenterActionRequestSchema = z.object({
  orgId: z.string().uuid(),
  userEmail: z.string().email(),
  actionType: HelpCenterActionTypeSchema,
  actionPayload: z.record(z.string(), z.any()).default({}),
});
export type HelpCenterActionRequest = z.infer<typeof HelpCenterActionRequestSchema>;

export const HelpCenterAskRequestSchema = z.object({
  orgId: z.string().uuid(),
  userEmail: z.string().email(),
  question: z.string().min(1),
  page: z.string().optional(),
  actionMode: HelpCenterActionModeSchema.default("approval"),
  debug: z
    .object({
      includePlan: z.boolean().default(false),
    })
    .optional(),
});
export type HelpCenterAskRequest = z.infer<typeof HelpCenterAskRequestSchema>;

export const HelpCenterCitationSchema = z.object({
  docId: z.string(),
  title: z.string(),
  snippet: z.string(),
  url: z.string().optional().nullable(),
  score: z.number().optional().nullable(),
});
export type HelpCenterCitation = z.infer<typeof HelpCenterCitationSchema>;

export const HelpCenterSuggestedActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  actionType: HelpCenterActionTypeSchema,
  actionPayload: z.record(z.string(), z.any()).default({}),
});
export type HelpCenterSuggestedAction = z.infer<typeof HelpCenterSuggestedActionSchema>;

export const HelpCenterAskResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(HelpCenterCitationSchema).default([]),
  suggestedActions: z.array(HelpCenterSuggestedActionSchema).default([]),
  needsEscalation: z.boolean().default(false),
  plan: z.string().optional().nullable(),
});
export type HelpCenterAskResponse = z.infer<typeof HelpCenterAskResponseSchema>;

export const CsvOrgImportRowSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: OrgRoleSchema,
  department: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  managerEmail: z.string().email().optional().nullable(),
  startDate: z.string().optional().nullable(),
});
export type CsvOrgImportRow = z.infer<typeof CsvOrgImportRowSchema>;
