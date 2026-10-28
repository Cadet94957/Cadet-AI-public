import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

// Base directory for all uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDirExists(): Promise<void> {
  if (!await existsAsync(UPLOAD_DIR)) {
    await mkdirAsync(UPLOAD_DIR, { recursive: true });
  }
}

// Initialize storage
export async function initializeFileStorage(): Promise<void> {
  await ensureUploadDirExists();
}

// Save file from base64 data
export async function saveFileFromBase64(
  base64Data: string,
  fileName: string
): Promise<string> {
  await ensureUploadDirExists();
  
  // Extract the actual base64 data from data URI
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data format');
  }
  
  const data = Buffer.from(matches[2], 'base64');
  const storedFileName = `${Date.now()}-${fileName}`;
  const filePath = path.join(UPLOAD_DIR, storedFileName);
  
  await writeFileAsync(filePath, data);
  return storedFileName;
}

// Get file as base64
export async function getFileAsBase64(fileName: string): Promise<string | null> {
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  if (!await existsAsync(filePath)) {
    return null;
  }
  
  const data = await readFileAsync(filePath);
  const extension = path.extname(fileName).toLowerCase().substring(1);
  let mimeType = 'application/octet-stream';
  
  // Set appropriate mime type
  switch (extension) {
    case 'pdf':
      mimeType = 'application/pdf';
      break;
    case 'jpg':
    case 'jpeg':
      mimeType = 'image/jpeg';
      break;
    case 'png':
      mimeType = 'image/png';
      break;
    case 'gif':
      mimeType = 'image/gif';
      break;
    case 'doc':
    case 'docx':
      mimeType = 'application/msword';
      break;
    case 'xls':
    case 'xlsx':
      mimeType = 'application/vnd.ms-excel';
      break;
    case 'ppt':
    case 'pptx':
      mimeType = 'application/vnd.ms-powerpoint';
      break;
    case 'txt':
      mimeType = 'text/plain';
      break;
  }
  
  return `data:${mimeType};base64,${data.toString('base64')}`;
}

// Delete file
export async function deleteFile(fileName: string): Promise<boolean> {
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  if (!await existsAsync(filePath)) {
    return false;
  }
  
  await unlinkAsync(filePath);
  return true;
}
