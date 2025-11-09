import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

interface LogoVariant {
  id: string;
  url: string;
  score: number;
  metadata: {
    model: string;
    prompt: string;
  };
}

interface GalleryProps {
  variants: LogoVariant[];
  onRegenerate: () => void;
}

const Gallery = ({ variants, onRegenerate }: GalleryProps) => {
  const handleDownload = (format: "png" | "svg", url: string) => {
    console.log(`Downloading ${format} from ${url}`);
  };

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-5xl font-display font-bold mb-4">
              Your results
            </h2>
            <p className="text-lg text-muted-foreground">
              {variants.length} variations generated
            </p>
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={onRegenerate}
            className="h-12 px-6"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate more
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="group"
            >
              <div className="aspect-square bg-muted border border-border overflow-hidden mb-4 relative">
                <img
                  src={variant.url}
                  alt={`Logo variant ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background"
                    onClick={() => handleDownload("png", variant.url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background"
                    onClick={() => handleDownload("svg", variant.url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    SVG
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variant {index + 1}</span>
                  <span className="text-sm text-muted-foreground">Score: {variant.score.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {variant.metadata.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
