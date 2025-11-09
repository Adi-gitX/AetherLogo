import { supabase } from "@/integrations/supabase/client";

export interface GenerateLogoPayload {
  description: string;
  style?: string;
  colors?: string[];
  files?: File[];
}

export interface LogoVariant {
  id: string;
  url: string;
  score: number;
  metadata: {
    model: string;
    prompt: string;
  };
}

export interface GenerateLogoResponse {
  job_id: string;
  status: string;
}

export interface JobResultResponse {
  status: "queued" | "processing" | "completed" | "failed";
  variants?: LogoVariant[];
  error?: string;
}

export const generateLogo = async (
  payload: GenerateLogoPayload
): Promise<GenerateLogoResponse> => {
  console.log('Calling generate edge function with payload:', payload);
  
  const { data, error } = await supabase.functions.invoke('generate', {
    body: {
      description: payload.description,
      style: payload.style,
      colors: payload.colors,
      files: payload.files ? await Promise.all(
        payload.files.map(async (file) => {
          const reader = new FileReader();
          return new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ) : [],
    }
  });

  if (error) {
    console.error('Error calling generate function:', error);
    throw new Error(error.message);
  }

  console.log('Generate response:', data);
  return data as GenerateLogoResponse;
};

export const getJobResult = async (
  jobId: string
): Promise<JobResultResponse> => {
  console.log('Fetching result for job:', jobId);
  
  const { data, error } = await supabase.functions.invoke('result', {
    body: { job_id: jobId }
  });

  if (error) {
    console.error('Error fetching result:', error);
    throw new Error(error.message);
  }

  console.log('Result response:', data);
  return data as JobResultResponse;
};
