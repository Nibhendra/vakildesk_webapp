const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ExtractedCaseData {
  title: string;
  caseNumber: string;
  clientName: string;
  court: string;
  advocateName: string;
  date: string;
}

// ─── Prompt ────────────────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a precise legal document data extraction agent.

Analyze the attached image of a legal document and extract case metadata using these STRICT rules:

1. court: Extract the FULL court/tribunal name from the VERY FIRST line at the top (after "BEFORE THE"). Do not abbreviate.
2. caseNumber: Extract the exact case number immediately below the court name. Return "" if blank.
3. caseTitle: Look ONLY under the "IN THE MATTER OF:" heading. Combine Applicant and Respondent as "[Applicant] vs [Respondent]". STOP at the word "INDEX". NEVER use names from inside index table rows.
4. clientName: Extract just the human name of the Applicant. Strip all military ranks, service numbers, suffixes like (Retd). Return only the readable name.
5. advocateName: Find the advocate's name in the footer signature block at the bottom of the page.

Return a JSON object with EXACTLY these keys: caseTitle, caseNumber, clientName, court, advocateName.
If any value cannot be found, return "" for that key.
Return ONLY the raw JSON. No markdown. No explanation.`;

// ─── Main extraction: single Gemini Vision call → structured JSON ──────────────
export const ocrService = {

  async extractCaseData(base64Image: string): Promise<ExtractedCaseData> {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY as string;
    const geminiModel = (import.meta.env.VITE_GOOGLE_GEMINI_MODEL as string) || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      throw new Error('Gemini API key missing. Add VITE_GOOGLE_GEMINI_API_KEY to your .env file.');
    }

    // Strip data URI prefix and detect MIME type
    const prefixRegex = /^data:(.*?);base64,/;
    const mimeType = base64Image.match(prefixRegex)?.[1] ?? 'image/jpeg';
    const imageData = base64Image.replace(prefixRegex, '');

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 20000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: mimeType, data: imageData } },
            ],
          }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        }),
      });

      // Rate limit → wait and retry
      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw new Error('AI quota limit reached. Please wait ~1 minute and try again.');
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errBody?.error?.message ?? `HTTP ${response.status}`}`);
      }

      const data = await response.json();
      const rawText: string = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('') ?? '';

      // Defensively strip markdown fences if model adds them
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        return {
          title:         parsed.caseTitle     ?? '',
          caseNumber:    parsed.caseNumber    ?? '',
          clientName:    parsed.clientName    ?? '',
          court:         parsed.court         ?? '',
          advocateName:  parsed.advocateName  ?? '',
          date: '',
        };
      } catch {
        console.error('[OCR] JSON parse failed. Raw response:', rawText);
        // Don't crash — return empty so user can fill manually
        return { title: '', caseNumber: '', clientName: '', court: '', advocateName: '', date: '' };
      }
    }

    return { title: '', caseNumber: '', clientName: '', court: '', advocateName: '', date: '' };
  },

  // ─── AI Summary (used by AIAnalysisModal) ──────────────────────────────────
  async summarizeLegalDocument(base64Image: string): Promise<string> {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY as string;
    const geminiModel = (import.meta.env.VITE_GOOGLE_GEMINI_MODEL as string) || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      throw new Error('Gemini API Key is required. Add VITE_GOOGLE_GEMINI_API_KEY to .env');
    }

    const prefixRegex = /^data:(.*?);base64,/;
    const mimeType = base64Image.match(prefixRegex)?.[1] ?? 'image/jpeg';
    const imageData = base64Image.replace(prefixRegex, '');

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 20000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: 'Analyze this legal document. Provide a structured summary containing: 1. Main Case Title/Parties, 2. Key Facts, 3. Legal Sections Mentioned, and 4. What the document is (e.g., FIR, Order, Application). Use clear Markdown formatting with bullet points.',
              },
              { inline_data: { mime_type: mimeType, data: imageData } },
            ],
          }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; }
        throw new Error('AI Engine rate limit reached. Please wait ~1 minute and try again.');
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errBody?.error?.message ?? response.status}`);
      }

      const data = await response.json();
      return (
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? '')
          .join('\n') ?? 'No summary could be generated.'
      );
    }

    return 'No summary could be generated.';
  },
};
