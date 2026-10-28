import { WebClient } from '@slack/web-api';

export interface SlackTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userId: string;
  teamId: string;
}

/**
 * Get authorization URL for Slack OAuth
 */
export function getSlackAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    throw new Error('SLACK_CLIENT_ID not configured');
  }

  const scopes = [
    'chat:write',
    'users:read',
    'users:read.email',
    'channels:read',
    'groups:read',
    'im:read',
    'mpim:read'
  ].join(',');

  const params = new URLSearchParams({
    client_id: clientId,
    user_scope: scopes,
    redirect_uri: redirectUri,
    response_type: 'code',
    ...(state && { state })
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeSlackAuthCode(code: string, redirectUri: string): Promise<SlackTokens> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Slack OAuth credentials not configured');
  }

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    userId: data.authed_user.id,
    teamId: data.team.id,
  };
}

/**
 * Create Slack client with access token
 */
export function createSlackClient(accessToken: string): WebClient {
  return new WebClient(accessToken);
}

/**
 * Get user profile from Slack
 */
export async function getSlackUserProfile(accessToken: string) {
  try {
    const client = createSlackClient(accessToken);
    const response = await client.auth.test();
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Slack');
    }

    return {
      id: response.user_id,
      email: response.user,
      teamId: response.team_id,
      teamName: response.team,
    };
  } catch (error) {
    console.error('Error getting Slack user profile:', error);
    throw error;
  }
}

/**
 * Send a Slack message using OAuth token
 */
export async function sendSlackMessageWithOAuth(
  accessToken: string,
  channel: string,
  message: string
): Promise<boolean> {
  try {
    const client = createSlackClient(accessToken);
    
    const response = await client.chat.postMessage({
      channel,
      text: message,
      username: 'CADET Bot',
      icon_emoji: ':robot_face:'
    });

    return response.ok === true;
  } catch (error) {
    console.error('Error sending Slack message with OAuth:', error);
    return false;
  }
}

/**
 * Send a direct message to a user using OAuth token
 */
export async function sendSlackDMWithOAuth(
  accessToken: string,
  userEmail: string,
  message: string
): Promise<boolean> {
  try {
    const client = createSlackClient(accessToken);
    
    // Look up user by email
    const userResponse = await client.users.lookupByEmail({
      email: userEmail
    });

    if (!userResponse.user?.id) {
      console.error('User not found in Slack workspace');
      return false;
    }

    // Send direct message
    const response = await client.chat.postMessage({
      channel: userResponse.user.id,
      text: message,
      username: 'CADET Bot',
      icon_emoji: ':robot_face:'
    });

    return response.ok === true;
  } catch (error) {
    console.error('Error sending Slack DM with OAuth:', error);
    return false;
  }
}