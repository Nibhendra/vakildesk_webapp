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

// ─── Prompt: no JSON mode — model reads image freely, we parse the output ──────
const EXTRACTION_PROMPT = `You are a precise Indian legal document data extraction agent.

Carefully read every part of the attached document image and extract ONLY the following fields.

STRICT RULES:
1. "court": Copy the FULL tribunal/court name from the VERY FIRST line of the document (after "BEFORE THE"). Do not summarize.
2. "caseNumber": The case/application number that appears directly below the court name. Return "" if blank.
3. "caseTitle": Look ONLY under "IN THE MATTER OF:". Combine Applicant and Respondent as "[Applicant] vs [Respondent]". STOP reading at the word "INDEX" or any table. Do NOT use any name from inside index table rows.
4. "clientName": Extract only the human name of the Applicant. Strip military ranks, service numbers like "No. 12345", titles, and suffixes like "(Retd)". Return only the readable personal name.
5. "advocateName": Find the advocate's name in the signature/footer block at the bottom of the page.

OUTPUT FORMAT: Return a single JSON object exactly like this (no markdown, no explanation):
{"caseTitle":"...","caseNumber":"...","clientName":"...","court":"...","advocateName":"..."}

If any field is not visible in the document, use "".`;

export const ocrService = {

  // ─── Main extraction: image → Gemini → JSON → form fields ─────────────────
  async extractCaseData(base64Image: string): Promise<ExtractedCaseData> {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY as string;
    const geminiModel = (import.meta.env.VITE_GOOGLE_GEMINI_MODEL as string) || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      throw new Error('Gemini API key missing. Add VITE_GOOGLE_GEMINI_API_KEY to your .env file.');
    }

    const prefixRegex = /^data:(.*?);base64,/;
    const mimeType = base64Image.match(prefixRegex)?.[1] ?? 'image/jpeg';
    const imageData = base64Image.replace(prefixRegex, '');

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 15000;

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
          // NOTE: No responseMimeType — JSON mode conflicts with multimodal image reading
          // We parse JSON from the free-text response instead
          generationConfig: {
            temperature: 0,
          },
        }),
      });

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

      // Filter out thinking parts (thought === true), keep only answer parts
      const parts: Array<{ text?: string; thought?: boolean }> =
        data?.candidates?.[0]?.content?.parts ?? [];
      const rawText = parts
        .filter(p => !p.thought)
        .map(p => p.text ?? '')
        .join('');

      // Try to find and parse a JSON object from the response text
      const parsed = this._extractJSON(rawText);
      if (parsed) {
        return {
          title:        this._str(parsed.caseTitle),
          caseNumber:   this._str(parsed.caseNumber),
          clientName:   this._str(parsed.clientName),
          court:        this._str(parsed.court),
          advocateName: this._str(parsed.advocateName),
          date: '',
        };
      }

      // If JSON extraction failed, return empty — don't crash
      console.warn('[OCR] Could not parse JSON from Gemini response. Raw:', rawText.substring(0, 300));
      return { title: '', caseNumber: '', clientName: '', court: '', advocateName: '', date: '' };
    }

    return { title: '', caseNumber: '', clientName: '', court: '', advocateName: '', date: '' };
  },

  // ─── Robust JSON extractor: handles fences, leading text, nested objects ───
  _extractJSON(text: string): Record<string, string> | null {
    if (!text) return null;

    // 1. Strip markdown fences
    let cleaned = text
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim();

    // 2. Try direct parse
    try { return JSON.parse(cleaned); } catch { /* fall through */ }

    // 3. Try to extract the first {...} block from the text (model may add preamble)
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }

    return null;
  },

  // ─── Safe string coercion: treats null/undefined/false as "" ─────────────
  _str(value: unknown): string {
    if (value === null || value === undefined || value === false) return '';
    return String(value).trim();
  },

  // ─── AI Summary (used by AIAnalysisModal) ─────────────────────────────────
  async summarizeLegalDocument(base64Image: string): Promise<string> {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY as string;
    const geminiModel = (import.meta.env.VITE_GOOGLE_GEMINI_MODEL as string) || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      throw new Error('Gemini API Key is required. Add VITE_GOOGLE_GEMINI_API_KEY to .env');
    }

    const prefixRegex = /^data:(.*?);base64,/;
    const mimeType = base64Image.match(prefixRegex)?.[1] ?? 'image/jpeg';
    const imageData = base64Image.replace(prefixRegex, '');

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 15000;

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
                text: 'Analyze this legal document image. Provide a structured summary with: 1. Case Title/Parties, 2. Key Facts, 3. Legal Sections Mentioned, 4. Document Type (FIR/Order/Application). Use Markdown with bullet points.',
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
      const parts: Array<{ text?: string; thought?: boolean }> =
        data?.candidates?.[0]?.content?.parts ?? [];
      return parts
        .filter(p => !p.thought)
        .map(p => p.text ?? '')
        .join('\n') || 'No summary could be generated.';
    }

    return 'No summary could be generated.';
  },
};
