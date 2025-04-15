'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Media {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  createdAt: Date;
  size: number;
}

export interface MediaGalleryProps {
  path?: string;
  onSelect: (media: Media) => void;
  maxItems?: number;
  selectedId?: string;
  allowedTypes?: string[];
  gridCols?: 2 | 3 | 4;
  className?: string;
}

export function MediaGallery({
  path = 'images',
  onSelect,
  maxItems = 50,
  selectedId,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  gridCols = 4,
  className,
}: MediaGalleryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Mock function to fetch media
  // In a real app, this would fetch from your API/backend
  const fetchMedia = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockMedia: Media[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `media-${i}`,
        name: `Sample Image ${i + 1}`,
        url: `https://source.unsplash.com/random/800x600?sig=${i}`,
        thumbnailUrl: `https://source.unsplash.com/random/400x300?sig=${i}`,
        type: 'image/jpeg',
        createdAt: new Date(Date.now() - i * 86400000),
        size: Math.floor(Math.random() * 1000000) + 100000,
      }));
      
      setMedia(mockMedia);
      setFilteredMedia(mockMedia);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [path]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const filtered = media.filter(item => 
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      setFilteredMedia(filtered);
    } else {
      setFilteredMedia(media);
    }
  }, [debouncedSearchTerm, media]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getGridClass = () => {
    switch (gridCols) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      default: return 'grid-cols-4';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={fetchMedia} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      <ScrollArea className="h-[500px] rounded-md border">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">No media found</p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-4 p-4`}>
            {filteredMedia.slice(0, maxItems).map((item) => (
              <Card 
                key={item.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-colors hover:bg-accent/50",
                  selectedId === item.id && "ring-2 ring-primary"
                )}
                onClick={() => onSelect(item)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={item.thumbnailUrl || item.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 