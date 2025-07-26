import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Brush, Eraser, Undo, Redo, RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";

interface CanvasEditorProps {
  uploadedImage: File | null;
  onMaskGenerated: (maskDataUrl: string) => void;
}

export const CanvasEditor = ({ uploadedImage, onMaskGenerated }: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState([20]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentMaskDataUrl, setCurrentMaskDataUrl] = useState<string | null>(null);

  // Load image onto canvas
  useEffect(() => {
    if (!uploadedImage || !canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.onload = () => {
      console.log('Image loaded successfully:', { width: img.width, height: img.height });
      
      // Set canvas dimensions to image dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      console.log('Canvas dimensions set to:', { width, height });

      canvas.width = width;
      canvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;

      // Draw image on main canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Clear mask canvas (transparent)
      maskCtx.clearRect(0, 0, width, height);
      
      setImageLoaded(true);
      saveToHistory();
      toast.success("Image loaded! Start painting areas to modify.");
    };

    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      toast.error("Failed to load image. Please try again.");
    };

    img.src = URL.createObjectURL(uploadedImage);
    
    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [uploadedImage]);

  // Save current mask state to history
  const saveToHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;
    
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;

    const imageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      return newHistory.slice(-20); // Keep last 20 states
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex <= 0 || !maskCanvasRef.current) return;
    
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;

    const prevIndex = historyIndex - 1;
    maskCtx.putImageData(history[prevIndex], 0, 0);
    setHistoryIndex(prevIndex);
    generateMask();
  }, [historyIndex, history]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !maskCanvasRef.current) return;
    
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;

    const nextIndex = historyIndex + 1;
    maskCtx.putImageData(history[nextIndex], 0, 0);
    setHistoryIndex(nextIndex);
    generateMask();
  }, [historyIndex, history]);

  // Clear mask
  const clearMask = useCallback(() => {
    if (!maskCanvasRef.current) return;
    
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    saveToHistory();
    generateMask();
    toast.success("Canvas cleared!");
  }, [saveToHistory]);

  // Generate binary mask
  const generateMask = useCallback(() => {
    if (!maskCanvasRef.current) return;
    
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Create a new canvas for the binary mask
    const binaryCanvas = document.createElement('canvas');
    binaryCanvas.width = maskCanvas.width;
    binaryCanvas.height = maskCanvas.height;
    const binaryCtx = binaryCanvas.getContext('2d');
    if (!binaryCtx) return;

    // Fill with black background
    binaryCtx.fillStyle = '#000000';
    binaryCtx.fillRect(0, 0, binaryCanvas.width, binaryCanvas.height);

    // Get mask data and convert to binary
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const binaryImageData = binaryCtx.createImageData(maskCanvas.width, maskCanvas.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];
      const isOpaque = alpha > 0;
      
      // White for painted areas, black for unpainted
      const color = isOpaque ? 255 : 0;
      binaryImageData.data[i] = color;     // R
      binaryImageData.data[i + 1] = color; // G
      binaryImageData.data[i + 2] = color; // B
      binaryImageData.data[i + 3] = 255;   // A
    }
    
    binaryCtx.putImageData(binaryImageData, 0, 0);
    const maskDataUrl = binaryCanvas.toDataURL();
    setCurrentMaskDataUrl(maskDataUrl);
    onMaskGenerated(maskDataUrl);
  }, [onMaskGenerated]);

  // Mouse event handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    
    setIsDrawing(true);
    draw(e);
  }, [imageLoaded]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(162, 83, 255, 0.5)'; // Semi-transparent primary color
    ctx.strokeStyle = 'rgba(162, 83, 255, 0.5)';
    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, brushSize[0] / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isDrawing, tool, brushSize]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
    saveToHistory();
    generateMask();
  }, [isDrawing, saveToHistory, generateMask]);

  // Download mask function
  const downloadMask = useCallback(() => {
    if (!currentMaskDataUrl) {
      toast.error("No mask to download. Please paint on the image first.");
      return;
    }
    
    const link = document.createElement('a');
    link.download = 'mask.png';
    link.href = currentMaskDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Mask downloaded successfully!");
  }, [currentMaskDataUrl]);

  if (!uploadedImage) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Upload an image to start editing</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tools Panel */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="tool"
              size="sm"
              data-active={tool === 'brush'}
              onClick={() => setTool('brush')}
            >
              <Brush className="w-4 h-4" />
              Brush
            </Button>
            <Button
              variant="tool"
              size="sm"
              data-active={tool === 'eraser'}
              onClick={() => setTool('eraser')}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-32">
              <span className="text-sm text-muted-foreground">Size:</span>
              <Slider
                value={brushSize}
                onValueChange={setBrushSize}
                max={50}
                min={5}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">{brushSize[0]}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMask}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadMask}
                disabled={!currentMaskDataUrl}
                title="Download Mask"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Canvas Container */}
      <Card className="p-4">
        <div className="relative bg-canvas-bg rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
          {!imageLoaded && uploadedImage && (
            <div className="text-center text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading image...
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ 
              display: imageLoaded ? 'block' : 'none',
              cursor: tool === 'brush' ? 'crosshair' : 'grab' 
            }}
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ 
              cursor: tool === 'brush' ? 'crosshair' : 'grab',
              pointerEvents: imageLoaded ? 'auto' : 'none',
              display: imageLoaded ? 'block' : 'none'
            }}
          />
        </div>
      </Card>
    </div>
  );
};