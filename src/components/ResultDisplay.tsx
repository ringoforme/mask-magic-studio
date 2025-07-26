import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ResultDisplayProps {
  resultImage: string | null;
  isGenerating: boolean;
}

export const ResultDisplay = ({ resultImage, isGenerating }: ResultDisplayProps) => {
  const downloadImage = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `inpainted-image-${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded successfully!");
  };

  if (isGenerating) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">AI is working its magic</h3>
            <p className="text-muted-foreground text-sm">
              Generating your inpainted image...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!resultImage) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="p-4 bg-muted/20 rounded-full">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Result will appear here</h3>
            <p className="text-muted-foreground text-sm">
              Upload an image, paint the areas to modify, and generate to see results
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Generated Result
        </h3>
        <Button onClick={downloadImage} variant="outline" size="sm">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
      
      <div className="bg-canvas-bg rounded-lg p-4">
        <img
          src={resultImage}
          alt="Generated result"
          className="w-full h-auto rounded-md shadow-lg"
        />
      </div>
    </Card>
  );
};