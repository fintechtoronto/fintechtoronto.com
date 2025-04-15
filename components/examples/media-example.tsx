'use client';

import { useState } from 'react';
import { MediaSelector } from '@/components/ui/media-selector';
import { MediaGallery } from '@/components/ui/media-gallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

export function MediaExample() {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [galleryMode, setGalleryMode] = useState(false);

  const handleMediaSelect = (url: string) => {
    setSelectedMedia(url);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Media Components Example</h1>
      
      <Tabs defaultValue="selector">
        <TabsList>
          <TabsTrigger value="selector">Media Selector</TabsTrigger>
          <TabsTrigger value="gallery">Gallery Only</TabsTrigger>
        </TabsList>
        
        <TabsContent value="selector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Selector Example</CardTitle>
              <CardDescription>
                Select media from your gallery or upload a new image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <Label htmlFor="featured-image">Featured Image</Label>
                  <MediaSelector 
                    onChange={(media) => handleMediaSelect(media?.url || '')}
                    className="min-h-[500px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Example</CardTitle>
              <CardDescription>
                Browse and select from your media library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaGallery 
                path="images" 
                onSelect={(media) => handleMediaSelect(media.url)}
                maxItems={12}
                gridCols={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedMedia && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
              <Image
                src={selectedMedia}
                alt="Selected media"
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground overflow-hidden text-ellipsis">
              {selectedMedia}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 