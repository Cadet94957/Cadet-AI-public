import { WebClient } from '@slack/web-api';

// Initialize Slack client
let slackClient: WebClient | null = null;

// Simple in-memory token storage for demo (would be database in production)
let slackTokenStore: { [userId: string]: string } = {};

// Store Slack access token
export function storeSlackAccessToken(userId: string, token: string): void {
  slackTokenStore[userId] = token;
  console.log('Slack token stored for user:', userId, 'Token length:', token.length);
}

// Get Slack access token from storage
async function getSlackAccessToken(userId: string): Promise<string | null> {
  const token = slackTokenStore[userId] || process.env.SLACK_BOT_TOKEN;
  if (token) {
    console.log('Retrieved Slack token for user:', userId, 'Token length:', token.length);
  } else {
    console.log('No Slack token found for user:', userId);
  }
  return token || null;
}

export function initializeSlack() {
  // Check if we have OAuth credentials configured
  const hasOAuthCredentials = !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
  // Check if we have bot token
  const hasBotToken = !!process.env.SLACK_BOT_TOKEN;
  
  if (!hasBotToken && !hasOAuthCredentials) {
    console.warn('Neither SLACK_BOT_TOKEN nor Slack OAuth credentials provided. Slack integration disabled.');
    return false;
  }
  
  if (hasBotToken) {
    slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    console.log('Slack initialized with bot token');
  } else {
    console.log('Slack OAuth credentials available, bot token not provided');
  }
  
  return true;
}

export async function sendSlackMessage(message: string, channel?: string): Promise<boolean> {
  // Try OAuth token first, fall back to bot token
  const oauthToken = await getSlackAccessToken('current-user');
  const client = oauthToken ? new WebClient(oauthToken) : slackClient;
  
  if (!client) {
    console.error('No Slack client available (neither OAuth nor bot token)');
    return false;
  }

  try {
    const targetChannel = channel || process.env.SLACK_CHANNEL_ID || '#general';
    
    await client.chat.postMessage({
      channel: targetChannel,
      text: message,
      username: 'CADET Bot',
      icon_emoji: ':robot_face:'
    });
    
    return true;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return false;
  }
}

export async function sendSlackMessageToUser(message: string, userEmail: string): Promise<boolean> {
  // Try OAuth token first, fall back to bot token
  const oauthToken = await getSlackAccessToken('current-user');
  const client = oauthToken ? new WebClient(oauthToken) : slackClient;
  
  if (!client) {
    console.error('No Slack client available (neither OAuth nor bot token)');
    return false;
  }

  try {
    // Look up user by email
    const userResponse = await client.users.lookupByEmail({
      email: userEmail
    });

    if (!userResponse.user?.id) {
      console.error('User not found in Slack workspace');
      return false;
    }

    // Send direct message
    await client.chat.postMessage({
      channel: userResponse.user.id,
      text: message,
      username: 'CADET Bot',
      icon_emoji: ':robot_face:'
    });
    
    return true;
  } catch (error) {
    console.error('Error sending Slack DM:', error);
    return false;
  }
}

export async function checkSlackConnection(): Promise<boolean> {
  // Try OAuth token first, fall back to bot token
  const oauthToken = await getSlackAccessToken('current-user');
  const client = oauthToken ? new WebClient(oauthToken) : slackClient;
  
  if (!client) {
    console.log('Slack connection check: No client available');
    return false;
  }

  try {
    const response = await client.auth.test();
    console.log('Slack connection check: SUCCESS');
    return response.ok === true;
  } catch (error) {
    console.log('Slack connection check failed:', error);
    return false;
  }
}

export function isSlackConfigured(): boolean {
  // Check if we have OAuth credentials or bot token
  return !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) || !!process.env.SLACK_BOT_TOKEN;
}