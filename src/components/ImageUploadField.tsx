'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  directory: string;
  accept?: string;
  maxSizeKB?: number;
  className?: string;
  note?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  directory,
  accept = "image/*",
  maxSizeKB = 2048,
  className = "",
  note=""
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxSizeKB}KB`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${directory}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('medicare')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('medicare')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not generate public URL for uploaded image');
      }

      onChange(publicUrlData.publicUrl);
      toast({
        title: "Upload successful",
        description: `${label} has been uploaded successfully`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    toast({
      title: "Image removed",
      description: `${label} has been removed`
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label>{label}</Label>
      <p className="text-xs text-gray-500 mb-1">
        {note}
      </p>
      {value ? (
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 border border-gray-300 rounded overflow-hidden">
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Current image uploaded</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click to upload {label.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              Max size: {maxSizeKB}KB
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isUploading ? 'Uploading...' : `Upload ${label}`}
        </Button>
      </div>
    </div>
  );
}
