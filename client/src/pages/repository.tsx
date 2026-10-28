import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from '@/components/ui/pagination';
import { Upload } from 'lucide-react';
import DocumentCard from '@/components/repository/DocumentCard';
import RepositoryFilters from '@/components/repository/RepositoryFilters';
import FileUploadDialog from '@/components/repository/FileUploadDialog';
import { Document } from '@shared/schema';

export default function Repository() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    documentType: [] as string[],
    category: [] as string[]
  });

  // Convert filters to query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.documentType.length > 0) {
      params.append('fileType', filters.documentType.join(','));
    }
    if (filters.category.length > 0) {
      params.append('category', filters.category.join(','));
    }
    return params.toString();
  };

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', filters],
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Document Repository</h1>
        <p className="text-neutral-600 mt-2">Access, upload, and organize educational resources by skill level</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filters */}
        <div className="lg:col-span-1">
          <RepositoryFilters 
            filters={filters} 
            onChange={handleFilterChange} 
          />
        </div>
        
        {/* Documents grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-800">All Documents</h2>
                <div className="mt-3 sm:mt-0 flex items-center">
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-pulse">Loading documents...</div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No documents found. Try adjusting your filters or upload a new document.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <DocumentCard key={document.id} document={document} />
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {documents.length > 0 && (
                <div className="mt-8 flex items-center justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">
                          2
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">
                          3
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog 
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </div>
  );
}
