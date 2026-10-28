import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Cloud, FileText, Download, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
}

interface IntegrationStatus {
  google: {
    connected: boolean;
    expiresAt: string | null;
  };
  microsoft: {
    connected: boolean;
    expiresAt: string | null;
  };
}

export function CloudIntegrations() {
  const [selectedFiles, setSelectedFiles] = useState<{ [provider: string]: CloudFile[] }>({});
  const [importCategory, setImportCategory] = useState<"onboarding" | "cadet">("cadet");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check integration status
  const { data: integrationStatus, isLoading: statusLoading } = useQuery<IntegrationStatus>({
    queryKey: ["/api/integrations/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Google Drive files
  const { data: googleFiles, isLoading: googleLoading, refetch: refetchGoogle } = useQuery<CloudFile[]>({
    queryKey: ["/api/integrations/google/files"],
    enabled: integrationStatus?.google?.connected || false,
  });

  // Microsoft OneDrive files
  const { data: microsoftFiles, isLoading: microsoftLoading, refetch: refetchMicrosoft } = useQuery<CloudFile[]>({
    queryKey: ["/api/integrations/microsoft/files"],
    enabled: integrationStatus?.microsoft?.connected || false,
  });

  // Import mutation for Google Drive
  const googleImportMutation = useMutation({
    mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      return apiRequest("POST", "/api/integrations/google/import", { fileId, fileName, category: importCategory });
    },
    onSuccess: () => {
      toast({
        title: "File imported successfully",
        description: "Your Google Drive file has been added to the document repository.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Failed to import file from Google Drive.",
        variant: "destructive",
      });
    },
  });

  // Import mutation for Microsoft OneDrive
  const microsoftImportMutation = useMutation({
    mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      return apiRequest("POST", "/api/integrations/microsoft/import", { fileId, fileName, category: importCategory });
    },
    onSuccess: () => {
      toast({
        title: "File imported successfully",
        description: "Your OneDrive file has been added to the document repository.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Failed to import file from OneDrive.",
        variant: "destructive",
      });
    },
  });

  // Disconnect mutations
  const googleDisconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/integrations/google/disconnect");
    },
    onSuccess: () => {
      toast({
        title: "Google Drive Disconnected",
        description: "Your Google Drive account has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
    },
    onError: () => {
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect Google Drive.",
        variant: "destructive",
      });
    },
  });

  const microsoftDisconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/integrations/microsoft/disconnect");
    },
    onSuccess: () => {
      toast({
        title: "OneDrive Disconnected",
        description: "Your Microsoft OneDrive account has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
    },
    onError: () => {
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect OneDrive.",
        variant: "destructive",
      });
    },
  });

  // Listen for popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        toast({
          title: "Google Drive Connected!",
          description: "You can now import files from your Google Drive.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect Google Drive. Please try again.",
          variant: "destructive",
        });
      } else if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
        toast({
          title: "OneDrive Connected!",
          description: "You can now import files from your OneDrive.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
      } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect OneDrive. Please try again.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, queryClient]);

  const handleConnect = (provider: "google" | "microsoft") => {
    // Open OAuth in popup window
    window.open(
      `/api/integrations/${provider}/authorize`,
      `${provider}-oauth`,
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const handleFileSelect = (provider: string, file: CloudFile, selected: boolean) => {
    setSelectedFiles(prev => ({
      ...prev,
      [provider]: selected 
        ? [...(prev[provider] || []), file]
        : (prev[provider] || []).filter(f => f.id !== file.id)
    }));
  };

  const handleImportSelected = async (provider: "google" | "microsoft") => {
    const files = selectedFiles[provider] || [];
    if (files.length === 0) return;

    const mutation = provider === "google" ? googleImportMutation : microsoftImportMutation;
    
    for (const file of files) {
      await mutation.mutateAsync({ fileId: file.id, fileName: file.name });
    }
    
    setSelectedFiles(prev => ({ ...prev, [provider]: [] }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("video")) return "🎥";
    if (mimeType.includes("audio")) return "🎵";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📈";
    return "📁";
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Cloud Storage Integrations</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect your Google Drive and Microsoft OneDrive accounts to import documents 
            directly into Cadet for enhanced AI assistance and onboarding materials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Drive Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Google Drive</span>
                    {integrationStatus?.google?.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Import documents from your Google Drive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!integrationStatus?.google?.connected ? (
                <Button onClick={() => handleConnect("google")} className="w-full">
                  Connect Google Drive
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {googleFiles?.length || 0} files available
                    </span>
                    <div className="flex space-x-2">
                      <Button onClick={() => refetchGoogle()} variant="outline" size="sm">
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => googleDisconnectMutation.mutate()} 
                        variant="destructive" 
                        size="sm"
                        disabled={googleDisconnectMutation.isPending}
                      >
                        {googleDisconnectMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {googleLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : googleFiles && googleFiles.length > 0 ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Import Files
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Import from Google Drive</DialogTitle>
                          <DialogDescription>
                            Select files to import into your document repository
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">Import to:</span>
                            <Select value={importCategory} onValueChange={(value: "onboarding" | "cadet") => setImportCategory(value)}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onboarding">Onboarding Documents</SelectItem>
                                <SelectItem value="cadet">Cadet Documents</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2 max-h-96 overflow-y-auto">
                            {googleFiles.map((file) => (
                              <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={(selectedFiles.google || []).some(f => f.id === file.id)}
                                  onChange={(e) => handleFileSelect("google", file, e.target.checked)}
                                  className="rounded"
                                />
                                <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t">
                            <span className="text-sm text-gray-600">
                              {(selectedFiles.google || []).length} files selected
                            </span>
                            <Button 
                              onClick={() => handleImportSelected("google")}
                              disabled={(selectedFiles.google || []).length === 0 || googleImportMutation.isPending}
                            >
                              {googleImportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Import Selected
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No files found in your Google Drive
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Microsoft OneDrive Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Microsoft OneDrive</span>
                    {integrationStatus?.microsoft?.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Import documents from your OneDrive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!integrationStatus?.microsoft?.connected ? (
                <Button onClick={() => handleConnect("microsoft")} className="w-full">
                  Connect OneDrive
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {microsoftFiles?.length || 0} files available
                    </span>
                    <div className="flex space-x-2">
                      <Button onClick={() => refetchMicrosoft()} variant="outline" size="sm">
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => microsoftDisconnectMutation.mutate()} 
                        variant="destructive" 
                        size="sm"
                        disabled={microsoftDisconnectMutation.isPending}
                      >
                        {microsoftDisconnectMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {microsoftLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : microsoftFiles && microsoftFiles.length > 0 ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Import Files
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Import from OneDrive</DialogTitle>
                          <DialogDescription>
                            Select files to import into your document repository
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">Import to:</span>
                            <Select value={importCategory} onValueChange={(value: "onboarding" | "cadet") => setImportCategory(value)}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onboarding">Onboarding Documents</SelectItem>
                                <SelectItem value="cadet">Cadet Documents</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2 max-h-96 overflow-y-auto">
                            {microsoftFiles.map((file) => (
                              <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={(selectedFiles.microsoft || []).some(f => f.id === file.id)}
                                  onChange={(e) => handleFileSelect("microsoft", file, e.target.checked)}
                                  className="rounded"
                                />
                                <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t">
                            <span className="text-sm text-gray-600">
                              {(selectedFiles.microsoft || []).length} files selected
                            </span>
                            <Button 
                              onClick={() => handleImportSelected("microsoft")}
                              disabled={(selectedFiles.microsoft || []).length === 0 || microsoftImportMutation.isPending}
                            >
                              {microsoftImportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Import Selected
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No files found in your OneDrive
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Cloud Integration Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Cloud className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">Connect</h3>
                <p className="text-sm text-gray-600">
                  Securely connect your Google Drive or OneDrive account
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">Import</h3>
                <p className="text-sm text-gray-600">
                  Select and import relevant documents to your repository
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">Enhance</h3>
                <p className="text-sm text-gray-600">
                  AI assistants use imported documents for better responses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}