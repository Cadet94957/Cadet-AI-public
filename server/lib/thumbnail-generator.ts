import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const thumbnailDir = path.join(process.cwd(), "uploads", "thumbnails");

// Ensure thumbnail directory exists
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

/**
 * Generate thumbnail for PDF files using pdftoppm
 */
export async function generatePDFThumbnail(
  pdfPath: string, 
  fileName: string
): Promise<string | null> {
  try {
    const fileNameWithoutExt = path.parse(fileName).name.replace(/[^a-zA-Z0-9]/g, '_');
    const thumbnailFileName = `${fileNameWithoutExt}_thumbnail.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);

    // Use pdftoppm to convert first page of PDF to JPEG
    const outputPrefix = path.join(thumbnailDir, fileNameWithoutExt);
    const pdfCommand = `pdftoppm -f 1 -l 1 -jpeg -r 72 "${pdfPath}" "${outputPrefix}"`;
    
    console.log('Running PDF conversion command:', pdfCommand);
    const { stdout, stderr } = await execAsync(pdfCommand);
    
    if (stderr) {
      console.log('PDF conversion stderr:', stderr);
    }
    
    // pdftoppm creates files with format: filename-01.jpg
    const generatedImagePath = path.join(thumbnailDir, `${fileNameWithoutExt}-01.jpg`);
    
    if (fs.existsSync(generatedImagePath)) {
      // Resize and optimize the image using sharp
      await sharp(generatedImagePath)
        .resize(400, 300, { 
          fit: 'cover',
          position: 'top'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Clean up the original generated file
      fs.unlinkSync(generatedImagePath);

      console.log('PDF thumbnail generated successfully:', thumbnailFileName);
      return `/api/thumbnails/${thumbnailFileName}`;
    } else {
      console.log('Generated image file not found:', generatedImagePath);
    }

    return null;
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return null;
  }
}

/**
 * Generate thumbnail for image files
 */
export async function generateImageThumbnail(
  imagePath: string,
  fileName: string
): Promise<string | null> {
  try {
    const fileNameWithoutExt = path.parse(fileName).name;
    const thumbnailFileName = `${fileNameWithoutExt}_thumbnail.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);

    // Resize and optimize the image
    await sharp(imagePath)
      .resize(400, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return `/api/thumbnails/${thumbnailFileName}`;
  } catch (error) {
    console.error('Error generating image thumbnail:', error);
    return null;
  }
}

/**
 * Generate appropriate thumbnail based on file type
 */
export async function generateThumbnail(
  filePath: string,
  fileName: string,
  fileType: string
): Promise<string | null> {
  const type = fileType.toLowerCase();
  
  if (type === 'pdf') {
    return await generatePDFThumbnail(filePath, fileName);
  } else if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
    return await generateImageThumbnail(filePath, fileName);
  }
  
  return null;
}

/**
 * Delete thumbnail when document is deleted
 */
export function deleteThumbnail(thumbnailUrl: string | null): void {
  if (!thumbnailUrl) return;
  
  try {
    const thumbnailFileName = path.basename(thumbnailUrl);
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
    
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
  }
}