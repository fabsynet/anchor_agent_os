'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { COVER_PHOTO_MAX_SIZE, COVER_PHOTO_ALLOWED_TYPES } from '@anchor/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface CoverPhotoUploadProps {
  currentPhotoPath: string | null;
  onUpload: (newPath: string | null) => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function CoverPhotoUpload({
  currentPhotoPath,
  onUpload,
}: CoverPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoUrl = currentPhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/badge-assets/${currentPhotoPath}`
    : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Validate type
    if (!COVER_PHOTO_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > COVER_PHOTO_MAX_SIZE) {
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.upload<{ coverPhotoPath: string }>(
        '/api/badge/profile/cover-photo',
        formData
      );

      onUpload(result.coverPhotoPath);
      toast.success('Cover photo uploaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload cover photo';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await api.patch('/api/badge/profile', { coverPhotoPath: null });
      onUpload(null);
      toast.success('Cover photo removed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove cover photo';
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview area */}
      <div className="relative w-full overflow-hidden rounded-lg border" style={{ aspectRatio: '3 / 1' }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Cover photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ImageIcon className="size-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Upload overlay on hover when not uploading */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isRemoving}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {currentPhotoPath ? 'Change' : 'Upload Cover Photo'}
        </Button>

        {currentPhotoPath && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading || isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            Remove
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
