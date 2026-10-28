import { Download, Bookmark, Share2, MoreVertical, Edit, Copy, Trash2, Eye, FileText, Shield } from 'lucide-react';
import { Document } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';

interface DocumentCardProps {
  document: Document & { uploaderRole?: string };
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const { user: currentUser } = useAuth();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [newDescription, setNewDescription] = useState(document.description || '');
  // Helper to get appropriate placeholder image based on the document type
  const getPlaceholderImage = (fileType: string) => {
    const type = fileType.toLowerCase();
    
    // Default background colors for different file types
    if (['pdf', 'doc', 'docx', 'txt'].includes(type)) {
      return 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=250&q=80';
    } else if (['ppt', 'pptx'].includes(type)) {
      return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=250&q=80';
    } else if (['xls', 'xlsx', 'csv'].includes(type)) {
      return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=250&q=80';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
      return 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=250&q=80';
    }
    
    // Default image
    return 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=250&q=80';
  };



  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get document type display
  const getDocumentTypeDisplay = () => {
    const fileType = document.fileType.toLowerCase();
    
    if (['pdf'].includes(fileType)) return 'PDF Guide';
    if (['doc', 'docx'].includes(fileType)) return 'Document';
    if (['ppt', 'pptx'].includes(fileType)) return 'Presentation';
    if (['xls', 'xlsx', 'csv'].includes(fileType)) return 'Spreadsheet';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) return 'Image';
    if (['mp4', 'mov', 'avi'].includes(fileType)) return 'Video';
    if (['mp3', 'wav'].includes(fileType)) return 'Audio';
    
    return fileType.toUpperCase();
  };

  // Check if document is protected (uploaded by manager)
  const isProtected = document.uploaderRole === 'manager';
  const canDelete = currentUser?.role === 'manager' || !isProtected;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/documents/${document.id}?userId=${currentUser?.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: `"${document.title}" has been deleted successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/documents/${document.id}/duplicate`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document duplicated",
        description: `"${data.title}" has been created.`,
      });
    },
    onError: () => {
      toast({
        title: "Duplicate failed",
        description: "There was an error duplicating the document.",
        variant: "destructive",
      });
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('PATCH', `/api/documents/${document.id}`, { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsRenameDialogOpen(false);
      toast({
        title: "Document renamed",
        description: `Document has been renamed to "${newTitle}".`,
      });
    },
    onError: () => {
      toast({
        title: "Rename failed",
        description: "There was an error renaming the document.",
        variant: "destructive",
      });
    },
  });

  // Edit description mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/documents/${document.id}`, {
        title: newTitle,
        description: newDescription,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Document updated",
        description: "Document has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating the document.",
        variant: "destructive",
      });
    },
  });

  // Handle document download
  const handleDownload = () => {
    window.open(`/api/files/${document.fileName}`, '_blank');
  };

  // Handle rename
  const handleRename = () => {
    if (newTitle.trim() && newTitle !== document.title) {
      renameMutation.mutate(newTitle.trim());
    }
  };

  // Handle delete
  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  // Handle duplicate
  const handleDuplicate = () => {
    duplicateMutation.mutate();
  };

  // Handle preview - increment view count when opening preview
  const handlePreview = () => {
    setIsPreviewDialogOpen(true);
    // Increment view count when previewing
    fetch(`/api/documents/${document.id}`, { method: 'GET' });
  };

  // Get file URL for preview
  const getFileUrl = () => {
    return `/api/files/${document.fileName}`;
  };

  // Check if file can be previewed inline
  const canPreviewInline = () => {
    const type = document.fileType.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'txt'].includes(type);
  };

  // Check if file is PDF (needs special handling)
  const isPDF = () => {
    return document.fileType.toLowerCase() === 'pdf';
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition">
      <div 
        className="h-40 bg-neutral-100 relative cursor-pointer group"
        onClick={handlePreview}
      >
        <div className="relative w-full h-full">
          <img 
            src={document.thumbnailUrl || getPlaceholderImage(document.fileType)} 
            alt={document.title} 
            className="w-full h-full object-cover"
          />
          {isProtected && (
            <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1.5">
              <Shield className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-neutral-800 line-clamp-2">{document.title}</h3>
        <p className="text-sm text-neutral-500 mt-1">
          {getDocumentTypeDisplay()} • {formatFileSize(document.fileSize)} {isProtected && "• Protected"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center text-neutral-500 text-sm">
            <i className="fas fa-eye mr-1"></i> {document.viewCount}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-primary-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setNewTitle(document.title);
                setNewDescription(document.description || '');
                setIsEditDialogOpen(true);
              }}>
                <FileText className="mr-2 h-4 w-4" />
                Edit Description
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
                <Copy className="mr-2 h-4 w-4" />
                {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDelete ? (
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="text-gray-400">
                  <Shield className="mr-2 h-4 w-4" />
                  Protected
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending || !newTitle.trim()}>
              {renameMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {document.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isPDF() ? (
              <div className="w-full h-[70vh] flex flex-col">
                <div className="flex-1 bg-neutral-50 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <div className="text-red-600 text-lg font-bold">PDF</div>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">{document.title}</h3>
                    <p className="text-neutral-600 mb-4">
                      Click below to view the PDF in a new tab or download it.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => window.open(getFileUrl(), '_blank')}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                      <Button variant="outline" onClick={handleDownload} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : canPreviewInline() ? (
              <div className="w-full h-[70vh]">
                {['jpg', 'jpeg', 'png', 'gif'].includes(document.fileType.toLowerCase()) ? (
                  <img
                    src={getFileUrl()}
                    alt={document.title}
                    className="w-full h-full object-contain"
                  />
                ) : document.fileType.toLowerCase() === 'txt' ? (
                  <iframe
                    src={getFileUrl()}
                    className="w-full h-full border-0 bg-white"
                    title={document.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                        {(() => {
                          const type = document.fileType.toLowerCase();
                          if (['doc', 'docx'].includes(type)) return <div className="text-blue-600 text-lg font-bold">DOC</div>;
                          if (['xls', 'xlsx'].includes(type)) return <div className="text-green-600 text-lg font-bold">XLS</div>;
                          if (['ppt', 'pptx'].includes(type)) return <div className="text-orange-600 text-lg font-bold">PPT</div>;
                          return <div className="text-neutral-600 text-lg font-bold">{type.toUpperCase()}</div>;
                        })()}
                      </div>
                      <h3 className="text-lg font-medium text-neutral-800 mb-2">{document.title}</h3>
                      <p className="text-neutral-600 mb-4">
                        This file type cannot be previewed directly in the browser.
                      </p>
                      <Button onClick={handleDownload} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download to View
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <div className="text-neutral-600 text-sm font-bold">{document.fileType.toUpperCase()}</div>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">{document.title}</h3>
                  <p className="text-neutral-600 mb-4">
                    This file type cannot be previewed directly in the browser.
                  </p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download to View
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-neutral-500">
              {getDocumentTypeDisplay()} • {formatFileSize(document.fileSize)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
