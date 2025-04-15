'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaGallery, Media } from '@/components/ui/media-gallery';
import Image from 'next/image';
import { ImageIcon, UploadIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaSelectorProps {
  value?: Media | null;
  onChange: (media: Media | null) => void;
  className?: string;
}

export function MediaSelector({ value, onChange, className }: MediaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("gallery");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleMediaSelect = (media: Media) => {
    onChange(media);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with progress
      const file = files[0];
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              // Create a mock Media object with the uploaded file
              const mockMedia: Media = {
                id: `upload-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                type: file.type,
                createdAt: new Date(),
                size: file.size,
              };
              
              handleMediaSelect(mockMedia);
              setUploading(false);
              setUploadProgress(0);
            }, 500);
          }
          return newProgress;
        });
      }, 300);
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col gap-2">
          {value ? (
            <div className="relative">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video w-full">
                    <Image
                      src={value.url}
                      alt={value.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2 text-xs truncate">{value.name}</div>
                </CardContent>
              </Card>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full border bg-background"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex h-32 w-full flex-col items-center justify-center gap-1 border-dashed",
                  "hover:bg-accent/50"
                )}
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Select Media</span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, SVG, WebP
                </span>
              </Button>
            </DialogTrigger>
          )}
          {value && (
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                Change Image
              </Button>
            </DialogTrigger>
          )}
        </div>

        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>
              Select an image from the gallery or upload a new one
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="gallery" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="gallery" className="flex-1">Gallery</TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gallery" className="mt-0">
              <MediaGallery
                onSelect={handleMediaSelect}
                selectedId={value?.id}
                gridCols={3}
              />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0">
              <div className="flex flex-col items-center gap-4 p-4">
                <label
                  htmlFor="media-upload"
                  className={cn(
                    "flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed",
                    "hover:bg-accent/50 transition-colors",
                    uploading && "pointer-events-none opacity-50"
                  )}
                >
                  <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {uploading ? "Uploading..." : "Drag & drop or click to upload"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, SVG, WebP up to 2MB
                  </span>
                  <input
                    id="media-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                
                {uploading && (
                  <div className="w-full space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
} 