"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export function ImageUpload({ onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validImages = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (validImages.length === 0) {
        alert("Please upload valid image files (PNG, JPG, GIF, etc.)");
        return;
      }

      const remainingSlots = maxImages - images.length;
      const newImages = validImages.slice(0, remainingSlots);

      if (validImages.length > remainingSlots) {
        alert(`Maximum ${maxImages} images allowed. Only first ${remainingSlots} will be added.`);
      }

      // Create preview URLs
      const newPreviews = newImages.map((file) => URL.createObjectURL(file));

      const updatedImages = [...images, ...newImages];
      const updatedPreviews = [...previews, ...newPreviews];

      setImages(updatedImages);
      setPreviews(updatedPreviews);
      onImagesChange(updatedImages);
    },
    [images, previews, maxImages, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]); // Clean up memory
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setImages(updatedImages);
    setPreviews(updatedPreviews);
    onImagesChange(updatedImages);
  };

  const clearAll = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviews([]);
    onImagesChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={images.length >= maxImages}
        />

        <div className="text-center pointer-events-none">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">
            {images.length >= maxImages
              ? `Maximum ${maxImages} images reached`
              : "Drop images here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to 10MB • {images.length}/{maxImages} uploaded
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Uploaded Images ({previews.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group aspect-video rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="h-8 px-3"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <p className="text-xs text-white truncate">
                    {images[index].name}
                  </p>
                  <p className="text-xs text-white/60">
                    {(images[index].size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
