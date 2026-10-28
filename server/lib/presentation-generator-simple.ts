import path from 'path';
import fs from 'fs';

// Simple presentation generation for testing
export async function generateSimplePowerPointPresentation(
  title: string,
  slides: Array<{ title: string; content: string }>,
  outputFormat: 'pptx' | 'pdf' = 'pptx'
): Promise<string> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  
  // Set basic properties
  pptx.author = 'Cadet AI Generator';
  pptx.title = title;
  
  // Create title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(title, {
    x: 1,
    y: 2,
    w: 8,
    h: 2,
    fontSize: 36,
    bold: true,
    color: '1B365D',
    align: 'center'
  });
  
  // Create content slides
  slides.forEach((slide, index) => {
    const contentSlide = pptx.addSlide();
    
    // Add title
    contentSlide.addText(slide.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      bold: true,
      color: '1B365D'
    });
    
    // Add content
    contentSlide.addText(slide.content, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5,
      fontSize: 16,
      color: '333333'
    });
  });
  
  // Generate file
  const timestamp = Date.now();
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_simple_${timestamp}`;
  const outputDir = path.join(process.cwd(), 'uploads', 'generated');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, `${filename}.pptx`);
  await pptx.writeFile({ fileName: filePath });
  console.log('Simple PowerPoint file created:', filePath);
  
  return filePath;
}