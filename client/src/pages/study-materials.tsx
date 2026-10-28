import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import GeneratorForm from '@/components/study/GeneratorForm';
import MaterialCard from '@/components/study/MaterialCard';
import { StudyMaterial } from '@shared/schema';

export default function StudyMaterials() {
  const [activeTab, setActiveTab] = useState<string>('presentation');

  // Fetch study materials
  const { data: materials = [], isLoading } = useQuery<StudyMaterial[]>({
    queryKey: ['/api/study-materials', { type: activeTab }],
  });

  // Filter materials by type
  const filteredMaterials = materials.filter(
    (material) => material.type === activeTab
  );

  // Generate material mutation with Presenton support
  const generateMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      type: string;
      details?: string;
      format?: string;
      theme?: string;
      slideCount?: number;
    }) => {
      const response = await apiRequest('POST', '/api/study-materials/generate', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-materials'] });
      toast({
        title: "Success!",
        description: "Your material has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate material. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (data: {
    title: string;
    details?: string;
    format?: string;
    theme?: string;
    slideCount?: number;
  }) => {
    generateMutation.mutate({
      ...data,
      type: activeTab,
    });
  };

  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Generate Materials</h1>
          <p className="text-neutral-600 mt-2">Create custom presentations and notes based on your learning needs</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="presentation" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="presentation">Presentations</TabsTrigger>
                <TabsTrigger value="studyNotes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="presentation">
                <GeneratorForm 
                  onSubmit={handleGenerate} 
                  isLoading={generateMutation.isPending}
                  materialType="presentation"
                />
              </TabsContent>
              

              
              <TabsContent value="studyNotes">
                <GeneratorForm 
                  onSubmit={handleGenerate} 
                  isLoading={generateMutation.isPending}
                  materialType="studyNotes"
                />
              </TabsContent>
            </Tabs>
            
            {/* Recently Generated Materials */}
            <div className="border-t border-neutral-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Your Generated Materials
              </h3>
              
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-pulse">Loading materials...</div>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No {activeTab} have been generated yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMaterials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
