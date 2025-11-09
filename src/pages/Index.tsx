import { useState } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import LogoForm from "@/components/LogoForm";
import ProgressBar from "@/components/ProgressBar";
import Gallery from "@/components/Gallery";
import { generateLogo, getJobResult, type LogoVariant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ViewState = "form" | "generating" | "results";

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [logoVariants, setLogoVariants] = useState<LogoVariant[]>([]);
  const { toast } = useToast();

  const handleFormSubmit = async (formData: any) => {
    try {
      setViewState("generating");

      // Call the API to generate logos
      const response = await generateLogo(formData);
      console.log('Job created:', response.job_id);
      
      // Poll for results every 2 seconds
      const pollInterval = 2000;
      const maxAttempts = 30; // 60 seconds max
      let attempts = 0;

      const pollForResult = async (): Promise<void> => {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts}`);

        const result = await getJobResult(response.job_id);
        
        if (result.status === "completed" && result.variants) {
          setLogoVariants(result.variants);
          return;
        }

        if (result.status === "failed") {
          throw new Error(result.error || "Generation failed");
        }

        // Continue polling if not complete and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollForResult();
        } else {
          throw new Error("Generation timeout - please try again");
        }
      };

      await pollForResult();
    } catch (error) {
      console.error("Error generating logos:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating your logos. Please try again.",
        variant: "destructive",
      });
      setViewState("form");
    }
  };

  const handleProgressComplete = () => {
    setViewState("results");
  };

  const handleRegenerate = () => {
    setViewState("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      {viewState === "form" && (
        <>
          <Hero />
          <LogoForm onSubmit={handleFormSubmit} />
        </>
      )}

      {viewState === "generating" && (
        <ProgressBar onComplete={handleProgressComplete} />
      )}

      {viewState === "results" && (
        <Gallery variants={logoVariants} onRegenerate={handleRegenerate} />
      )}
    </Layout>
  );
};

export default Index;
