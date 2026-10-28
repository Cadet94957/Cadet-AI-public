import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authority: 'https://login.microsoftonline.com/common',
  }
};

const msalInstance = new ConfidentialClientApplication(msalConfig);

export interface MicrosoftTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Get authorization URL for Microsoft OAuth
 */
export async function getMicrosoftAuthUrl(redirectUri: string): Promise<string> {
  const authCodeUrlParameters = {
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Chat.ReadWrite',
      'https://graph.microsoft.com/ChatMessage.Send'
    ],
    redirectUri,
  };

  return await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<MicrosoftTokens> {
  const tokenRequest = {
    code,
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Chat.ReadWrite',
      'https://graph.microsoft.com/ChatMessage.Send'
    ],
    redirectUri,
  };

  const response = await msalInstance.acquireTokenByCode(tokenRequest);
  
  if (!response || !response.accessToken) {
    throw new Error('Failed to acquire token');
  }

  return {
    accessToken: response.accessToken,
    // MSAL caches refresh tokens internally and doesn't expose them on the
    // typed result; fall back to empty when absent.
    refreshToken: (response as any).refreshToken || '',
    expiresAt: response.expiresOn?.getTime() || Date.now() + 3600000, // 1 hour default
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
  const refreshTokenRequest = {
    refreshToken,
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Chat.ReadWrite',
      'https://graph.microsoft.com/ChatMessage.Send'
    ],
  };

  const response = await msalInstance.acquireTokenByRefreshToken(refreshTokenRequest);
  
  if (!response || !response.accessToken) {
    throw new Error('Failed to refresh token');
  }

  return {
    accessToken: response.accessToken,
    refreshToken: (response as any).refreshToken || refreshToken,
    expiresAt: response.expiresOn?.getTime() || Date.now() + 3600000,
  };
}

/**
 * Create Microsoft Graph client with access token
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    defaultVersion: 'v1.0',
    debugLogging: false,
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Send a Teams message to a user via Microsoft Graph
 */
export async function sendTeamsMessageViaGraph(
  accessToken: string, 
  recipientEmail: string, 
  message: string
): Promise<boolean> {
  try {
    const graphClient = createGraphClient(accessToken);

    // Get current user info
    const currentUser = await graphClient.api('/me').get();
    
    // Get recipient user info
    const recipientUser = await graphClient.api(`/users/${recipientEmail}`).get();
    
    if (!recipientUser || !recipientUser.id) {
      console.error('Recipient user not found:', recipientEmail);
      return false;
    }

    // Create a one-on-one chat with both users
    const chatBody = {
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          user: {
            id: currentUser.id
          },
          roles: ['owner']
        },
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          user: {
            id: recipientUser.id
          },
          roles: ['owner']
        }
      ]
    };

    // Try to create chat or get existing one
    let chat;
    try {
      chat = await graphClient.api('/chats').post(chatBody);
    } catch (chatError: any) {
      // If chat already exists, try to find it
      if (chatError.code === 'Conflict' || chatError.status === 409) {
        console.log('Chat already exists, attempting to find existing chat');
        const chats = await graphClient.api('/me/chats').get();
        chat = chats.value?.find((c: any) => 
          c.chatType === 'oneOnOne' && 
          c.members?.some((m: any) => m.userId === recipientUser.id)
        );
      }
      
      if (!chat) {
        throw chatError;
      }
    }

    if (!chat || !chat.id) {
      console.error('Failed to create or find chat');
      return false;
    }

    // Send message to the chat
    const messageBody = {
      body: {
        contentType: 'text',
        content: message
      }
    };

    await graphClient.api(`/chats/${chat.id}/messages`).post(messageBody);
    
    return true;
  } catch (error) {
    console.error('Error sending Teams message via Graph:', error);
    return false;
  }
}

/**
 * Get user profile from Microsoft Graph
 */
export async function getMicrosoftUserProfile(accessToken: string) {
  try {
    const graphClient = createGraphClient(accessToken);
    const user = await graphClient.api('/me').get();
    
    return {
      id: user.id,
      email: user.mail || user.userPrincipalName,
      displayName: user.displayName,
      givenName: user.givenName,
      surname: user.surname,
    };
  } catch (error) {
    console.error('Error getting Microsoft user profile:', error);
    throw error;
  }
}