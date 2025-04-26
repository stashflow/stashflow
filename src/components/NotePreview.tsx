import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, FileText, File, FileImage, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as docx from 'docx-preview';
import * as mammoth from 'mammoth';
import { marked } from 'marked';

// We'll use a simpler approach for PDF preview
const loadPdfJs = async () => {
  if (typeof window !== 'undefined') {
    // Use dynamic import for pdfjs
    const pdfjs = await import('pdfjs-dist');
    // Set the worker source
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    return pdfjs;
  }
  return null;
};

interface NotePreviewProps {
  noteId: string;
  filePath: string;
  fileType: string;
  title: string;
}

export function NotePreview({ noteId, filePath, fileType, title }: NotePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [textContent, setTextContent] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Normalize file type
  const normalizedType = fileType.toLowerCase().replace(/^\./, '');

  // Check if file type is supported
  const isSupportedType = (type: string) => {
    const supportedTypes = [
      'pdf', 'doc', 'docx', 'txt', 'md',
      'jpg', 'jpeg', 'png', 'gif'
    ];
    return supportedTypes.includes(type);
  };

  useEffect(() => {
    // Clean up preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenPreview = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setTextContent('');
    setHtmlContent('');
    setPreviewPages([]);

    try {
      // Get file from storage
      const { data, error } = await supabase.storage
        .from('notes')
        .download(filePath);

      if (error) throw error;

      // Create object URL for the file
      const url = URL.createObjectURL(data);
      setPreviewUrl(url);

      // Handle different file types
      if (!isSupportedType(normalizedType)) {
        setError(`File type "${normalizedType}" is not supported for preview`);
        return;
      }
      
      if (normalizedType === 'pdf') {
        await generatePdfPreview(url);
      } else if (normalizedType === 'docx' || normalizedType === 'doc') {
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await data.arrayBuffer();
        await generateDocPreview(arrayBuffer);
      } else if (normalizedType === 'txt') {
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await data.arrayBuffer();
        await generateTextPreview(arrayBuffer);
      } else if (normalizedType === 'md') {
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await data.arrayBuffer();
        await generateMarkdownPreview(arrayBuffer);
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(normalizedType)) {
        // Image preview is handled by the previewUrl
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to load preview');
      toast.error('Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdfPreview = async (url: string) => {
    try {
      const pdfjs = await loadPdfJs();
      if (!pdfjs) {
        // If PDF.js fails to load, use iframe as fallback
        setHtmlContent(`<iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>`);
        return;
      }

      const pdf = await pdfjs.getDocument(url).promise;
      const pages: string[] = [];

      // Only render first 3 pages for preview
      const maxPages = Math.min(3, pdf.numPages);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          continue; // Skip if context can't be created
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        pages.push(canvas.toDataURL());
      }
      
      setPreviewPages(pages);
    } catch (err) {
      console.error('PDF preview error:', err);
      // Fallback to embedded PDF viewer
      setHtmlContent(`<iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>`);
    }
  };

  const generateDocPreview = async (fileBuffer: ArrayBuffer) => {
    try {
      // Create container for the document
      const container = document.createElement('div');
      container.className = 'docx-container';
      
      if (fileType.toLowerCase() === 'docx') {
        // For DOCX use docx-preview
        await docx.renderAsync(fileBuffer, container);
        setHtmlContent(container.innerHTML);
      } else {
        // For DOC use mammoth (converts to HTML)
        const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
        setHtmlContent(result.value);
      }
    } catch (err) {
      console.error('DOC preview error:', err);
      setError(`Failed to render ${fileType.toUpperCase()} preview`);
    }
  };

  const generateTextPreview = async (fileBuffer: ArrayBuffer) => {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(fileBuffer);
      setTextContent(text);
    } catch (err) {
      console.error('Text preview error:', err);
      setError('Failed to render text preview');
    }
  };

  const generateMarkdownPreview = async (fileBuffer: ArrayBuffer) => {
    try {
      const decoder = new TextDecoder('utf-8');
      const markdown = decoder.decode(fileBuffer);
      
      // Convert markdown to HTML using marked
      const html = marked(markdown as string);
      setHtmlContent(html as string);
    } catch (err) {
      console.error('Markdown preview error:', err);
      setError('Failed to render markdown preview');
    }
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-center">{error}</p>
          <p className="text-sm opacity-70 mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            Download the file to view it
          </p>
        </div>
      );
    }

    // PDF Preview with pages
    if (normalizedType === 'pdf' && previewPages.length > 0) {
      return (
        <div className="flex flex-col items-center gap-4 max-h-[70vh] overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-md">
          {previewPages.map((page, index) => (
            <img 
              key={index} 
              src={page} 
              alt={`Page ${index + 1}`} 
              className="max-w-full border shadow-md rounded"
            />
          ))}
          {previewPages.length < 3 ? null : (
            <p className="text-center text-sm opacity-70 mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              Showing first 3 pages only. Download to view the full document.
            </p>
          )}
        </div>
      );
    }

    // PDF Preview with iframe fallback
    if (normalizedType === 'pdf' && htmlContent && htmlContent.includes('iframe')) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-md overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      );
    }

    // Image Preview
    if (['jpg', 'jpeg', 'png', 'gif'].includes(normalizedType)) {
      return (
        <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
          <img
            src={previewUrl!}
            alt={title}
            className="max-h-[70vh] max-w-full object-contain rounded shadow-md"
          />
        </div>
      );
    }

    // DOCX/DOC Preview
    if (['docx', 'doc'].includes(normalizedType) && htmlContent) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md overflow-auto max-h-[70vh] shadow-inner">
          <div 
            className="docx-preview" 
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{ fontFamily: 'Arial, sans-serif' }}
          />
        </div>
      );
    }

    // Markdown Preview
    if (normalizedType === 'md' && htmlContent) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md overflow-auto max-h-[70vh] shadow-inner prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      );
    }

    // Text Preview
    if (normalizedType === 'txt' && textContent) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md overflow-auto max-h-[70vh] shadow-inner">
          <pre className="whitespace-pre-wrap text-sm font-mono">{textContent}</pre>
        </div>
      );
    }

    // Default - No preview available
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <File className="h-16 w-16 mb-4" />
        <p className="text-center text-lg">No preview available for this file type</p>
        <p className="text-sm opacity-70 mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          Download the file to view it
        </p>
      </div>
    );
  };

  const getPreviewIcon = () => {
    if (['pdf', 'doc', 'docx'].includes(normalizedType)) {
      return <FileText className="h-4 w-4 mr-2" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(normalizedType)) {
      return <FileImage className="h-4 w-4 mr-2" />;
    } else {
      return <Eye className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenPreview}
        className="text-xs rounded-full px-3 transition-all hover:bg-primary hover:text-white"
        style={{ 
          borderColor: 'var(--color-primary)',
          color: '#ffffff'
        }}
      >
        {getPreviewIcon()}
        Preview
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]" style={{ 
          backgroundColor: 'var(--color-card)', 
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem' 
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getPreviewIcon()}
              {title}
              <span className="text-xs uppercase bg-primary/10 rounded px-2 py-0.5 ml-auto mr-16">
                {normalizedType}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 