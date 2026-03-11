import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  accept: string;
  label: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  bucket?: string;
  folder?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  currentUrl,
  onUrlChange,
  accept,
  label,
  placeholder = 'https://...',
  hint,
  disabled = false,
  bucket = 'media-previews',
  folder = 'previews',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(!currentUrl || currentUrl.startsWith('http'));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (50MB)
    if (file.size > 52428800) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUrlChange(publicUrl);
      setUseUrl(false);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium mb-2 block">{label}</label>
      
      {/* Toggle between URL and Upload */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(true)}
          disabled={disabled}
          className="gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          URL
        </Button>
        <Button
          type="button"
          variant={!useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(false)}
          disabled={disabled}
          className="gap-1"
        >
          <Upload className="w-3 h-3" />
          Upload
        </Button>
      </div>

      {useUrl ? (
        <div>
          <Input
            placeholder={placeholder}
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={disabled}
          />
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
      ) : (
        <div>
          {currentUrl && !isUploading ? (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground flex-1 truncate">{currentUrl.split('/').pop()}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onUrlChange('')}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : null}

          <div
            className={`mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para enviar arquivo</p>
                <p className="text-xs text-muted-foreground">Máximo: 50MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileUpload}
            disabled={disabled || isUploading}
          />
        </div>
      )}
    </div>
  );
};
