import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RepositoryFiltersProps {
  filters: {
    documentType: string[];
    category: string[];
  };
  onChange: (filters: {
    documentType: string[];
    category: string[];
  }) => void;
}

export default function RepositoryFilters({ filters, onChange }: RepositoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when checkbox is toggled
  const handleFilterChange = (
    filterType: 'documentType' | 'category',
    value: string,
    checked: boolean
  ) => {
    const newFilters = { ...localFilters };
    
    if (checked) {
      newFilters[filterType] = [...newFilters[filterType], value];
    } else {
      newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
    }
    
    setLocalFilters(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    onChange(localFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetState = {
      documentType: [],
      category: [],
    };
    setLocalFilters(resetState);
    onChange(resetState);
  };

  // Available filter options

  const documentTypes = [
    { id: 'pdf', label: 'PDF Guides' },
    { id: 'ppt', label: 'Presentations' },
    { id: 'doc', label: 'Worksheets' },
    { id: 'mp4', label: 'Video Tutorials' },
    { id: 'jpg', label: 'Images' },
    { id: 'png', label: 'Graphics' },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Filters</h2>
        
        <div className="space-y-6">
          {/* Document Type filters */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Document Type</h3>
            <div className="space-y-2">
              {documentTypes.map((type) => (
                <div key={type.id} className="flex items-center">
                  <Checkbox
                    id={`document-type-${type.id}`}
                    checked={localFilters.documentType.includes(type.id)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('documentType', type.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`document-type-${type.id}`}
                    className="ml-2 text-sm text-neutral-600"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="pt-2">
            <Button 
              className="w-full mb-2" 
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
