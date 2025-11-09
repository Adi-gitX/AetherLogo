import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById("logo-form");
    formSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-display font-bold tracking-tight leading-none">
                Logo design,
                <br />
                <span className="text-accent">simplified</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Professional AI-powered logo generation. 
                Describe your vision, get production-ready results.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base h-14 px-8 bg-primary hover:bg-primary/90"
                onClick={scrollToForm}
              >
                Start creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base h-14 px-8"
              >
                View examples
              </Button>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="grid grid-cols-2 gap-8">
            <div className="border-l-4 border-accent pl-6 space-y-2">
              <p className="text-5xl font-display font-bold">10,247</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Logos created</p>
            </div>
            <div className="border-l-4 border-primary pl-6 space-y-2">
              <p className="text-5xl font-display font-bold">4.9</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Avg rating</p>
            </div>
            <div className="border-l-4 border-primary pl-6 space-y-2">
              <p className="text-5xl font-display font-bold">2.3s</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Avg generation</p>
            </div>
            <div className="border-l-4 border-accent pl-6 space-y-2">
              <p className="text-5xl font-display font-bold">99%</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
