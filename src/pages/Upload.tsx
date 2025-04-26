import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Upload as UploadIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StashAnimation from '@/components/StashAnimation';

// Create a service role client
const serviceRoleClient = supabase.auth.admin;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown'
];

// Map of MIME types to file extensions
const MIME_TO_EXTENSION = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/markdown': 'md'
};

// Function to get file extension from name
const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
};

// Function to get file type from MIME type or extension
const getFileType = (file: File): string => {
  // First try to get from MIME type
  if (file.type && MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION]) {
    return MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION];
  }
  
  // Fallback to file extension
  const extension = getFileExtension(file.name);
  if (['pdf', 'doc', 'docx', 'pptx', 'txt', 'md'].includes(extension)) {
    return extension;
  }
  
  return 'unknown';
};

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Fetch available classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to upload notes');
      return;
    }

    if (!selectedFile || !title || !selectedClass) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 2MB. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Get and validate file type
    const fileType = getFileType(selectedFile);
    if (fileType === 'unknown') {
      toast.error(`File type not supported. Please upload a PDF, DOC, DOCX, PPTX, TXT, or MD file. Detected type: ${selectedFile.type}`);
      return;
    }

    setIsUploading(true);

    try {
      // Create a sanitized file name
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}.${fileType}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Current user:', user);
      console.log('User ID:', user.id);
      console.log('User role:', user.role);
      
      console.log('Uploading file:', {
        name: fileName,
        size: selectedFile.size,
        type: selectedFile.type,
        detectedType: fileType,
        path: filePath,
        user: user.id
      });

      // Upload the file
      const uploadResult = await supabase.storage
        .from('notes')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadResult.error) {
        console.error('Upload error:', uploadResult.error);
        throw new Error(`Failed to upload file: ${uploadResult.error.message}`);
      }

      console.log('File uploaded successfully');

      // Create note record with direct insert
      const { data: noteData, error: insertError } = await supabase
        .from('notes')
        .insert({
          title,
          description: description || null,
          file_path: filePath,
          file_type: fileType,
          uploader_id: user.id,
          uploader_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          class_id: selectedClass
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        
        // Delete the uploaded file if note creation fails
        const { error: deleteError } = await supabase.storage
          .from('notes')
          .remove([filePath]);
          
        if (deleteError) {
          console.error('Failed to delete file after failed note creation:', deleteError);
        }
        
        throw new Error(`Failed to create note: ${insertError.message}`);
      }

      console.log('Note created successfully:', noteData);

      // Show success animation
      const successAnimation = document.createElement('div');
      successAnimation.className = 'min-h-screen flex flex-col items-center justify-center p-8 fixed inset-0 z-50';
      successAnimation.style.backgroundColor = 'var(--color-background)';
      successAnimation.style.color = 'var(--color-text)';
      successAnimation.innerHTML = `
        <div class="max-w-2xl w-full space-y-8">
          <div class="flex justify-center items-center h-64">
            <StashAnimation type="upload" size="lg" isActive={true} />
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-bold">Upload Successful!</h2>
            <p class="text-slate-400">Your note has been uploaded successfully</p>
          </div>
        </div>
      `;
      document.body.appendChild(successAnimation);

      // Remove animation after 2 seconds
      setTimeout(() => {
        successAnimation.remove();
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload note: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--color-card)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl" style={{ color: 'var(--color-text)' }}>
              <UploadIcon className="h-6 w-6" />
              Upload Notes
            </CardTitle>
            <CardDescription style={{ color: 'var(--color-text)' }}>
              Share your study materials with the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" style={{ color: 'var(--color-text)' }}>Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter note title"
                  required
                  disabled={isUploading}
                  style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: 'var(--color-text)' }}>Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of the note"
                  disabled={isUploading}
                  style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class" style={{ color: 'var(--color-text)' }}>Class</Label>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={isUploading || isLoadingClasses}
                >
                  <SelectTrigger 
                    style={{ 
                      backgroundColor: 'var(--color-input)', 
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent 
                    style={{ 
                      backgroundColor: 'var(--color-card)', 
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {classes?.map((cls) => (
                      <SelectItem 
                        key={cls.id} 
                        value={cls.id} 
                        style={{ 
                          color: 'var(--color-text)',
                          backgroundColor: 'var(--color-card)'
                        }}
                      >
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" style={{ color: 'var(--color-text)' }}>File</Label>
                <div className="flex items-center justify-center w-full">
                  <Label
                    htmlFor="file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-input)',
                      borderColor: 'var(--color-accent)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 mb-3" style={{ color: 'var(--color-text)' }} />
                      <p className="mb-2 text-sm">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs">
                        PDF, DOC, DOCX, PPTX, TXT, MD (Max size: 2MB)
                      </p>
                    </div>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.pptx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={isUploading}
                      required
                      className="hidden"
                    />
                  </Label>
                </div>
                {selectedFile && (
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isUploading || isLoadingClasses}
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <StashAnimation type="upload" size="sm" isActive={true} />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload Note
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}