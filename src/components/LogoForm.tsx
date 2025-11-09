import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const styles = ["Minimal", "Luxury", "Futuristic", "Retro", "Playful"];

interface LogoFormProps {
  onSubmit: (data: any) => void;
}

const LogoForm = ({ onSubmit }: LogoFormProps) => {
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your logo or brand",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      description,
      style,
      files,
    });
  };

  return (
    <div id="logo-form" className="min-h-screen flex items-center justify-center px-6 py-20 bg-muted/30">
      <div className="w-full max-w-4xl">
        <div className="mb-12">
          <h2 className="text-5xl font-display font-bold mb-4">
            Create your logo
          </h2>
          <p className="text-lg text-muted-foreground">
            Provide details about your brand and vision
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border p-10 space-y-8">
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">
              Brand description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your brand, industry, target audience, and any specific visual elements you'd like to see..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 resize-none border-border focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="style" className="text-base font-medium">
                Style preference
              </Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="h-12 border-border">
                  <SelectValue placeholder="Choose a style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s} value={s.toLowerCase()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="files" className="text-base font-medium">
                Reference images <span className="text-muted-foreground text-sm">(optional)</span>
              </Label>
              <div className="relative">
                <input
                  type="file"
                  id="files"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 justify-start border-border"
                  onClick={() => document.getElementById("files")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {files.length > 0 ? `${files.length} file(s) selected` : "Upload files"}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base bg-primary hover:bg-primary/90"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Generate logo
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LogoForm;
