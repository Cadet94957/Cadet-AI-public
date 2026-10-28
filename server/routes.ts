import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  users,
  insertUserSchema,
  insertDocumentSchema, 
  insertChatMessageSchema, 
  insertStudyMaterialSchema,
  chatRequestSchema,
  generateStudyMaterialSchema
} from "@shared/schema";
import { answerWithRag, generateStudyMaterial, generateConversationTitle, type ChatHistoryMessage } from "./lib/openai";
import { hashPassword, verifyPassword } from "./lib/auth";
import OpenAI from "openai";
import { generateThumbnail, deleteThumbnail } from "./lib/thumbnail-generator";
import { registerExternalIntegrationRoutes } from "./lib/externalIntegrationRoutes";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { scoreDocument } from "./lib/quality";
import { ingestDocument, retrieveContext } from "./lib/retrieval";
import { createCadetSelectiveVectorRagRouter } from "./cadet_selective_vector_rag_plugin";
import { TenantRegistry } from "./tenancy/tenantRegistry";
import { createTenantMiddleware } from "./tenancy/tenantMiddleware";
import { createHelpCenterRouter } from "./helpCenter/router";
import { createAdminRouter } from "./admin/router";
import { createManagerRouter } from "./manager/router";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the Cadet selective-vector RAG router
  app.use("/api", createCadetSelectiveVectorRagRouter());

  // Multi-tenant middleware and Help Center router
  const tenantRegistry = new TenantRegistry();
  tenantRegistry.loadFromEnv();
  
  app.use("/api", createTenantMiddleware(tenantRegistry));
  // Initialize OpenAI for Help Center direct calls
  const helpCenterOpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  app.use("/api", createHelpCenterRouter({
    retrieval: {
      async retrieve(orgId, userEmail, query) {
        // Use proper RAG retrieval with embeddings
        // Note: In this deployment, documents are stored locally per org. 
        // For true multi-tenant isolation, filter by orgId when implemented.
        const user = await storage.getUserByUsername(userEmail);
        const { contexts, usedDocuments } = await retrieveContext(query, {
          userRole: user?.role,
          department: user?.department,
          limit: 8,
        });

        return contexts.map((chunk) => {
          const doc = usedDocuments.find(d => d.id === chunk.documentId);
          return {
            docId: String(chunk.documentId),
            title: doc?.title || `Document #${chunk.documentId}`,
            snippet: chunk.text,
            url: doc ? `/api/files/${doc.fileName}` : null,
            score: chunk.score ?? null,
          };
        });
      },
    },
    llm: {
      async complete(input) {
        // Call OpenAI directly with pre-retrieved context (no re-retrieval)
        const contextBlock = input.contextChunks.length > 0
          ? input.contextChunks
              .map((c, idx) => `[${idx + 1}] ${c.snippet}\nSOURCE: ${c.title}`)
              .join("\n\n")
          : "(No relevant company documents were found for this question. Say so honestly, offer general guidance, and consider suggesting a ticket or check-in.)";

        // Personalize with the asker's role/department when we know them.
        let profileBlock = "";
        try {
          const asker = await storage.getUserByUsername(input.userEmail);
          if (asker) {
            profileBlock = `\n\nEmployee profile: ${asker.displayName}, role=${asker.role}, department=${asker.department}, jobTitle=${asker.jobTitle}`;
          }
        } catch {
          // Profile lookup is best-effort only.
        }

        const userMessage = `Question:\n${input.user}\n\nContext (ground truth):\n${contextBlock}${profileBlock}`;

        const structuredSystem = `${input.system}

Respond with a JSON object with exactly these keys:
- "answer": string — your answer, grounded in the provided context. Cite snippets with bracketed numbers [1], [2] matching them.
- "plan": string — a short high-level summary (max 5 bullets) of how you approached the question.
- "suggestedActions": array of objects, each {"label": string, "actionType": one of "create_task"|"open_link"|"file_ticket"|"assign_buddy"|"schedule_checkin", "actionPayload": object}. Propose at most 2 actions and ONLY when they clearly help (e.g. file_ticket when context is missing and the question matters, create_task for follow-ups the employee should do, schedule_checkin when a manager conversation is warranted). Usually this is an empty array.
- "needsEscalation": boolean — true when the question involves HR-sensitive issues, legal/compliance concerns, or you could not answer from context.`;

        try {
          const response = await helpCenterOpenAI.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: structuredSystem },
              { role: "user", content: userMessage },
            ],
          });

          const raw = response.choices[0]?.message?.content ?? "{}";
          let parsed: any = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { answer: raw };
          }

          const allowedActionTypes = new Set(["create_task", "open_link", "file_ticket", "assign_buddy", "schedule_checkin"]);
          const suggestedActions = Array.isArray(parsed.suggestedActions)
            ? parsed.suggestedActions
                .filter((a: any) => a && typeof a.label === "string" && allowedActionTypes.has(a.actionType))
                .slice(0, 2)
                .map((a: any, idx: number) => ({
                  id: `action-${Date.now()}-${idx}`,
                  label: a.label,
                  actionType: a.actionType,
                  actionPayload: (a.actionPayload && typeof a.actionPayload === "object") ? a.actionPayload : {},
                }))
            : [];

          return {
            answer: typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer : "No answer generated.",
            plan: input.includePlan ? (typeof parsed.plan === "string" ? parsed.plan : null) : null,
            suggestedActions,
            needsEscalation: Boolean(parsed.needsEscalation),
          };
        } catch (error) {
          console.error("Help Center LLM error:", error);
          return {
            answer: "Sorry, I ran into an error answering that question.",
            plan: null,
            suggestedActions: [],
            needsEscalation: true,
          };
        }
      },
    },
  }));

  // Admin + Manager routers (org import, metrics, buddy assignment) — served
  // by the tenant middleware's storage (Supabase per-tenant or local fallback).
  app.use("/api", createAdminRouter());
  app.use("/api", createManagerRouter());

  // Get current user - supports user switching
  app.get("/api/me", async (req, res) => {
    const userId = parseInt(req.query.userId as string) || 1;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send the password back
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Get all users for user switching
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      
      // Remove passwords from response
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      
      console.log("Fetched users from DB:", usersWithoutPasswords); // Debug log
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Register a new user with a securely hashed password
  app.post("/api/register", async (req, res) => {
    try {
      const {
        email,
        password: rawPassword,
        firstName,
        lastName,
        displayName,
        phone,
        department,
        jobTitle,
        startDate,
        role = 'employee'
      } = req.body;

      if (!email || !rawPassword || !firstName || !lastName || !department || !jobTitle) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ["email", "password", "firstName", "lastName", "department", "jobTitle"]
        });
      }

      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }

      const validatedData = insertUserSchema.parse({
        username: email,
        password: await hashPassword(rawPassword),
        firstName,
        lastName,
        displayName: displayName || `${firstName} ${lastName}`,
        email,
        phone: phone || '',
        department,
        jobTitle,
        startDate: startDate || undefined,
        role
      });

      const newUser = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid user data", errors: (error as any).errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login with email + password (scrypt-hashed accounts created via /api/register)
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password: rawPassword } = req.body;
      if (!email || !rawPassword) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByUsername(email);
      if (!user || !(await verifyPassword(rawPassword, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            jobTitle: user.jobTitle
          }
        }
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Sync Supabase user to local database
  app.post("/api/sync-user", async (req, res) => {
    try {
      const {
        supabaseId,
        email,
        firstName,
        lastName,
        displayName,
        phone,
        department,
        jobTitle,
        startDate,
        role = 'employee'
      } = req.body;

      if (!supabaseId || !email || !firstName || !lastName || !displayName || !department || !jobTitle) {
        return res.status(400).json({ 
          message: "Missing required fields",
          required: ["supabaseId", "email", "firstName", "lastName", "displayName", "department", "jobTitle"]
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      
      if (existingUser) {
        console.log("User already exists in local database:", email);
        const { password, ...userWithoutPassword } = existingUser;
        return res.json({ 
          message: "User already exists", 
          user: userWithoutPassword 
        });
      }

      // Create user data for local database
      const userData = {
        username: email,
        password: 'supabase_auth', // Placeholder since auth is handled by Supabase
        firstName,
        lastName,
        displayName,
        email,
        phone: phone || '',
        department,
        jobTitle,
        startDate: startDate ? new Date(startDate) : undefined,
        role
      };

      // Validate data against schema
      const validatedData = insertUserSchema.parse(userData);
      
      // Create user in local database
      const newUser = await storage.createUser(validatedData);
      
      console.log("Created new user in local database:", newUser.email);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json({ 
        message: "User synced successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Error syncing user:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: (error as any).errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to sync user", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // User progress tracking endpoints
  app.get("/api/user-progress/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // TODO: Add proper session-based authentication here
      // For now, we're using email validation as a basic security measure
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        onboardingStep: user.onboardingStep,
        lastVisitedPage: user.lastVisitedPage,
        onboardingCompletedAt: user.onboardingCompletedAt,
        onboardingData: user.onboardingData,
        adminOnboardingStep: user.adminOnboardingStep,
        adminOnboardingData: user.adminOnboardingData,
        adminOnboardingCompletedAt: user.adminOnboardingCompletedAt,
        firstName: user.firstName
      });
    } catch (error) {
      console.error("Error getting user progress:", error);
      res.status(500).json({ 
        message: "Failed to get user progress", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/update-progress", async (req, res) => {
    try {
      const { 
        email, 
        onboardingStep, 
        lastVisitedPage, 
        onboardingCompletedAt, 
        onboardingData,
        adminOnboardingStep,
        adminOnboardingData,
        adminOnboardingCompletedAt
      } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserProgress(user.id, {
        onboardingStep,
        lastVisitedPage,
        onboardingCompletedAt,
        onboardingData,
        adminOnboardingStep,
        adminOnboardingData,
        adminOnboardingCompletedAt
      });

      res.json({
        message: "Progress updated successfully",
        onboardingStep: updatedUser.onboardingStep,
        lastVisitedPage: updatedUser.lastVisitedPage,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
        onboardingData: updatedUser.onboardingData,
        adminOnboardingStep: updatedUser.adminOnboardingStep,
        adminOnboardingData: updatedUser.adminOnboardingData,
        adminOnboardingCompletedAt: updatedUser.adminOnboardingCompletedAt
      });
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ 
        message: "Failed to update user progress", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Resolve a user id from an optional email, falling back to the demo user.
  async function resolveUserId(userEmail?: string | null): Promise<number> {
    if (userEmail) {
      const user = await storage.getUserByUsername(userEmail);
      if (user) return user.id;
    }
    return 1;
  }

  // Conversation endpoints
  app.get("/api/conversations", async (req, res) => {
    const userId = await resolveUserId(req.query.userEmail as string | undefined);
    const conversations = await storage.getConversations(userId);
    res.json(conversations);
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const title = req.body.title || "New Conversation";
      const userId = await resolveUserId(req.body.userEmail);

      const conversation = await storage.createConversation({
        userId,
        title
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "An error occurred creating the conversation" });
    }
  });

  // Append a message to a conversation (used by the AI assistant widget to
  // persist help-center chats so history survives reloads).
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const { content, isUserMessage, userEmail } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "content is required" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const userId = await resolveUserId(userEmail);
      const message = await storage.createChatMessage({
        userId,
        conversationId,
        isUserMessage: Boolean(isUserMessage),
        content
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error appending message:", error);
      res.status(500).json({ message: "An error occurred saving the message" });
    }
  });

  app.patch("/api/conversations/:id/title", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      const conversation = await storage.updateConversationTitle(id, title);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "An error occurred updating the conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteConversation(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "An error occurred deleting the conversation" });
    }
  });

  // Chat endpoints
  app.get("/api/chat/messages/:conversationId", async (req, res) => {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }
    
    const messages = await storage.getChatMessages(conversationId);
    res.json(messages);
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const validatedData = chatRequestSchema.parse(req.body);
      const userId = await resolveUserId(validatedData.userEmail);

      // Create conversation if not provided
      let conversationId = validatedData.conversationId;
      if (!conversationId) {
        // Generate intelligent title from first message
        const conversationTitle = await generateConversationTitle(validatedData.message);

        const conversation = await storage.createConversation({
          userId,
          title: conversationTitle
        });

        conversationId = conversation.id;
      }

      // Load prior turns so the assistant has conversational memory. The
      // window is capped inside answerWithRag to protect the context limit.
      const priorMessages = await storage.getChatMessages(conversationId);
      const history: ChatHistoryMessage[] = priorMessages.map(m => ({
        role: m.isUserMessage ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      // Store user message
      const userMessage = await storage.createChatMessage({
        userId,
        conversationId,
        isUserMessage: true,
        content: validatedData.message
      });

      const systemContext = `You are an AI onboarding assistant integrated into an employee onboarding software platform. Your primary role is to assist new employees in understanding the company's procedures, role-specific responsibilities, and help them navigate and learn from training materials.

Ground every company-specific claim in the provided context snippets and cite them with bracketed numbers [1], [2] matching the snippets. If the answer isn't in the context, say you don't have that information and point the employee to the closest relevant document or to their manager/HR — never invent policies.

Tailor your tone to be friendly, professional, and supportive, as if you're a helpful and knowledgeable coworker guiding them through their first days. When appropriate, suggest next steps or related topics the employee should be aware of.`;

      // Retrieval-augmented answer over the ingested document chunks
      const { content: botResponse, citations } = await answerWithRag(validatedData.message, {
        customSystemContext: systemContext,
        userEmail: validatedData.userEmail,
        history,
      });

      // Store bot response
      const botMessage = await storage.createChatMessage({
        userId,
        conversationId,
        isUserMessage: false,
        content: botResponse
      });

      res.json({
        conversationId,
        userMessage,
        botMessage,
        citations
      });
    } catch (error) {
      console.error("Error in chat send:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: (error as any).errors });
      }
      res.status(500).json({ message: "An error occurred processing your request" });
    }
  });

  // Study materials endpoints
  app.get("/api/study-materials", async (req, res) => {
    const type = req.query.type as string | undefined;
    const materials = await storage.getStudyMaterials(1, type); // Using user ID 1 for now
    res.json(materials);
  });

  app.get("/api/study-materials/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const material = await storage.getStudyMaterial(id);
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    res.json(material);
  });

  app.delete("/api/study-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Attempting to delete study material with ID:', id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const material = await storage.getStudyMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Study material not found" });
      }

      // Delete associated file if it exists
      if (material.fileUrl) {
        try {
          const filename = path.basename(material.fileUrl);
          const filePath = path.join(process.cwd(), "uploads", "generated", filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted generated file:', filePath);
          }
        } catch (error) {
          console.error("Error deleting generated file:", error);
        }
      }

      const success = await storage.deleteStudyMaterial(id);
      console.log('Delete operation success:', success);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete study material" });
      }
    } catch (error) {
      console.error('Error in delete route:', error);
      res.status(500).json({ message: "Failed to delete study material" });
    }
  });

  app.post("/api/study-materials/generate", async (req, res) => {
    try {
      const { title, type, details, format, theme, slideCount } = req.body;
      console.log('Generating study material with Presenton:', { title, type, details, format, theme, slideCount });
      
      // Generate content using enhanced OpenAI with document repository context
      const generatedContent = await generateStudyMaterial(title, type, details, slideCount);
      console.log('Generated content structure:', generatedContent);

      let fileUrl = null;
      
      // Generate presentation files with Presenton enhancements
      if (type === 'presentation' && format) {
        try {
          const { generatePowerPointPresentation, generatePDFPresentation } = await import('./lib/presentation-generator');
          
          if (format === 'pptx') {
            console.log(`Generating PowerPoint presentation with ${theme} theme...`);
            fileUrl = await generatePowerPointPresentation(
              title, 
              generatedContent.slides, 
              'pptx', 
              theme || 'general',
              'English',
              slideCount
            );
            console.log('Presenton PowerPoint generated:', fileUrl);
          } else if (format === 'pdf') {
            console.log(`Generating PDF presentation with ${theme} theme...`);
            fileUrl = await generatePDFPresentation(
              title, 
              generatedContent.slides, 
              theme || 'general'
            );
            console.log('Presenton PDF generated:', fileUrl);
          }
        } catch (error) {
          console.error('Error generating Presenton presentation file:', error);
          throw new Error('Failed to generate presentation file with Presenton');
        }
      }

      // Store the generated material with Presenton metadata
      const material = await storage.createStudyMaterial({
        title,
        type,
        details: details || null,
        content: generatedContent,
        fileUrl: fileUrl || null,
        createdBy: 1 // Using user ID 1 for now
      });

      res.json(material);
    } catch (error) {
      console.error('Error in Presenton study material generation:', error);
      res.status(500).json({ message: "An error occurred generating the study material with Presenton" });
    }
  });

  // Document repository endpoints
  app.get("/api/documents", async (req, res) => {
    const filters = {
      category: req.query.category as string | undefined,
      fileType: req.query.fileType as string | undefined
    };

    const documents = await storage.getDocuments(filters);
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const document = await storage.getDocument(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Increment view count
    await storage.incrementDocumentViews(id);

    res.json(document);
  });

  app.get("/api/documents/:id/tables", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const tables = await storage.listTablesByDocumentId(id);
      res.json(tables || []);
    } catch (error) {
      console.error("Error fetching document tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.post("/api/documents", upload.single("file"), async (req, res) => {
    try {
      console.log("Received document upload request", { body: req.body, file: req.file });
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract file information
      const fileName = req.file.originalname;
      const fileType = path.extname(fileName).substring(1);
      const fileSize = req.file.size;

      // Get current user ID from session or request
      const currentUserId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;

      // Validate and create document
      const documentData = {
        title: req.body.title,
        description: req.body.description || null,
        fileName: req.file.filename, // The stored filename
        fileType,
        fileSize,
        category: req.body.category || "general", // Default category if not provided
        uploadedBy: currentUserId,
        thumbnailUrl: null as string | null
      };

      console.log("Document data to be saved:", documentData);

      // Generate thumbnail if possible
      const thumbnailUrl = await generateThumbnail(req.file.path, req.file.originalname, fileType);
      if (thumbnailUrl) {
        documentData.thumbnailUrl = thumbnailUrl;
      }

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      console.log("Document created successfully:", document);

      try {
        const filePath = path.join(uploadDir, req.file.filename);
        const buffer = fs.readFileSync(filePath);
        const mimetype = req.file.mimetype;
        const report = await scoreDocument(buffer, mimetype);

        let rawText = "";
        if (mimetype.includes("pdf")) {
          const parsed = await pdfParse(buffer);
          rawText = (parsed.text || "").trim();
        } else {
          rawText = buffer.toString("utf8");
        }

        await ingestDocument(document as any, rawText);

        res.status(201).json({
          ...document,
          quality: report,
          message: "Uploaded and ingested"
        });
      } catch (ingestError) {
        console.warn("Document ingestion failed (non-blocking):", ingestError);
        res.status(201).json(document);
      }
    } catch (error) {
      console.error("Error in document upload:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: (error as any).errors });
      }
      
      res.status(500).json({ message: "An error occurred uploading the document" });
    }
  });

  // Re-ingest every document into the RAG index. Useful after schema changes,
  // for documents uploaded before ingestion existed, or files synced from
  // external integrations that bypassed the upload endpoint.
  app.post("/api/documents/reindex-all", async (req, res) => {
    try {
      const allDocs = await storage.getDocuments();
      let indexed = 0;
      const failures: Array<{ id: number; title: string; error: string }> = [];

      for (const doc of allDocs) {
        try {
          const filePath = path.join(uploadDir, doc.fileName);
          if (!fs.existsSync(filePath)) {
            failures.push({ id: doc.id, title: doc.title, error: "File not found on disk" });
            continue;
          }

          const buffer = fs.readFileSync(filePath);
          let rawText = "";
          if (doc.fileType === "pdf") {
            const parsed = await pdfParse(buffer);
            rawText = (parsed.text || "").trim();
          } else {
            rawText = buffer.toString("utf8");
          }

          if (!rawText) {
            failures.push({ id: doc.id, title: doc.title, error: "No extractable text" });
            continue;
          }

          await ingestDocument(doc as any, rawText);
          indexed++;
        } catch (err) {
          failures.push({ id: doc.id, title: doc.title, error: err instanceof Error ? err.message : String(err) });
        }
      }

      res.json({ total: allDocs.length, indexed, failures });
    } catch (error) {
      console.error("Error reindexing documents:", error);
      res.status(500).json({ message: "Failed to reindex documents" });
    }
  });

  // Update document (rename)
  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { title } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const updatedDocument = await storage.updateDocument(id, { title: title.trim() });
      if (!updatedDocument) {
        return res.status(500).json({ message: "Failed to update document" });
      }

      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "An error occurred updating the document" });
    }
  });

  // Duplicate document
  app.post("/api/documents/:id/duplicate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const originalDocument = await storage.getDocument(id);
      if (!originalDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Copy the file
      const originalFilePath = path.join(uploadDir, originalDocument.fileName);
      const fileExt = path.extname(originalDocument.fileName);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const newFileName = `file-${uniqueSuffix}${fileExt}`;
      const newFilePath = path.join(uploadDir, newFileName);

      try {
        fs.copyFileSync(originalFilePath, newFilePath);
      } catch (error) {
        console.error("File copy failed:", error);
        return res.status(500).json({ message: "Failed to copy file" });
      }

      // Generate thumbnail for the copied file
      const thumbnailUrl = await generateThumbnail(newFilePath, originalDocument.fileName, originalDocument.fileType);

      // Create new document record
      const documentData = {
        title: `${originalDocument.title} (Copy)`,
        description: originalDocument.description,
        fileName: newFileName,
        fileType: originalDocument.fileType,
        fileSize: originalDocument.fileSize,
        category: originalDocument.category,
        uploadedBy: originalDocument.uploadedBy,
        thumbnailUrl: thumbnailUrl || null
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const newDocument = await storage.createDocument(validatedData);

      // Index the duplicate for RAG (chunks are keyed by document id, so the
      // copy needs its own ingestion pass).
      try {
        const buffer = fs.readFileSync(newFilePath);
        let rawText = "";
        if (newDocument.fileType === "pdf") {
          const parsed = await pdfParse(buffer);
          rawText = (parsed.text || "").trim();
        } else {
          rawText = buffer.toString("utf8");
        }
        if (rawText) await ingestDocument(newDocument as any, rawText);
      } catch (ingestError) {
        console.warn("Duplicate ingestion failed (non-blocking):", ingestError);
      }

      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error duplicating document:", error);
      res.status(500).json({ message: "An error occurred duplicating the document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Get current user info
      const currentUserId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      const currentUser = await storage.getUser(currentUserId);
      
      // Check if document is protected (uploaded by manager) and current user is not manager
      if (document.uploadedBy) {
        const uploader = await storage.getUser(document.uploadedBy);
        if (uploader?.role === 'manager' && currentUser?.role !== 'manager') {
          return res.status(403).json({ 
            message: "You cannot delete documents uploaded by managers" 
          });
        }
      }

      // Delete the actual file
      try {
        fs.unlinkSync(path.join(uploadDir, document.fileName));
      } catch (error) {
        console.error("File deletion failed:", error);
      }

      // Delete thumbnail if exists
      if (document.thumbnailUrl) {
        deleteThumbnail(document.thumbnailUrl);
      }

      const success = await storage.deleteDocument(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "An error occurred while deleting the document" });
    }
  });

  // Serve uploaded files
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Get file extension to set proper content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.ppt':
        contentType = 'application/vnd.ms-powerpoint';
        break;
      case '.pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
    }
    
    // Set headers for proper display in browser
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    
    // Remove restrictive headers that may block viewing
    // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    
    // Add cache control for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.sendFile(path.resolve(filePath));
  });

  // Serve thumbnail images
  app.get("/api/thumbnails/:filename", (req, res) => {
    const filename = req.params.filename;
    const thumbnailDir = path.join(process.cwd(), "uploads", "thumbnails");
    const filePath = path.join(thumbnailDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Thumbnail not found" });
    }
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    res.sendFile(path.resolve(filePath));
  });

  // Serve generated presentation files
  app.get("/api/generated/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "uploads", "generated", filename);
    
    console.log('Serving generated file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('Generated file not found:', filePath);
      return res.status(404).json({ message: "Generated file not found" });
    }
    
    // Get file extension to set proper content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  });

  // NOTE: POST /api/onboarding-chat is handled by the selective-vector RAG
  // agent router mounted at the top of this file (it plans which knowledge
  // tools to use — org graph, onboarding config, vector search — and answers
  // with citations). The duplicate title-only handler was removed.

  // Manager visibility: onboarding progress for the whole team
  app.get("/api/manager/team-progress", async (req, res) => {
    try {
      const employees = await storage.getUsersByRole("employee");
      const team = employees.map(u => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        department: u.department,
        jobTitle: u.jobTitle,
        startDate: u.startDate,
        onboardingStep: u.onboardingStep,
        onboardingCompletedAt: u.onboardingCompletedAt,
        lastVisitedPage: u.lastVisitedPage,
        completionPercent: u.onboardingCompletedAt ? 100 : Math.round(((u.onboardingStep - 1) / 8) * 100),
      }));

      const completed = team.filter(t => t.onboardingCompletedAt).length;
      res.json({
        team,
        summary: {
          total: team.length,
          completed,
          inProgress: team.length - completed,
          averageCompletionPercent: team.length
            ? Math.round(team.reduce((sum, t) => sum + t.completionPercent, 0) / team.length)
            : 0,
        },
      });
    } catch (error) {
      console.error("Error getting team progress:", error);
      res.status(500).json({ message: "Failed to get team progress" });
    }
  });

  // Manager visibility: recent questions employees asked the AI assistant —
  // a direct signal of where new hires are getting stuck.
  app.get("/api/manager/recent-questions", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const questions = await storage.getRecentUserQuestions(limit);
      res.json({ questions });
    } catch (error) {
      console.error("Error getting recent questions:", error);
      res.status(500).json({ message: "Failed to get recent questions" });
    }
  });

  // Update document category
  app.patch("/api/documents/:id/category", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { category } = req.body;
      if (!category || !['onboarding', 'cadet'].includes(category)) {
        return res.status(400).json({ message: "Category must be 'onboarding' or 'cadet'" });
      }

      const updatedDocument = await storage.updateDocumentCategory(id, category);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document category:", error);
      res.status(500).json({ message: "Failed to update document category" });
    }
  });

  // Company config routes
  app.get("/api/company-config", async (req, res) => {
    try {
      const config = await storage.getCompanyConfig();
      res.json(config || {});
    } catch (error) {
      console.error("Error getting company config:", error);
      res.status(500).json({ message: "Failed to get company config" });
    }
  });

  app.patch("/api/company-config", async (req, res) => {
    try {
      const { benefitsContent, complianceContent, orgChart, sandboxTask } = req.body;
      
      const config = await storage.updateCompanyConfig({
        benefitsContent,
        complianceContent,
        orgChart,
        sandboxTask,
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating company config:", error);
      res.status(500).json({ message: "Failed to update company config" });
    }
  });

  // Register external integration routes for Google Drive and Microsoft OneDrive
  registerExternalIntegrationRoutes(app);

  // Import messaging service
  const { messagingService } = await import('./lib/messagingService.js');

  // Get messaging integrations status
  app.get("/api/messaging/status", async (req, res) => {
    try {
      const status = await messagingService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting messaging status:", error);
      res.status(500).json({ message: "Failed to get messaging status" });
    }
  });

  // Send message to employee
  app.post("/api/messaging/send", async (req, res) => {
    try {
      const { employeeId, employeeName, employeeEmail, message, managerName } = req.body;

      if (!employeeEmail || !message || !managerName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await messagingService.sendEmployeeMessage(
        employeeName || employeeEmail,
        employeeEmail,
        managerName,
        message
      );

      res.json(result);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Microsoft Teams OAuth routes
  app.get("/api/auth/microsoft", async (req, res) => {
    try {
      const { getMicrosoftAuthUrl } = await import('./lib/microsoftAuth.js');
      // Use the actual host from the request to support both localhost and Replit domains
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/microsoft/callback`;
      
      console.log('Microsoft OAuth redirect URI:', redirectUri);
      const authUrl = await getMicrosoftAuthUrl(redirectUri);
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Microsoft auth:", error);
      res.status(500).json({ message: "Failed to initiate Microsoft authentication" });
    }
  });

  // Slack OAuth routes
  app.get("/api/auth/slack", async (req, res) => {
    try {
      const { getSlackAuthUrl } = await import('./lib/slackAuth.js');
      // Use the actual host from the request to support both localhost and Replit domains
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/slack/callback`;
      
      console.log('Slack OAuth redirect URI:', redirectUri);
      const authUrl = getSlackAuthUrl(redirectUri);
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Slack auth:", error);
      res.status(500).json({ message: "Failed to initiate Slack authentication" });
    }
  });

  app.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      const { exchangeCodeForTokens, getMicrosoftUserProfile } = await import('./lib/microsoftAuth.js');
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/microsoft/callback`;
      
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code as string, redirectUri);
      
      // Get user profile
      const userProfile = await getMicrosoftUserProfile(tokens.accessToken);
      console.log('Microsoft user profile retrieved:', userProfile.displayName);
      
      // Store tokens using the new storage function
      const { storeMicrosoftAccessToken } = await import('./lib/teamsIntegration.js');
      storeMicrosoftAccessToken('current-user', tokens.accessToken);
      
      // Return HTML that closes the popup and notifies parent window
      res.send(`
        <html>
          <body>
            <script>
              // Close popup and notify parent window
              if (window.opener) {
                window.opener.postMessage({ type: 'MICROSOFT_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                // Fallback for direct navigation
                window.location.href = '/settings?microsoft_connected=true';
              }
            </script>
            <p>Authentication successful! Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in Microsoft auth callback:", error);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'MICROSOFT_AUTH_ERROR' }, '*');
                window.close();
              } else {
                window.location.href = '/settings?microsoft_error=true';
              }
            </script>
            <p>Authentication failed. Closing window...</p>
          </body>
        </html>
      `);
    }
  });

  // Check Microsoft connection status
  app.get("/api/auth/microsoft/status", async (req, res) => {
    try {
      const hasToken = !!process.env.MICROSOFT_ACCESS_TOKEN;
      const hasCredentials = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
      
      res.json({
        connected: hasToken && hasCredentials,
        configured: hasCredentials
      });
    } catch (error) {
      console.error("Error checking Microsoft status:", error);
      res.status(500).json({ message: "Failed to check Microsoft status" });
    }
  });

  app.get("/api/auth/slack/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      const { exchangeSlackAuthCode, getSlackUserProfile } = await import('./lib/slackAuth.js');
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/slack/callback`;
      
      // Exchange code for tokens
      const tokens = await exchangeSlackAuthCode(code as string, redirectUri);
      
      // Get user profile
      const userProfile = await getSlackUserProfile(tokens.accessToken);
      console.log('Slack user profile retrieved:', userProfile);
      
      // Store tokens using the new storage function
      const { storeSlackAccessToken } = await import('./lib/slackIntegration.js');
      storeSlackAccessToken('current-user', tokens.accessToken);
      
      // Return HTML that closes the popup and notifies parent window
      res.send(`
        <html>
          <body>
            <script>
              // Close popup and notify parent window
              if (window.opener) {
                window.opener.postMessage({ type: 'SLACK_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                // Fallback for direct navigation
                window.location.href = '/settings?slack_connected=true';
              }
            </script>
            <p>Authentication successful! Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in Slack auth callback:", error);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SLACK_AUTH_ERROR' }, '*');
                window.close();
              } else {
                window.location.href = '/settings?slack_error=true';
              }
            </script>
            <p>Authentication failed. Closing window...</p>
          </body>
        </html>
      `);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
