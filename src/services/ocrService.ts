const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ocrService = {
  async extractTextFromImage(base64Image: string): Promise<string> {
    const visionApiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    const geminiModel = import.meta.env.VITE_GOOGLE_GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

    // Detect mime type from data URI prefix
    const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const normalizedBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const runVisionOcr = async () => {
      const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;
      const requestBody = {
        requests: [
          {
            image: { content: normalizedBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Google Vision API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.responses?.[0]?.textAnnotations?.[0]?.description || '';
    };

    const runGeminiOcr = async (): Promise<string> => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 20000; // 20s — gives the per-minute quota time to reset

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: 'Extract all readable text from this legal document image. Return plain text only and preserve line breaks.' },
                { inline_data: { mime_type: mimeType, data: normalizedBase64 } },
              ],
            }],
          }),
        });

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          throw new Error('Rate limit reached after 3 attempts. Please wait ~1 minute and try again.');
        }

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const apiMsg = errBody?.error?.message ?? `status ${response.status}`;
          throw new Error(`Gemini API error: ${apiMsg}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('\n') ?? '';
        return text.trim();
      }
      return '';
    };

    let lastProviderError: string | null = null;

    if (geminiApiKey) {
      try {
        const geminiText = await runGeminiOcr();
        if (geminiText) return geminiText;
        lastProviderError = 'Gemini OCR did not return extractable text';
      } catch (err) {
        // Fallback to Vision OCR if Gemini is unavailable or fails.
        lastProviderError = err instanceof Error ? err.message : 'Gemini OCR request failed.';
      }
    }

    if (visionApiKey) {
      try {
        const visionText = await runVisionOcr();
        if (visionText) return visionText;
        if (!lastProviderError) {
          lastProviderError = 'Vision OCR did not return extractable text';
        }
      } catch {
        // Both providers failed.
        if (!lastProviderError) {
          lastProviderError = 'Vision OCR request failed. Check VITE_GOOGLE_VISION_API_KEY permissions.';
        }
      }
    }

    if (lastProviderError) {
      throw new Error(lastProviderError);
    }

    throw new Error('No OCR key configured. Add VITE_GOOGLE_VISION_API_KEY or VITE_GOOGLE_GEMINI_API_KEY in .env');
  },

  parseTextToCaseData(text: string) {
    const dateRegex = /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g;
    const dates = text.match(dateRegex);
    const date = dates ? dates[0] : ""; 

    const caseNumRegex = /(CNR\s*[A-Z0-9]+|Case\s*No\.?\s*[0-9]+\/[0-9]+)/i;
    const caseNumMatch = text.match(caseNumRegex);
    const caseNumber = caseNumMatch ? caseNumMatch[0] : "";

    let title = "";
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(' vs ') || lines[i].toLowerCase().includes(' versus ')) {
            title = lines[i].trim();
            break;
        }
    }

    let formattedDate = "";
    if (date) {
        const parts = date.split(/[-/]/);
        if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    return {
      title,
      caseNumber,
      date: formattedDate
    };
  }
};
