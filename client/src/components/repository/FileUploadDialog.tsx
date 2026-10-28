import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, File, Image, FileText, Presentation, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function FileUploadDialog({ isOpen, onClose }: FileUploadDialogProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { toast } = useToast();

  // Get appropriate icon for file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FileText;
    if (type.includes('text') || type.includes('markdown')) return FileText;
    if (type.includes('presentation') || type.includes('powerpoint') || type.includes('ppt')) return Presentation;
    return File;
  };
  


  // Upload multiple files mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      console.log("Upload mutation started with", files.length, "files");
      setUploadError(null);
      const results = [];
      const total = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${total}:`, file.name);
        
        const formData = new FormData();
        
        // Use original filename without extension as title
        const title = file.name.replace(/\.[^/.]+$/, "");
        formData.append('title', title);
        formData.append('file', file);
        
        console.log("FormData prepared:", { title, fileName: file.name, fileSize: file.size });
        
        try {
          const currentUserId = localStorage.getItem('currentUserId') || '1';
          const response = await fetch(`/api/documents?userId=${currentUserId}`, {
            method: 'POST',
            body: formData,
          });
          
          console.log("Upload response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Upload failed with response:", errorText);
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log("Upload successful:", result);
          results.push(result);
          setUploadProgress(((i + 1) / total) * 100);
        } catch (error: any) {
          console.error("Upload error for file:", file.name, error);
          setUploadError(`Failed to upload ${file.name}: ${error.message}`);
          throw error;
        }
      }
      
      console.log("All uploads completed:", results);
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadSuccess(true);
      
      const count = results.length;
      toast({
        title: "Upload Successful!",
        description: `${count} file${count > 1 ? 's' : ''} uploaded successfully.`,
      });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the files.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("Files selected:", files);
    
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log("File array created:", fileArray.map(f => ({ name: f.name, size: f.size })));
      
      // Store files info
      setSelectedFiles(fileArray);
      
      // Preview for first image file
      const firstImageFile = fileArray.find(file => file.type.startsWith('image/'));
      if (firstImageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(firstImageFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    console.log("Files dropped:", files);
    
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log("Dropped file array created:", fileArray.map(f => ({ name: f.name, size: f.size })));
      
      // Store files info
      setSelectedFiles(fileArray);
      
      // Preview for first image file
      const firstImageFile = fileArray.find(file => file.type.startsWith('image/'));
      if (firstImageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(firstImageFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Handle upload submission
  const onSubmit = () => {
    console.log("Upload button clicked, files:", selectedFiles);
    
    // Ensure we have files before submitting
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a DataTransfer object to properly create FileList
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => {
      dataTransfer.items.add(file);
    });
    
    console.log("Starting upload mutation with files:", dataTransfer.files);
    uploadMutation.mutate(dataTransfer.files);
  };

  // Handle dialog close and reset state
  const handleClose = () => {
    setFilePreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    setIsDragOver(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload one or more documents to the repository. File names will be used as titles automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploadError && (
            <div className="bg-red-50 p-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-xs text-red-700">{uploadError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Files</label>
            <div className="space-y-2">
              <div className="relative">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    const input = document.getElementById('file-input') as HTMLInputElement;
                    input?.click();
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Select multiple files - PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, MD
                    </div>
                  </div>
                </div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      {(() => {
                        const IconComponent = getFileIcon(file.type);
                        return <IconComponent className="h-5 w-5 text-muted-foreground" />;
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.type || 'Unknown type'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading files...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-sm font-medium text-green-700">Upload completed successfully!</p>
                </div>
              )}

              {filePreview && (
                <div className="mt-4">
                  <img src={filePreview} alt="Preview" className="max-w-full h-32 object-cover rounded" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
              }}
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
            >
              {uploadMutation.isPending ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}