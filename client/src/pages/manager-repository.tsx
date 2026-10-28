import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Download, 
  Eye, 
  MoreVertical, 
  Upload,
  Shield,

  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedBy: number;
  viewCount: number;
  createdAt: string;
  thumbnailUrl: string | null;
  uploaderRole?: string;
}

export default function ManagerRepository() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      // The upload endpoint takes one file per request (field name "file")
      // and ingests it into the RAG index on the server.
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^.]+$/, ''));
        formData.append('category', 'cadet'); // All documents are cadet documents

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFiles(null);
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    if (selectedFiles) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const cadetDocs = documents;

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card key={document.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {document.thumbnailUrl ? (
              <img
                src={`/api/thumbnails/${document.thumbnailUrl.split('/').pop()}`}
                alt={document.title}
                className="w-12 h-12 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-12 bg-neutral-100 rounded border flex items-center justify-center">
                <FileText className="w-6 h-6 text-neutral-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-neutral-900 truncate">{document.title}</h3>
                {document.uploaderRole === 'manager' && (
                  <span title="Protected document">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </span>
                )}
              </div>
              
              {document.description && (
                <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{document.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Badge variant="secondary" className="text-xs">
                  {document.fileType.toUpperCase()}
                </Badge>
                <span>{Math.round(document.fileSize / 1024)} KB</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {document.viewCount}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/api/files/${document.fileName}`, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-800">Document Library</h1>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(e.target.files)}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-upload">
            <Button asChild className="cursor-pointer">
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </span>
            </Button>
          </label>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <Button 
              onClick={handleFileUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : `Upload ${selectedFiles.length} files`}
            </Button>
          )}
        </div>
      </div>

      {/* Document Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            Document Library
            <Badge variant="outline">{cadetDocs.length}</Badge>
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Company documents and training materials used by the AI assistant for employee support.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {cadetDocs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p>No documents yet</p>
              <p className="text-sm">Upload documents to get started</p>
            </div>
          ) : (
            cadetDocs.map((doc: Document) => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}