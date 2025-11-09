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
      console.log(
        "User clicked Generate. Sending request to backend with payload:",
        formData
      );

      // Transition UI to generating state
      setViewState("generating");

      // Trigger logo generation API (→ /api/generate → n8n webhook)
      const response = await generateLogo(formData);
      console.log("Job created:", response.job_id);

      // Begin polling for result
      const pollInterval = 3000; // every 3s
      const maxAttempts = 40; // total ~2 minutes
      let attempts = 0;

      const pollForResult = async (): Promise<void> => {
        attempts++;
        console.log(
          `Polling attempt ${attempts}/${maxAttempts} for job: ${response.job_id}`
        );

        const result = await getJobResult(response.job_id);
        console.log("Result response:", result);

        if (result.status === "completed" && result.variants) {
          console.log("Logo generation complete. Variants:", result.variants);
          setLogoVariants(result.variants);
          setViewState("results");
          return;
        }

        if (result.status === "failed") {
          throw new Error(result.error || "Logo generation failed");
        }

        // Retry polling until complete or timed out
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return pollForResult();
        } else {
          throw new Error("Logo generation timed out. Please try again.");
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
            : "There was an unexpected error while generating your logo. Please try again.",
        variant: "destructive",
      });
      setViewState("form");
    }
  };

  const handleProgressComplete = () => {
    setViewState("results");
  };

  const handleRegenerate = () => {
    setLogoVariants([]);
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
