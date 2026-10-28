import { apiRequest } from "./queryClient";

// Type for chat request
interface ChatRequest {
  message: string;
}

// Type for chat response
interface ChatResponse {
  userMessage: {
    id: number;
    userId: number;
    isUserMessage: boolean;
    content: string;
    createdAt: string;
  };
  botMessage: {
    id: number;
    userId: number;
    isUserMessage: boolean;
    content: string;
    createdAt: string;
  };
}

/**
 * Send a message to the chatbot API
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const data: ChatRequest = { message };
  const response = await apiRequest('POST', '/api/chat/send', data);
  return response.json();
}

// Type for generating study material request
interface GenerateStudyMaterialRequest {
  title: string;
  type: 'presentation' | 'studyNotes';
  details?: string;
}

/**
 * Generate study material through the API
 */
export async function generateStudyMaterial(
  request: GenerateStudyMaterialRequest
): Promise<any> {
  const response = await apiRequest('POST', '/api/study-materials/generate', request);
  return response.json();
}
