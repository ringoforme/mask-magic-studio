import { useCallback } from "react";
import { Upload, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  isUploaded: boolean;
}

export const ImageUpload = ({ onImageUpload, isUploaded }: ImageUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));
      
      if (imageFile) {
        if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error("File size must be less than 10MB");
          return;
        }
        onImageUpload(imageFile);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Please upload a valid image file (PNG, JPG, WEBP)");
      }
    },
    [onImageUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error("File size must be less than 10MB");
          return;
        }
        onImageUpload(file);
        toast.success("Image uploaded successfully!");
      }
    },
    [onImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  if (isUploaded) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>Image uploaded successfully</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-card to-muted/20"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Upload Your Image</h3>
          <p className="text-muted-foreground text-sm">
            Drag and drop your image here, or click to browse
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Supports PNG, JPG, WEBP • Max 10MB</span>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
            Choose File
          </div>
        </label>
      </div>
    </div>
  );
};