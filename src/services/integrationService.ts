const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? '';

interface HealthResponse {
  ok: boolean;
  backend: string;
  mcp: {
    command: string;
    transport: string;
  };
  v0: {
    configured: boolean;
    baseUrl: string;
    model: string;
  };
}

interface V0GenerateResponse {
  ok: boolean;
  content: unknown;
  model: string;
  created: number | null;
  raw?: unknown;
  error?: string;
}

function buildUrl(path: string) {
  return `${BACKEND_BASE_URL}${path}`;
}

export const integrationService = {
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(buildUrl('/api/health'));
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    return response.json() as Promise<HealthResponse>;
  },

  async generateWithV0(prompt: string): Promise<V0GenerateResponse> {
    const response = await fetch(buildUrl('/api/v0/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = (await response.json()) as V0GenerateResponse;

    if (!response.ok) {
      throw new Error(data.error ?? `v0 request failed with status ${response.status}`);
    }

    return data;
  },
};
