import path from 'path';
import fs from 'fs';

// Enhanced Presenton-style layout themes
const LAYOUT_THEMES = {
  general: {
    name: 'General',
    primary: '1B365D',
    secondary: '4A90E2', 
    accent: 'FF6B35',
    text: '333333',
    lightText: '666666',
    background: 'FFFFFF',
    lightBg: 'F8F9FA'
  },
  modern: {
    name: 'Modern',
    primary: '2563EB',
    secondary: '3B82F6',
    accent: '10B981',
    text: '1F2937',
    lightText: '6B7280',
    background: 'FFFFFF',
    lightBg: 'F9FAFB'
  },
  professional: {
    name: 'Professional',
    primary: '1E40AF',
    secondary: '3730A3',
    accent: 'DC2626',
    text: '374151',
    lightText: '9CA3AF',
    background: 'FFFFFF',
    lightBg: 'F3F4F6'
  },
  classic: {
    name: 'Classic',
    primary: '1F2937',
    secondary: '374151',
    accent: 'F59E0B',
    text: '111827',
    lightText: '6B7280',
    background: 'FFFFFF',
    lightBg: 'F9FAFB'
  },
  creative: {
    name: 'Creative',
    primary: '7C3AED',
    secondary: '8B5CF6',
    accent: 'F59E0B',
    text: '374151',
    lightText: '6B7280',
    background: 'FEFBFF',
    lightBg: 'F3F0FF'
  },
  academic: {
    name: 'Academic',
    primary: '065F46',
    secondary: '047857',
    accent: 'DC2626',
    text: '111827',
    lightText: '6B7280',
    background: 'F9FAFB',
    lightBg: 'F0FDF4'
  }
};

// Default brand colors (the "general" theme)
const BRAND_COLORS = LAYOUT_THEMES.general;

// Default presentation template
const BRAND_TEMPLATE = {
  title: {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: BRAND_COLORS.primary,
    align: 'left'
  },
  subtitle: {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.8,
    fontSize: 18,
    color: BRAND_COLORS.lightText,
    align: 'left'
  },
  slideTitle: {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 28,
    bold: true,
    color: BRAND_COLORS.primary,
    align: 'left'
  },
  content: {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 5,
    fontSize: 16,
    color: BRAND_COLORS.text,
    bullet: true,
    align: 'left'
  }
};

// Presenton-enhanced slide types for better content structure
interface EnhancedSlide {
  title: string;
  content: string;
  slideType?: 'title' | 'content' | 'section' | 'conclusion' | 'image';
  layout?: 'bullets' | 'two-column' | 'image-text' | 'full-image' | 'chart';
  imageUrl?: string;
  notes?: string;
}

// Enhanced presentation generation with Presenton capabilities
export async function generatePowerPointPresentation(
  title: string,
  slides: Array<{ title: string; content: string; highlights?: string[] }>,
  outputFormat: 'pptx' | 'pdf' = 'pptx',
  theme: string = 'general',
  language: string = 'English',
  slideCount?: number
): Promise<string> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  
  // Get theme colors and ensure all values are valid strings
  const baseTheme = LAYOUT_THEMES[theme as keyof typeof LAYOUT_THEMES] || LAYOUT_THEMES.general;
  const currentTheme = {
    ...baseTheme,
    primary: String(baseTheme.primary || '1B365D').replace('#', ''),
    secondary: String(baseTheme.secondary || '4A90E2').replace('#', ''),
    accent: String(baseTheme.accent || 'FF6B35').replace('#', ''),
    text: String(baseTheme.text || '333333').replace('#', ''),
    lightText: String(baseTheme.lightText || '666666').replace('#', ''),
    background: String(baseTheme.background || 'FFFFFF').replace('#', ''),
    lightBg: String(baseTheme.lightBg || 'F8F9FA').replace('#', '')
  };
  
  // Set presentation properties
  pptx.author = 'Cadet AI Generator';
  pptx.company = 'Professional Training Materials';
  pptx.title = title;
  pptx.subject = `${title} - Generated with Presenton AI`;
  
  // Create enhanced title slide with Presenton styling
  const titleSlide = pptx.addSlide();
  
  // Add main title with enhanced typography
  titleSlide.addText(title, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: currentTheme.primary,
    align: 'center',
    fontFace: 'Arial'
  });
  
  // Add subtitle with theme styling
  titleSlide.addText('AI-Generated Professional Training Materials', {
    x: 1,
    y: 4.2,
    w: 8,
    h: 0.8,
    fontSize: 20,
    color: currentTheme.lightText,
    align: 'center',
    fontFace: 'Arial'
  });
  
  // Add decorative accent element (gradient fills aren't in pptxgenjs's typed
  // API; the library accepts the extended shape at runtime)
  titleSlide.addShape('rect', {
    x: 3.5,
    y: 5.5,
    w: 3,
    h: 0.2,
    fill: {
      type: 'gradient',
      stops: [
        { position: 0, color: currentTheme.accent },
        { position: 100, color: currentTheme.secondary }
      ]
    } as any
  });
  
  // Add theme name watermark
  titleSlide.addText(`${currentTheme.name} Theme`, {
    x: 8,
    y: 6.8,
    w: 1.5,
    h: 0.3,
    fontSize: 10,
    color: currentTheme.lightText,
    align: 'right',
    fontFace: 'Arial',
    italic: true
  });

  // Revolutionary content slide generation with premium visual design
  slides.forEach((slide, index) => {
    const contentSlide = pptx.addSlide();
    
    // Add clean background
    contentSlide.background = { color: currentTheme.background };
    
    // Add professional header design element
    contentSlide.addShape('rect', {
      x: 0,
      y: 0,
      w: 10,
      h: 0.1,
      fill: { color: currentTheme.primary }
    });
    
    // Enhanced slide title with professional typography
    contentSlide.addText(slide.title, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 1,
      fontSize: 28,
      bold: true,
      color: currentTheme.primary,
      align: 'left',
      fontFace: 'Calibri'
    });
    
    // Add dynamic accent line
    contentSlide.addShape('rect', {
      x: 0.5,
      y: 1.4,
      w: 4,
      h: 0.05,
      fill: { color: currentTheme.accent }
    });
    
    // Handle rich content structure with highlights
    const hasHighlights = slide.highlights && Array.isArray(slide.highlights) && slide.highlights.length > 0;
    const mainContent = slide.content || '';
    const highlights = slide.highlights || [];
    
    if (hasHighlights) {
      // Premium rich content layout
      
      // Main content with enhanced typography
      contentSlide.addText(mainContent, {
        x: 0.8,
        y: 2.3,
        w: 8.4,
        h: 2.8,
        fontSize: 16,
        color: currentTheme.text,
        fontFace: 'Calibri',
        align: 'justify',
        lineSpacing: 24,
        margin: 0.1
      });
      
      // Highlights section header with visual emphasis
      contentSlide.addShape('rect', {
        x: 0.8,
        y: 5.3,
        w: 0.3,
        h: 0.3,
        fill: { color: currentTheme.accent }
      });
      
      contentSlide.addText('Key Highlights', {
        x: 1.2,
        y: 5.25,
        w: 7.8,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: currentTheme.primary,
        fontFace: 'Calibri'
      });
      
      // Professional highlight bullets with custom styling
      highlights.forEach((highlight, hIndex) => {
        // Premium bullet design
        contentSlide.addShape('ellipse', {
          x: 1.0,
          y: 5.8 + (hIndex * 0.35),
          w: 0.12,
          h: 0.12,
          fill: { color: currentTheme.accent }
        });
        
        contentSlide.addShape('ellipse', {
          x: 1.03,
          y: 5.83 + (hIndex * 0.35),
          w: 0.06,
          h: 0.06,
          fill: { color: currentTheme.background }
        });
        
        // Enhanced highlight text
        contentSlide.addText(highlight, {
          x: 1.3,
          y: 5.75 + (hIndex * 0.35),
          w: 7.9,
          h: 0.3,
          fontSize: 14,
          color: currentTheme.text,
          fontFace: 'Calibri',
          lineSpacing: 18
        });
      });
      
    } else {
      // Enhanced fallback layout for traditional content
      const contentParagraphs = mainContent.split('\n\n').filter(p => p.trim());
      
      if (contentParagraphs.length > 1) {
        // Multi-paragraph layout
        contentParagraphs.forEach((paragraph, pIndex) => {
          contentSlide.addText(paragraph.trim(), {
            x: 0.8,
            y: 2.3 + (pIndex * 1.2),
            w: 8.4,
            h: 1,
            fontSize: 15,
            color: currentTheme.text,
            fontFace: 'Calibri',
            align: 'justify',
            lineSpacing: 20
          });
        });
      } else {
        // Single content block with enhanced bullet points
        const bulletPoints = mainContent
          .split('\n')
          .filter(point => point.trim())
          .map(point => point.replace(/^[•\-\*]\s*/, '').trim());
        
        bulletPoints.forEach((point, pIndex) => {
          // Custom diamond bullet
          contentSlide.addShape('rect', {
            x: 1.0,
            y: 2.5 + (pIndex * 0.4),
            w: 0.1,
            h: 0.1,
            fill: { color: currentTheme.accent },
            rotate: 45
          });
          
          // Enhanced bullet text with better spacing
          contentSlide.addText(point, {
            x: 1.3,
            y: 2.45 + (pIndex * 0.4),
            w: 7.9,
            h: 0.35,
            fontSize: 15,
            color: currentTheme.text,
            fontFace: 'Calibri',
            lineSpacing: 18
          });
        });
      }
    }
    
    // Add professional footer
    contentSlide.addShape('rect', {
      x: 0,
      y: 7.0,
      w: 10,
      h: 0.5,
      fill: { color: currentTheme.lightBg }
    });
    
    // Enhanced slide number with professional styling
    contentSlide.addShape('ellipse', {
      x: 9.0,
      y: 7.1,
      w: 0.3,
      h: 0.3,
      fill: { color: currentTheme.primary }
    });
    
    contentSlide.addText(`${index + 2}`, {
      x: 9.0,
      y: 7.1,
      w: 0.3,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: currentTheme.background,
      align: 'center',
      fontFace: 'Calibri',
      valign: 'middle'
    });
    
    // Dynamic progress indicator
    const progressWidth = (index + 1) / slides.length * 7.5;
    contentSlide.addShape('rect', {
      x: 1,
      y: 7.45,
      w: progressWidth,
      h: 0.06,
      fill: { color: currentTheme.accent }
    });
    
    // Add subtle decorative corner elements
    contentSlide.addShape('triangle', {
      x: 9.6,
      y: 0.5,
      w: 0.2,
      h: 0.2,
      fill: { color: currentTheme.lightText }
    });
    
    contentSlide.addShape('ellipse', {
      x: 0.1,
      y: 7.1,
      w: 0.15,
      h: 0.15,
      fill: { color: currentTheme.accent }
    });
  });

  // Generate file with enhanced metadata
  const timestamp = Date.now();
  const themeSuffix = theme !== 'general' ? `_${theme}` : '';
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}${themeSuffix}_${timestamp}`;
  const outputDir = path.join(process.cwd(), 'uploads', 'generated');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let filePath: string;
  
  if (outputFormat === 'pptx') {
    filePath = path.join(outputDir, `${filename}.pptx`);
    await pptx.writeFile({ fileName: filePath });
    console.log(`Presenton PowerPoint file created with ${currentTheme.name} theme:`, filePath);
  } else {
    // For PDF, create PPTX first then handle conversion
    const pptxPath = path.join(outputDir, `${filename}.pptx`);
    await pptx.writeFile({ fileName: pptxPath });
    filePath = pptxPath;
    console.log(`Presenton PowerPoint file created with ${currentTheme.name} theme:`, filePath);
  }
  
  return `/api/generated/${path.basename(filePath)}`;
}

export async function generatePDFPresentation(
  title: string,
  slides: Array<{ title: string; content: string; highlights?: string[] }>,
  theme: string = 'general'
): Promise<string> {
  // Enhanced PDF generation with Presenton features
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });
  
  // Get theme colors
  const currentTheme = LAYOUT_THEMES[theme as keyof typeof LAYOUT_THEMES] || LAYOUT_THEMES.general;
  
  // Convert hex colors to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const primaryRgb = hexToRgb(currentTheme.primary);
  const secondaryRgb = hexToRgb(currentTheme.secondary);
  const accentRgb = hexToRgb(currentTheme.accent);
  const textRgb = hexToRgb(currentTheme.text);
  const lightTextRgb = hexToRgb(currentTheme.lightText);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Enhanced title slide with gradient simulation
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  // Add gradient effect with multiple rectangles
  for (let i = 0; i < 20; i++) {
    const ratio = i / 20;
    const r = Math.round(primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * ratio);
    const g = Math.round(primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * ratio);
    const b = Math.round(primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * ratio);
    
    doc.setFillColor(r, g, b);
    doc.rect(0, 100 + i * 2, pageWidth, 2, 'F');
  }
  
  // Title text with better positioning
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 60);
  
  // Subtitle
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  const subtitle = 'AI-Generated Professional Training Materials';
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 180);
  
  // Theme indicator
  doc.setTextColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b);
  doc.setFontSize(12);
  doc.text(`${currentTheme.name} Theme`, pageWidth - 150, pageHeight - 30);
  
  // Enhanced content slides
  slides.forEach((slide, index) => {
    doc.addPage();
    
    // Header with theme colors and gradient effect
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // Header gradient
    for (let i = 0; i < 10; i++) {
      const ratio = i / 10;
      const r = Math.round(primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * ratio);
      const g = Math.round(primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * ratio);
      const b = Math.round(primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * ratio);
      
      doc.setFillColor(r, g, b);
      doc.rect(0, 80 + i, pageWidth, 1, 'F');
    }
    
    // Slide title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.title, 40, 50);
    
    // Accent line under title
    doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setLineWidth(3);
    doc.line(40, 70, 40 + doc.getTextWidth(slide.title), 70);
    
    // Content with enhanced formatting
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    
    const bulletPoints = slide.content
      .split('\n')
      .filter(point => point.trim())
      .map(point => point.replace(/^[•\-\*]\s*/, ''));
    
    let yPosition = 140;
    const maxWidth = pageWidth - 120;
    
    bulletPoints.forEach(point => {
      if (yPosition < pageHeight - 100) {
        // Handle long text with wrapping
        const words = point.split(' ');
        let line = '';
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth > maxWidth && line !== '') {
            doc.text(`• ${line.trim()}`, 60, yPosition);
            line = word + ' ';
            yPosition += 20;
          } else {
            line = testLine;
          }
        });
        
        if (line.trim() !== '') {
          doc.text(`• ${line.trim()}`, 60, yPosition);
          yPosition += 25;
        }
      }
    });
    
    // Progress indicator
    const progressWidth = (index + 1) / slides.length * (pageWidth - 80);
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.rect(40, pageHeight - 60, progressWidth, 4, 'F');
    
    // Page number with theme styling
    doc.setTextColor(lightTextRgb.r, lightTextRgb.g, lightTextRgb.b);
    doc.setFontSize(12);
    doc.text(`${index + 1} / ${slides.length}`, pageWidth - 100, pageHeight - 30);
  });
  
  // Save enhanced PDF with metadata
  const timestamp = Date.now();
  const themeSuffix = theme !== 'general' ? `_${theme}` : '';
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}${themeSuffix}_${timestamp}.pdf`;
  const outputDir = path.join(process.cwd(), 'uploads', 'generated');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Add metadata to PDF
  doc.setProperties({
    title: title,
    subject: 'AI-Generated Presentation with Presenton',
    author: 'Cadet AI Generator',
    keywords: `presentation, ${theme}, AI-generated`,
    creator: 'Presenton Enhanced Generator'
  });
  
  const filePath = path.join(outputDir, filename);
  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
  
  console.log(`Presenton PDF created with ${currentTheme.name} theme:`, filePath);
  return `/api/generated/${filename}`;
}