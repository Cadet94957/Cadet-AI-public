import { Download, Eye, Share2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudyMaterial } from '@shared/schema';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Define types for different content structures
type SlideType = { title: string; content: string };
type SectionType = { heading: string; content: string };

type PresentationContent = SlideType[] | { slides: SlideType[] };
type StudyNotesContent = { introduction?: string; sections: SectionType[] };

interface MaterialCardProps {
  material: StudyMaterial;
}

export default function MaterialCard({ material }: MaterialCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/study-materials/${material.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete material');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-materials'] });
      toast({
        title: "Success",
        description: "Study material deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete study material.",
        variant: "destructive",
      });
    },
  });
  
  // Function to handle material download
  const handleDownload = () => {
    if (material.fileUrl) {
      // If there's a file URL, create a download link
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = material.fileUrl.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // No fallback for presentations - they should always have a file
    toast({
      title: "Download unavailable",
      description: "This presentation file is not available for download.",
      variant: "destructive",
    });
    
    try {
      // Create a formatted version of the content based on material type
      let downloadContent = '';
      let filename = `${material.title.replace(/\s+/g, '_')}.txt`;
      
      if (material.type === 'presentation') {
        downloadContent = formatPresentationForDownload(material.content as PresentationContent);
        filename = `${material.title.replace(/\s+/g, '_')}_presentation.txt`;
      } else if (material.type === 'studyNotes') {
        downloadContent = formatStudyNotesForDownload(material.content as StudyNotesContent);
        filename = `${material.title.replace(/\s+/g, '_')}_study_notes.txt`;
      }
      
      // Create the download blob and trigger the download
      const blob = new Blob([downloadContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download successful",
        description: `${getTypeDisplay()} has been downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the material.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Format presentation content for download
  const formatPresentationForDownload = (content: PresentationContent): string => {
    let slides: SlideType[] = [];
    
    if (Array.isArray(content)) {
      slides = content;
    } else if (content.slides) {
      slides = content.slides;
    }
    
    let result = `${material.title.toUpperCase()}\n`;
    result += `Type: Presentation\n\n`;
    
    slides.forEach((slide, index) => {
      result += `SLIDE ${index + 1}: ${slide.title}\n`;
      result += `${slide.content}\n\n`;
    });
    
    return result;
  };
  

  
  // Format study notes content for download
  const formatStudyNotesForDownload = (content: StudyNotesContent): string => {
    let result = `${material.title.toUpperCase()}\n`;
    result += `Type: Notes\n\n`;
    
    if (content.introduction) {
      result += `INTRODUCTION\n${content.introduction}\n\n`;
    }
    
    if (content.sections) {
      content.sections.forEach((section, index) => {
        result += `SECTION ${index + 1}: ${section.heading}\n`;
        result += `${section.content}\n\n`;
      });
    }
    
    return result;
  };
  
  // Icons for different material types
  const getIcon = () => {
    switch (material.type) {
      case 'presentation':
        return "fas fa-file-powerpoint text-blue-600";
      case 'studyNotes':
        return "fas fa-file-alt text-purple-600";
      default:
        return "fas fa-file-alt text-gray-600";
    }
  };
  


  // Get content count based on material type
  const getContentCount = () => {
    if (material.type === 'presentation') {
      const content = material.content as PresentationContent;
      if (Array.isArray(content)) {
        return `${content.length || 0} slides`;
      } else if (content && typeof content === 'object' && 'slides' in content) {
        return `${content.slides.length || 0} slides`;
      }
      return '0 slides';
    } else if (material.type === 'studyNotes') {
      const content = material.content as StudyNotesContent;
      if (content && typeof content === 'object' && 'sections' in content) {
        return `${content.sections.length || 0} sections`;
      }
      return '0 sections';
    }
    return '';
  };

  // Get display name for material type
  const getTypeDisplay = () => {
    switch (material.type) {
      case 'presentation':
        return 'Presentation';
      case 'studyNotes':
        return 'Notes';
      default:
        return material.type;
    }
  };

  return (
    <>
      <div className="flex items-start p-4 hover:bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <i className={getIcon()}></i>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-neutral-800">{material.title}</h4>
          </div>
          <p className="text-sm text-neutral-600 mt-1">{getTypeDisplay()} • {getContentCount()}</p>
          <div className="flex items-center mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-600 hover:text-primary-700 mr-4"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-1 h-4 w-4" /> Download
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-600 hover:text-primary-700 mr-4" 
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="mr-1 h-4 w-4" /> Preview
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{material.title}</DialogTitle>
          </DialogHeader>
          
          {material.type === 'presentation' && (
            <div className="space-y-4">
              {/* Handle both array and slides property */}
              {Array.isArray(material.content as PresentationContent) ? (
                // Handle if content is directly an array of slides
                (material.content as SlideType[]).map((slide, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-2">{slide.title}</h3>
                    <p className="whitespace-pre-line">{slide.content}</p>
                  </div>
                ))
              ) : (material.content as { slides: SlideType[] }).slides ? (
                // Handle if content has a slides property
                (material.content as { slides: SlideType[] }).slides.map((slide, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-2">{slide.title}</h3>
                    <p className="whitespace-pre-line">{slide.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p>No slides found in this presentation</p>
                </div>
              )}
            </div>
          )}
          

          
          {material.type === 'studyNotes' && (
            <div className="space-y-6">
              {/* Get introduction if available */}
              {(material.content as StudyNotesContent).introduction && (
                <p className="text-lg">{(material.content as StudyNotesContent).introduction}</p>
              )}
              
              {/* Handle sections if available */}
              {(material.content as StudyNotesContent).sections ? (
                (material.content as StudyNotesContent).sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-xl font-bold">{section.heading}</h3>
                    <p className="whitespace-pre-line">{section.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p>No sections found in these study notes</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
