import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CanvasEditor } from "@/components/CanvasEditor";
import { PromptInput } from "@/components/PromptInput";
import { ResultDisplay } from "@/components/ResultDisplay";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string>("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setResultImage(null); // Clear previous results
  };

  const handleMaskGenerated = (dataUrl: string) => {
    setMaskDataUrl(dataUrl);
  };

  const handleGenerate = async (prompt: string) => {
    if (!uploadedImage || !maskDataUrl) {
      toast.error("Please upload an image and create a mask first");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create FormData for the API request
      const formData = new FormData();
      formData.append('image', uploadedImage);
      
      // Convert mask data URL to blob
      const maskResponse = await fetch(maskDataUrl);
      const maskBlob = await maskResponse.blob();
      formData.append('mask', maskBlob, 'mask.png');
      formData.append('prompt', prompt);
      formData.append('output_format', 'webp');

      // TODO: Replace with your actual API endpoint
      // This would typically call your backend which then calls Stability AI
      const response = await fetch('/api/inpaint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setResultImage(resultUrl);
      toast.success("Image generated successfully!");
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate image. Please try again.");
      
      // For demo purposes, we'll simulate a successful result
      // Remove this in production
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a gradient as demo result
          const gradient = ctx.createLinearGradient(0, 0, 512, 512);
          gradient.addColorStop(0, '#8B5CF6');
          gradient.addColorStop(1, '#3B82F6');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 512, 512);
          
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Demo Result', 256, 256);
          
          setResultImage(canvas.toDataURL());
          toast.success("Demo result generated!");
        }
      }, 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setMaskDataUrl("");
    setResultImage(null);
    toast.success("Canvas reset successfully!");
  };

  const canGenerate = uploadedImage && maskDataUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Image Inpainting</h1>
              <p className="text-sm text-muted-foreground">
                Upload, mask, and transform your images with AI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <ImageUpload 
              onImageUpload={handleImageUpload}
              isUploaded={!!uploadedImage}
            />
            
            <CanvasEditor
              uploadedImage={uploadedImage}
              onMaskGenerated={handleMaskGenerated}
            />
          </div>

          {/* Right Column - Controls & Results */}
          <div className="space-y-6">
            <PromptInput
              onGenerate={handleGenerate}
              onReset={handleReset}
              isGenerating={isGenerating}
              canGenerate={!!canGenerate}
            />
            
            <ResultDisplay
              resultImage={resultImage}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
