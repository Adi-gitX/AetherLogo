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
  metadata: { model: string; prompt: string };
}

export interface GenerateLogoResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface JobResultResponse {
  status: "queued" | "processing" | "completed" | "failed";
  variants?: LogoVariant[];
  error?: string;
}

export const generateLogo = async (
  payload: GenerateLogoPayload
): Promise<GenerateLogoResponse> => {
  console.log("Calling backend with payload:", payload);

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to trigger generation: ${text}`);
  }

  return response.json();
};

export const getJobResult = async (
  jobId: string
): Promise<JobResultResponse> => {
  const url = `/results/${jobId}.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { status: "queued" };
  return res.json();
};
