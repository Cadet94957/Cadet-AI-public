// microsoftDriveConnector.ts
// This module provides helper functions to integrate with Microsoft OneDrive
// (via Microsoft Graph) using the OAuth2 authorization code flow. It
// generates an authorization URL, exchanges authorization codes for tokens,
// lists files and downloads specific files. To use this module you must
// configure the following environment variables in your server:
//   MICROSOFT_CLIENT_ID     – Your Azure AD application (client) ID
//   MICROSOFT_CLIENT_SECRET – The client secret for your Azure AD application
//   MICROSOFT_REDIRECT_URI  – The redirect URI configured in Azure AD

import { ConfidentialClientApplication, LogLevel, AuthorizationCodeRequest, AuthError, AuthenticationResult } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Permissions required to read files from the user's OneDrive. See:
// https://learn.microsoft.com/en-us/graph/permissions-reference
const SCOPES = ['Files.Read'];

/**
 * Create a configured MSAL Confidential Client Application instance.
 */
function getMsalClient(): ConfidentialClientApplication {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Microsoft OAuth environment variables');
  }
  return new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
      clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback() {},
        piiLoggingEnabled: false,
        logLevel: LogLevel.Info,
      },
    },
  });
}

/**
 * Generate the Microsoft authorization URL. Redirect users to this URL to
 * initiate the OAuth flow. The optional `state` parameter can be used to
 * persist information through the OAuth flow (e.g., a CSRF token or user ID).
 */
export async function getMicrosoftAuthUrl(state?: string): Promise<string> {
  const msalClient = getMsalClient();
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI!;
  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri,
    state,
  };
  const url = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
  return url;
}

/**
 * Exchange an authorization code from Microsoft for access and refresh
 * tokens. The `code` parameter should be taken from the `code` query
 * parameter returned by the OAuth callback.
 */
export async function exchangeMicrosoftAuthCode(code: string): Promise<AuthenticationResult | null> {
  const msalClient = getMsalClient();
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI!;
  const tokenRequest: AuthorizationCodeRequest = {
    code,
    scopes: SCOPES,
    redirectUri,
  };
  const response = await msalClient.acquireTokenByCode(tokenRequest);
  return response;
}

/**
 * Retrieve a list of items in the root of the user's OneDrive. The returned
 * objects contain basic metadata such as ID, name, MIME type, size and
 * creation time. A valid access token must be provided.
 */
export async function listMicrosoftDriveFiles(accessToken: string) {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });
  const result = await client.api('/me/drive/root/children').get();
  return result.value.map((item: any) => ({
    id: item.id,
    name: item.name,
    mimeType: item.file?.mimeType ?? 'folder',
    size: item.size,
    createdTime: item.createdDateTime,
  }));
}

/**
 * Download the contents of a specific file from OneDrive. Returns the
 * response body which is a readable stream. A valid access token must be
 * provided. If the item is a folder, this call will fail.
 */
export async function downloadMicrosoftDriveFile(accessToken: string, fileId: string) {
  const client = Client.init({ authProvider: (done) => done(null, accessToken) });
  const response = await client.api(`/me/drive/items/${fileId}/content`).get();
  return response;
}