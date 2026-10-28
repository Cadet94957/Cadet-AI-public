import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Palette, Hash } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().optional(),
  format: z.enum(['pptx', 'pdf']).default('pptx'),
  theme: z.enum(['general', 'modern', 'professional', 'classic', 'creative', 'academic']).default('general'),
  slideCount: z.number().min(5).max(20).default(10),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratorFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
  materialType: string; // presentation, studyNotes
}

export default function GeneratorForm({ 
  onSubmit, 
  isLoading = false,
  materialType,
}: GeneratorFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      details: '',
      format: 'pptx',
      theme: 'general',
      slideCount: 10,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  // Material type display names
  const materialTypeDisplay = {
    presentation: 'Presentation',
    studyNotes: 'Study Notes',
  }[materialType] || 'Material';

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input 
                  placeholder={`e.g., JavaScript Fundamentals, Resume Writing`} 
                  {...field}
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {materialType === 'presentation' && (
          <>
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
                      <SelectItem value="pdf">PDF Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your preferred presentation format with advanced Presenton styling.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Presentation Theme
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General - Balanced corporate style</SelectItem>
                      <SelectItem value="modern">Modern - Contemporary blue and green</SelectItem>
                      <SelectItem value="professional">Professional - Classic navy and red</SelectItem>
                      <SelectItem value="classic">Classic - Timeless black and gold</SelectItem>
                      <SelectItem value="creative">Creative - Vibrant purple and orange</SelectItem>
                      <SelectItem value="academic">Academic - Professional green and red</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose from Presenton's professionally designed themes. Each theme includes custom colors, typography, and layout optimizations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slideCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Number of Slides: {field.value}
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={5}
                      max={20}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    AI will generate {field.value} content slides plus a title slide. More slides provide deeper topic coverage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Details (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Specify any particular aspects you want to focus on" 
                  {...field}
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate {materialTypeDisplay}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
