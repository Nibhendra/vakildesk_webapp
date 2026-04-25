export const ocrService = {
  async extractTextFromImage(base64Image: string): Promise<string> {
    const visionApiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    const geminiModel = import.meta.env.VITE_GOOGLE_GEMINI_MODEL ?? 'gemini-1.5-flash';

    const normalizedBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

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
        throw new Error('Failed to fetch from Google Vision API');
      }

      const data = await response.json();
      return data.responses?.[0]?.textAnnotations?.[0]?.description || '';
    };

    const runGeminiOcr = async () => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Extract all readable text from this legal document image. Return plain text only and preserve line breaks.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: normalizedBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Google Gemini API');
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('\n') ?? '';
      return text.trim();
    };

    if (geminiApiKey) {
      try {
        const geminiText = await runGeminiOcr();
        if (geminiText) return geminiText;
      } catch {
        // Fallback to Vision OCR if Gemini is unavailable or fails.
      }
    }

    if (visionApiKey) {
      try {
        const visionText = await runVisionOcr();
        if (visionText) return visionText;
      } catch {
        // Both providers failed.
      }
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
