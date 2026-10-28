import { sendTeamsMessageViaGraph, getMicrosoftUserProfile } from './microsoftAuth.js';

// Simple in-memory token storage for demo (would be database in production)
let microsoftTokenStore: { [userId: string]: string } = {};

// Store Microsoft access token
export function storeMicrosoftAccessToken(userId: string, token: string): void {
  microsoftTokenStore[userId] = token;
  // Also store in env for backward compatibility
  process.env.MICROSOFT_ACCESS_TOKEN = token;
  console.log('Microsoft token stored for user:', userId, 'Token length:', token.length);
}

// Get Microsoft access token from storage (this would be stored per user)
async function getMicrosoftAccessToken(userId: string): Promise<string | null> {
  // Check in-memory store first
  const token = microsoftTokenStore[userId] || process.env.MICROSOFT_ACCESS_TOKEN;
  if (token) {
    console.log('Retrieved Microsoft token for user:', userId, 'Token length:', token.length);
  } else {
    console.log('No Microsoft token found for user:', userId);
  }
  return token || null;
}

export async function sendTeamsMessage(message: string): Promise<boolean> {
  const accessToken = await getMicrosoftAccessToken('current-user');
  
  if (!accessToken) {
    console.warn('Microsoft access token not available');
    return false;
  }

  try {
    // For general messages, we could post to a channel
    // For now, we'll return false as we need a specific recipient
    console.warn('General Teams messages require specific recipient');
    return false;
  } catch (error) {
    console.error('Error sending Teams message:', error);
    return false;
  }
}

export async function sendTeamsMessageToUser(message: string, userEmail: string): Promise<boolean> {
  const accessToken = await getMicrosoftAccessToken('current-user');
  
  if (!accessToken) {
    console.warn('Microsoft access token not available');
    return false;
  }

  console.log('Using Microsoft access token for Teams message, length:', accessToken.length);

  try {
    return await sendTeamsMessageViaGraph(accessToken, userEmail, message);
  } catch (error) {
    console.error('Error sending Teams message to user:', error);
    return false;
  }
}

export function isTeamsConfigured(): boolean {
  // Check if we have Microsoft credentials configured
  return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}

export async function checkTeamsConnection(): Promise<boolean> {
  if (!isTeamsConfigured()) {
    return false;
  }
  
  // Check if we have a valid access token
  const accessToken = await getMicrosoftAccessToken('current-user');
  if (!accessToken) {
    console.log('Teams connection check: No access token available');
    return false;
  }

  console.log('Teams connection check: Testing token with length', accessToken.length);

  // Try to verify the token by making a simple Graph API call
  try {
    const userProfile = await getMicrosoftUserProfile(accessToken);
    console.log('Teams connection check: SUCCESS - User profile retrieved');
    return !!userProfile;
  } catch (error) {
    console.log('Teams connection check failed:', error);
    return false;
  }
}