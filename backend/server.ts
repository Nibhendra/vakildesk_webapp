import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const v0BaseUrl = process.env.V0_BASE_URL ?? 'https://api.v0.dev/v1';
const v0Model = process.env.V0_MODEL ?? 'v0-1.5-md';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    backend: 'ready',
    mcp: {
      command: 'npm run dev:mcp',
      transport: 'stdio',
    },
    v0: {
      configured: Boolean(process.env.V0_API_KEY),
      baseUrl: v0BaseUrl,
      model: v0Model,
    },
  });
});

app.post('/api/v0/generate', async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body.' });
    }

    if (!process.env.V0_API_KEY) {
      return res.status(400).json({
        error: 'V0_API_KEY is not configured. Add it to your .env file before calling v0.',
      });
    }

    const response = await fetch(`${v0BaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.V0_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: v0Model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message ?? 'v0 request failed',
        raw: data,
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    return res.json({
      ok: true,
      model: data?.model ?? v0Model,
      created: data?.created ?? null,
      content,
      raw: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`[vakildesk-backend] listening on http://localhost:${port}`);
});
