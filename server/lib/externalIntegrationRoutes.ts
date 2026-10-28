// externalIntegrationRoutes.ts
//
// This file defines a set of Express routes that wrap the Google and
// Microsoft connector modules. Registering these routes with your Express
// application will enable your front end to authenticate users with each
// provider, list the user's files and import selected files into your
// document library.

import type { Express, Request, Response } from 'express';
import {
  getGoogleAuthUrl,
  exchangeGoogleAuthCode,
  listGoogleDriveFiles,
  downloadGoogleDriveFile,
} from './googleDriveConnector';
import {
  getMicrosoftAuthUrl,
  exchangeMicrosoftAuthCode,
  listMicrosoftDriveFiles,
  downloadMicrosoftDriveFile,
} from './microsoftDriveConnector';
import { storage } from '../storage';
import { generateThumbnail } from './thumbnail-generator';
import fs from 'fs';
import path from 'path';

// Directory where uploaded/imported files will be stored. Ensure this
// directory exists when the server starts.
const uploadsDir = path.join(process.cwd(), 'uploads');

export function registerExternalIntegrationRoutes(app: Express) {
  /**
   * Google OAuth authorization endpoint. Redirects the user to Google's
   * consent screen.
   */
  app.get('/api/integrations/google/authorize', (req: Request, res: Response) => {
    const state = req.query.state as string | undefined;
    const url = getGoogleAuthUrl(state);
    res.redirect(url);
  });

  /**
   * Google OAuth callback. Exchanges the authorization code for tokens
   * and stores them for the current user.
   */
  app.get('/api/integrations/google/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const tokens = await exchangeGoogleAuthCode(code);
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      await storage.saveGoogleTokens(userId, tokens);
      
      // Return HTML that shows success message and closes popup after 1.5 seconds
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Google Drive Connected</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: white;
              }
              .success-container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                animation: fadeInScale 0.5s ease-out;
              }
              .checkmark {
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
                background: #10B981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
                animation: checkmarkPop 0.6s ease-out 0.2s both;
              }
              .title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                animation: slideUp 0.5s ease-out 0.4s both;
              }
              .description {
                font-size: 1rem;
                opacity: 0.9;
                margin-bottom: 1.5rem;
                animation: slideUp 0.5s ease-out 0.6s both;
              }
              .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                animation: slideUp 0.5s ease-out 0.8s both;
              }
              .progress-fill {
                height: 100%;
                background: #10B981;
                width: 0%;
                animation: progressFill 1.5s ease-out;
              }
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes checkmarkPop {
                from {
                  opacity: 0;
                  transform: scale(0);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes progressFill {
                from {
                  width: 0%;
                }
                to {
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="checkmark">✓</div>
              <h1 class="title">Google Drive Connected!</h1>
              <p class="description">You can now import files from your Google Drive account.</p>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
            <script>
              // Close popup and notify parent window after 1.5 seconds
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  // Fallback for direct navigation
                  window.location.href = '/cloud-integrations?google_connected=true';
                }
              }, 1500);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google OAuth callback error', error);
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Connection Failed</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: white;
              }
              .error-container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                max-width: 400px;
              }
              .error-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
                background: #dc2626;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">✗</div>
              <h1>Connection Failed</h1>
              <p>Failed to connect Google Drive. Please try again.</p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, '*');
                  window.close();
                } else {
                  window.location.href = '/cloud-integrations?google_error=true';
                }
              }, 2000);
            </script>
          </body>
        </html>
      `);
    }
  });

  /**
   * List files from the user's Google Drive. Requires that the user has
   * previously connected their Google account.
   */
  app.get('/api/integrations/google/files', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      const tokens = await storage.getGoogleTokens(userId);
      if (!tokens || !tokens.access_token) {
        return res.status(400).json({ message: 'Google account not connected' });
      }
      const files = await listGoogleDriveFiles(tokens.access_token);
      res.json(files);
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      res.status(500).json({ message: 'Failed to list Google Drive files' });
    }
  });

  /**
   * Import a file from Google Drive into the application's document library.
   * The request body should contain `fileId`, `fileName`, and an optional `category`.
   */
  app.post('/api/integrations/google/import', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      const { fileId, fileName, category } = req.body;
      const tokens = await storage.getGoogleTokens(userId);
      if (!tokens || !tokens.access_token) {
        return res.status(400).json({ message: 'Google account not connected' });
      }
      
      const stream = await downloadGoogleDriveFile(tokens.access_token, fileId);
      
      // Generate unique filename
      const uniqueFilename = `${Date.now()}-${fileName}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Save file to disk
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream
          .on('error', reject)
          .pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      
      // Get file stats and determine file type
      const fileStat = fs.statSync(filePath);
      const extension = path.extname(fileName).substring(1);
      
      // Generate thumbnail if possible
      const thumbnailUrl = await generateThumbnail(filePath, fileName, extension);
      
      // Create document record
      const documentData = {
        title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension from title
        description: `Imported from Google Drive`,
        fileName: uniqueFilename,
        fileType: extension,
        fileSize: fileStat.size,
        category: category || 'cadet',
        uploadedBy: userId,
        thumbnailUrl: thumbnailUrl || null,
      };
      
      const document = await storage.createDocument(documentData as any);
      res.json(document);
    } catch (error) {
      console.error('Error importing Google file:', error);
      res.status(500).json({ message: 'Failed to import Google file' });
    }
  });

  /**
   * Microsoft OAuth authorization endpoint. Redirects the user to Microsoft's
   * consent screen.
   */
  app.get('/api/integrations/microsoft/authorize', async (req: Request, res: Response) => {
    try {
      const state = req.query.state as string | undefined;
      const url = await getMicrosoftAuthUrl(state);
      res.redirect(url);
    } catch (error) {
      console.error('Error generating Microsoft auth URL:', error);
      res.status(500).json({ message: 'Failed to initiate Microsoft auth' });
    }
  });

  /**
   * Microsoft OAuth callback. Exchanges the authorization code for tokens
   * and stores them for the current user.
   */
  app.get('/api/integrations/microsoft/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const result = await exchangeMicrosoftAuthCode(code);
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      await storage.saveMicrosoftTokens(userId, result);
      
      // Return HTML that shows success message and closes popup after 1.5 seconds
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OneDrive Connected</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: white;
              }
              .success-container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                animation: fadeInScale 0.5s ease-out;
              }
              .checkmark {
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
                background: #10B981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
                animation: checkmarkPop 0.6s ease-out 0.2s both;
              }
              .title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                animation: slideUp 0.5s ease-out 0.4s both;
              }
              .description {
                font-size: 1rem;
                opacity: 0.9;
                margin-bottom: 1.5rem;
                animation: slideUp 0.5s ease-out 0.6s both;
              }
              .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                animation: slideUp 0.5s ease-out 0.8s both;
              }
              .progress-fill {
                height: 100%;
                background: #10B981;
                width: 0%;
                animation: progressFill 1.5s ease-out;
              }
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes checkmarkPop {
                from {
                  opacity: 0;
                  transform: scale(0);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes progressFill {
                from {
                  width: 0%;
                }
                to {
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="checkmark">✓</div>
              <h1 class="title">OneDrive Connected!</h1>
              <p class="description">You can now import files from your Microsoft OneDrive account.</p>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
            <script>
              // Close popup and notify parent window after 1.5 seconds
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'MICROSOFT_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  // Fallback for direct navigation
                  window.location.href = '/cloud-integrations?microsoft_connected=true';
                }
              }, 1500);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Microsoft OAuth callback error', error);
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Connection Failed</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: white;
              }
              .error-container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                max-width: 400px;
              }
              .error-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
                background: #dc2626;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">✗</div>
              <h1>Connection Failed</h1>
              <p>Failed to connect OneDrive. Please try again.</p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'MICROSOFT_AUTH_ERROR' }, '*');
                  window.close();
                } else {
                  window.location.href = '/cloud-integrations?microsoft_error=true';
                }
              }, 2000);
            </script>
          </body>
        </html>
      `);
    }
  });

  /**
   * List files from the user's OneDrive. Requires that the user has
   * previously connected their Microsoft account.
   */
  app.get('/api/integrations/microsoft/files', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      const tokens = await storage.getMicrosoftTokens(userId);
      const accessToken = tokens?.accessToken || tokens?.access_token;
      if (!accessToken) {
        return res.status(400).json({ message: 'Microsoft account not connected' });
      }
      const files = await listMicrosoftDriveFiles(accessToken);
      res.json(files);
    } catch (error) {
      console.error('Error listing OneDrive files:', error);
      res.status(500).json({ message: 'Failed to list OneDrive files' });
    }
  });

  /**
   * Import a file from OneDrive into the application's document library.
   * The request body should contain `fileId`, `fileName`, and an optional `category`.
   */
  app.post('/api/integrations/microsoft/import', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      const { fileId, fileName, category } = req.body;
      const tokens = await storage.getMicrosoftTokens(userId);
      const accessToken = tokens?.accessToken || tokens?.access_token;
      if (!accessToken) {
        return res.status(400).json({ message: 'Microsoft account not connected' });
      }
      
      const stream = await downloadMicrosoftDriveFile(accessToken, fileId);
      
      // Generate unique filename
      const uniqueFilename = `${Date.now()}-${fileName}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Save file to disk
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream
          .on('error', reject)
          .pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      
      // Get file stats and determine file type
      const fileStat = fs.statSync(filePath);
      const extension = path.extname(fileName).substring(1);
      
      // Generate thumbnail if possible
      const thumbnailUrl = await generateThumbnail(filePath, fileName, extension);
      
      // Create document record
      const documentData = {
        title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension from title
        description: `Imported from Microsoft OneDrive`,
        fileName: uniqueFilename,
        fileType: extension,
        fileSize: fileStat.size,
        category: category || 'cadet',
        uploadedBy: userId,
        thumbnailUrl: thumbnailUrl || null,
      };
      
      const document = await storage.createDocument(documentData as any);
      res.json(document);
    } catch (error) {
      console.error('Error importing Microsoft file:', error);
      res.status(500).json({ message: 'Failed to import Microsoft file' });
    }
  });

  /**
   * Disconnect Google Drive integration
   */
  app.delete('/api/integrations/google/disconnect', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      await storage.deleteGoogleTokens(userId);
      res.json({ success: true, message: 'Google Drive disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error);
      res.status(500).json({ message: 'Failed to disconnect Google Drive' });
    }
  });

  /**
   * Disconnect Microsoft OneDrive integration
   */
  app.delete('/api/integrations/microsoft/disconnect', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      await storage.deleteMicrosoftTokens(userId);
      res.json({ success: true, message: 'Microsoft OneDrive disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting Microsoft OneDrive:', error);
      res.status(500).json({ message: 'Failed to disconnect Microsoft OneDrive' });
    }
  });

  /**
   * Check connection status for both Google and Microsoft integrations
   */
  app.get('/api/integrations/status', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId.toString()) : 1;
      
      const googleTokens = await storage.getGoogleTokens(userId);
      const microsoftTokens = await storage.getMicrosoftTokens(userId);
      
      res.json({
        google: {
          connected: !!(googleTokens && googleTokens.access_token),
          expiresAt: googleTokens?.expiry_date || null
        },
        microsoft: {
          connected: !!(microsoftTokens && (microsoftTokens.accessToken || microsoftTokens.access_token)),
          expiresAt: microsoftTokens?.expiresOn || null
        }
      });
    } catch (error) {
      console.error('Error checking integration status:', error);
      res.status(500).json({ message: 'Failed to check integration status' });
    }
  });
}