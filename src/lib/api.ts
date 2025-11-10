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
  status: "queued" | "failed";
  message?: string;
}

export interface JobResultResponse {
  status: "queued" | "processing" | "completed" | "failed" | "not_found";
  variants?: LogoVariant[];
  error?: string;
}

export const generateLogo = async (
  payload: GenerateLogoPayload
): Promise<GenerateLogoResponse> => {
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
  try {
    const res = await fetch(`/api/results/${jobId}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn("⚠️ Fetch failed:", e);
  }
  return { status: "queued" };
};
