import OpenAI from "openai";
import { retrieveContext, inferPrecisionFromQuery } from "./retrieval";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RagCitation {
  docId: number;
  title: string;
  section?: string | null;
  snippet: string;
  url?: string | null;
  score?: number | null;
}

export interface RagAnswer {
  content: string;
  citations: RagCitation[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// Cap how much history goes to the model so long conversations never blow the
// context window; the most recent turns carry the relevant state.
const HISTORY_WINDOW = 12;

export async function answerWithRag(
  message: string,
  options: {
    customSystemContext?: string;
    userEmail?: string;
    history?: ChatHistoryMessage[];
  } = {}
): Promise<RagAnswer> {
  const { customSystemContext, userEmail, history = [] } = options;
  try {
    let role: string | undefined;
    let department: string | undefined;
    let region: string | undefined;

    if (userEmail) {
      const u = await storage.getUserByUsername(userEmail);
      role = u?.role;
      department = u?.department;
    }

    const precision = inferPrecisionFromQuery(message);
    const { contexts, usedDocuments } = await retrieveContext(message, {
      userRole: role,
      department,
      region,
      precision,
      limit: precision ? 18 : 12,
    });

    const citations: RagCitation[] = contexts.map((c) => {
      const doc = usedDocuments.find(d => d.id === c.documentId);
      return {
        docId: c.documentId,
        title: doc?.title ?? `Document #${c.documentId}`,
        section: c.section ?? null,
        snippet: c.text.length > 240 ? c.text.slice(0, 240) + "…" : c.text,
        url: doc ? `/api/files/${doc.fileName}` : null,
        score: (c as any).score ?? null,
      };
    });

    const contextBlock = contexts.length > 0
      ? contexts.map((c, idx) => {
          const doc = usedDocuments.find(d => d.id === c.documentId);
          const source = doc ? `${doc.title}${c.section ? " — " + c.section : ""}` : `Doc#${c.documentId}`;
          return `[${idx + 1}] ${c.text}\nSOURCE: ${source}`;
        }).join("\n\n")
      : "(No relevant company documents were found for this question.)";

    const system = (customSystemContext ?? `
You are Cadet, an onboarding assistant. Answer using ONLY the provided context.
When you cite, use the bracketed numbers [1], [2], ... matching the snippets.
If the answer isn't in context, say you don't have that info and suggest the closest relevant doc to read, or suggest asking a manager/HR.
Keep answers concise and role-aware.`).trim();

    const userMsg = (`
Question:
${message}

Context (ground truth):
${contextBlock}
`).trim();

    const recentHistory = history.slice(-HISTORY_WINDOW);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        ...recentHistory.map(m => ({ role: m.role, content: m.content } as const)),
        { role: "user", content: userMsg },
      ],
    });

    return {
      content: response.choices[0].message.content ?? "No answer generated.",
      citations,
    };
  } catch (error) {
    console.error("OpenAI chat error:", error);
    return { content: "Sorry, I ran into an error answering that.", citations: [] };
  }
}

export async function handleChatbotRequest(
  message: string,
  customSystemContext?: string,
  userEmail?: string
): Promise<string> {
  const { content } = await answerWithRag(message, { customSystemContext, userEmail });
  return content;
}

export async function generateConversationTitle(message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that creates short, descriptive titles for conversations. Max 4-5 words." },
        { role: "user", content: `Create a short title for this conversation starter: "${message}"` }
      ],
      max_tokens: 20,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content?.trim() || "New Conversation";
  } catch {
    return "New Conversation";
  }
}

export async function generateStudyMaterial(
  topic: string,
  type: string,
  details?: string | null,
  slideCount?: number
): Promise<any> {
  const documents = await storage.getDocuments();

  let documentContext = "";
  if (documents.length > 0) {
    documentContext = `
IMPORTANT: Use the following company documents and materials as your primary source:
${documents.map((d) => `- ${d.title} (${d.fileType}): ${d.description || "Company training material"}`).join("\n")}
`.trim();
  }

  try {
    let prompt = "";
    let responseFormat = {};

    switch (type) {
      case "presentation":
        const targetSlideCount = slideCount || 10;
        prompt = `Create a professional presentation about "${topic}" using Presenton's advanced generation capabilities. ${details || ""}${documentContext}
        
        The presentation should follow modern corporate styling and include:
        - Professional business terminology optimized for visual presentation
        - Solution-oriented messaging with ROI focus
        - Industry-specific content when applicable
        - Practical, actionable insights distributed across exactly ${targetSlideCount} content slides
        - Enhanced content depth appropriate for ${targetSlideCount} slides
        
        Advanced Content Requirements:
        - Generate exactly ${targetSlideCount} content slides with rich, detailed content
        - Each slide should contain comprehensive paragraphs, not just bullet points
        - Include detailed explanations, real-world examples, and actionable insights
        - Content should be substantive and professional, suitable for executive presentations
        - Mix content types: introductory paragraphs, detailed explanations, examples, and key takeaways
        - Ensure logical flow and progression across all slides
        - Reference company materials when relevant for authentic content
        
        Content Format Guidelines:
        - Start each slide with an introductory paragraph explaining the concept
        - Follow with detailed explanations and real-world applications
        - Include specific examples, statistics, or case studies
        - End with key takeaways or actionable insights
        - Use varied content structure across slides for visual interest
        
        The output should be a JSON object with a 'slides' array, where each slide has:
        - 'title': Clear, engaging slide title
        - 'content': Rich, paragraph-based content with detailed explanations
        - 'highlights': Array of 3-4 key bullet points for emphasis
        
        Format: {"slides": [{"title": "Slide Title", "content": "Detailed paragraph explaining the concept in depth. This should include specific examples and real-world applications that demonstrate the value and impact.", "highlights": ["Key point 1", "Key point 2", "Key point 3"]}]}`;
        responseFormat = {
          type: "json_object",
        };
        break;

      case "studyNotes":
        prompt = `Create comprehensive study notes about "${topic}". ${details || ""}${documentContext}
        
        The notes should be thorough and reference company materials when applicable. Include:
        - Key concepts and definitions
        - Practical applications
        - Company-specific processes and terminology
        - Best practices from uploaded materials
        
        The output should be a JSON object with an 'introduction' and 'sections' array.
        Each section should have a 'heading' and 'content'.
        
        Format: {"introduction": "Overview text", "sections": [{"heading": "Section Title", "content": "Detailed content with company-specific information"}]}`;
        responseFormat = {
          type: "json_object",
        };
        break;

      default:
        throw new Error("Invalid study material type");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an educational content creation assistant. Create high-quality, accurate, and educational content in the requested format.",
        },
        { role: "user", content: prompt },
      ],
      response_format: responseFormat as any,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate study material");
  }
}

export async function callLLM(prompt: string, options?: { temperature?: number }): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: options?.temperature ?? 0.3,
      messages: [
        { role: "user", content: prompt }
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    console.error("OpenAI callLLM error:", error);
    throw error;
  }
}
