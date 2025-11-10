import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import LogoForm from "@/components/LogoForm";
import ProgressBar from "@/components/ProgressBar";
import Gallery from "@/components/Gallery";
import { generateLogo, getJobResult, type LogoVariant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ViewState = "form" | "generating" | "results";

interface LogoFormData {
  description: string;
  style?: string;
  colors?: string[];
  files?: File[];
}

const Index = (): JSX.Element => {
  const [view, setView] = useState<ViewState>("form");
  const [logos, setLogos] = useState<LogoVariant[]>([]);
  const { toast } = useToast();
  const isCancelled = useRef(false);

  useEffect(() => {
    return () => {
      // When component unmounts, cancel any ongoing polling
      isCancelled.current = true;
    };
  }, []);

  const handleSubmit = async (formData: LogoFormData): Promise<void> => {
    try {
      setView("generating");

      // Trigger backend to start logo generation
      const { job_id } = await generateLogo(formData);

      let attempts = 0;
      const maxAttempts = 40; // ~2 minutes
      const pollInterval = 3000; // 3s between polls

      const pollForResult = async (): Promise<void> => {
        if (isCancelled.current) return; // stop if unmounted

        attempts++;
        try {
          const result = await getJobResult(job_id);

          if (result.status === "completed" && result.variants) {
            setLogos(result.variants);
            setView("results");
            return;
          }

          if (result.status === "failed") {
            throw new Error(result.error || "Logo generation failed");
          }

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            return pollForResult();
          }

          throw new Error("Logo generation timed out. Please try again.");
        } catch (error) {
          console.warn("Polling error:", error);
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            return pollForResult();
          } else {
            throw error;
          }
        }
      };

      await pollForResult();
    } catch (error) {
      console.error("Error during logo generation:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Unexpected error while generating your logo. Please try again.",
        variant: "destructive",
      });
      setView("form");
    }
  };

  const handleRegenerate = (): void => {
    setLogos([]);
    setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProgressComplete = (): void => {
    setView("results");
  };

  return (
    <Layout>
      {view === "form" && (
        <>
          <Hero />
          <LogoForm onSubmit={handleSubmit} />
        </>
      )}

      {view === "generating" && (
        <ProgressBar onComplete={handleProgressComplete} />
      )}

      {view === "results" && (
        <Gallery variants={logos} onRegenerate={handleRegenerate} />
      )}
    </Layout>
  );
};

export default Index;
