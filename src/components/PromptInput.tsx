import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Wand2 } from "lucide-react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  onReset: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

const examplePrompts = [
  "a beautiful sunset over mountains",
  "a cute cat wearing sunglasses",
  "a futuristic city with flying cars",
  "a magical forest with glowing mushrooms",
  "a vintage car on a country road"
];

export const PromptInput = ({ onGenerate, onReset, isGenerating, canGenerate }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (prompt.trim() && canGenerate) {
      onGenerate(prompt.trim());
    }
  };

  const useExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Prompt</h3>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Describe what you want to generate in the masked area... (e.g., 'a beautiful butterfly with colorful wings')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-20 resize-none"
          maxLength={500}
        />
        
        <div className="text-right text-xs text-muted-foreground">
          {prompt.length}/500 characters
        </div>
      </div>

      {/* Example Prompts */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Quick examples:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => useExamplePrompt(example)}
              className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ai"
          onClick={handleGenerate}
          disabled={!prompt.trim() || !canGenerate || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isGenerating}
        >
          Reset
        </Button>
      </div>

      {!canGenerate && (
        <p className="text-sm text-muted-foreground text-center">
          Upload an image and paint some areas to enable generation
        </p>
      )}
    </Card>
  );
};