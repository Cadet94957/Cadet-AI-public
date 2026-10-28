// googleDriveConnector.ts
// This module provides helper functions to integrate with Google Drive via OAuth2.
// It handles generating the authorization URL, exchanging an authorization code
// for access tokens, listing files in the user's Drive, and downloading
// individual files. To use this connector, you must define the following
// environment variables in your server process:
//   GOOGLE_CLIENT_ID     – The client ID from your Google Cloud project
//   GOOGLE_CLIENT_SECRET – The client secret from your Google Cloud project
//   GOOGLE_REDIRECT_URI  – The OAuth2 callback URL configured in Google Cloud

import { google, drive_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

// Scopes required to read files from Google Drive. We avoid full drive access
// and request read‑only permissions. See:
// https://developers.google.com/drive/api/guides/api-scopes
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

/**
 * Create a new OAuth2 client using credentials from environment variables.
 */
function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth environment variables');
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the Google OAuth authorization URL. Users should be redirected
 * to this URL to grant your application access to their Drive. The optional
 * `state` parameter can be used to persist information through the OAuth
 * flow (e.g., CSRF tokens or the ID of the current user).
 */
export function getGoogleAuthUrl(state?: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

/**
 * Exchange an authorization code for Google OAuth tokens. When Google
 * redirects back to your application after the user grants access, the
 * `code` query parameter can be passed to this function to obtain
 * access and refresh tokens.
 */
export async function exchangeGoogleAuthCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * List up to 100 non‑folder files in the user's Google Drive. The returned
 * array contains basic metadata about each file (ID, name, MIME type,
 * size and creation time). You must provide a valid access token.
 */
export async function listGoogleDriveFiles(accessToken: string) {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: authClient });
  const response = await drive.files.list({
    q: "mimeType!='application/vnd.google-apps.folder'",
    fields: 'files(id, name, mimeType, size, createdTime)',
    pageSize: 100,
  });
  return response.data.files ?? [];
}

/**
 * Download the contents of a file from Google Drive. This function returns a
 * readable stream; callers should pipe it to a file or buffer as needed.
 * A valid access token must be provided.
 */
export async function downloadGoogleDriveFile(accessToken: string, fileId: string) {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: accessToken });
  const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: authClient });
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  return res.data;
}