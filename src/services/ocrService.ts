const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ocrService = {
  async extractTextFromImage(base64Image: string): Promise<string> {
    const visionApiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    const geminiModel = import.meta.env.VITE_GOOGLE_GEMINI_MODEL ?? 'gemini-2.5-flash';

    // Safely extract mime type and strip base64 prefix
    const prefixRegex = /^data:(.*?);base64,/;
    const mimeMatch = base64Image.match(prefixRegex);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const normalizedBase64 = base64Image.replace(prefixRegex, '');

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
          throw new Error('AI Engine rate limit reached. Please wait ~1 minute and try again.');
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
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // --- 1. FULL COURT NAME: Extract complete string after "BEFORE THE" ---
    let court = 'District Court';
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      if (/BEFORE THE/i.test(lines[i])) {
        const extracted = lines[i].replace(/^.*?BEFORE THE\s+/i, '').trim();
        if (extracted.length > 2) {
          // Title-case the extracted full court name
          court = extracted
            .toLowerCase()
            .replace(/\b(\w)/g, c => c.toUpperCase())
            .replace(/\bPb\b/g, '(PB)') // Fix acronym parenthetical
            .replace(/\(Pb\)/g, '(PB)');
          break;
        }
      }
    }
    // Fallback: if "BEFORE THE" not found, use keyword mapping
    if (court === 'District Court') {
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const u = lines[i].toUpperCase();
        if (u.includes('SUPREME COURT')) { court = 'Supreme Court'; break; }
        if (u.includes('HIGH COURT')) { court = 'High Court'; break; }
        if (u.includes('TRIBUNAL') || u.includes('AFT') || u.includes('CAT') || u.includes('ARMED FORCES')) { court = 'Tribunal'; break; }
      }
    }

    // --- 2. CASE NUMBER: Look in first 15 lines ---
    let caseNumber = '';
    const caseNumPatterns = [
      /(original application no\.?\s*[\w\/\-]*)/i,
      /(OA\s*No\.?\s*[\w\/\-]+)/i,
      /(WP\s*(?:Civil|Criminal)?\s*No\.?\s*[\w\/\-]+)/i,
      /(CRL\.?\s*(?:Appeal|Petition|Misc)\.?\s*No\.?\s*[\w\/\-]+)/i,
      /(CNR\s*[A-Z0-9]+)/i,
      /(SLP\s*(?:Civil|Criminal)?\s*No\.?\s*[\w\/\-]+)/i,
      /(Civil\s*(?:Appeal|Suit|Misc)\.?\s*No\.?\s*[\w\/\-]+)/i,
      /(Criminal\s*(?:Appeal|Case|Misc)\.?\s*No\.?\s*[\w\/\-]+)/i,
    ];
    for (const line of lines.slice(0, 15)) {
      for (const pat of caseNumPatterns) {
        const m = line.match(pat);
        if (m) { caseNumber = m[0].trim(); break; }
      }
      if (caseNumber) break;
    }

    // --- 3. TITLE + CLIENT NAME: Construct from "IN THE MATTER OF" section only ---
    let title = '';
    let clientName = '';
    const inMatterIdx = lines.findIndex(l => /in the matter of/i.test(l));
    const indexIdx = lines.findIndex(l => /^\s*INDEX\s*$/i.test(l));

    if (inMatterIdx !== -1) {
      const endIdx = indexIdx !== -1 ? indexIdx : Math.min(inMatterIdx + 15, lines.length);
      const matterLines = lines.slice(inMatterIdx + 1, endIdx);

      let applicant = '';
      let respondent = '';

      // Strategy A: "VS." or "VERSUS" is a standalone line
      for (let i = 0; i < matterLines.length; i++) {
        if (/^VS\.?$|^VERSUS$/i.test(matterLines[i])) {
          // Applicant = everything accumulated above (strip APPLICANT label)
          applicant = matterLines
            .slice(0, i)
            .join(' ')
            .replace(/[\s\.]*APPLICANT[\s\.]*$/i, '')
            .trim();
          // Respondent = everything below (strip RESPONDENT label)
          respondent = matterLines
            .slice(i + 1)
            .join(' ')
            .replace(/[\s\.]*RESPONDENTS?[\s\.]*$/i, '')
            .trim();
          break;
        }
      }

      // Strategy B: "vs" appears inline within a single line
      if (!applicant) {
        for (const line of matterLines) {
          if (/ vs\.? | versus /i.test(line)) {
            const parts = line.split(/ vs\.? | versus /i);
            applicant = parts[0].replace(/[\s\.]*APPLICANT[\s\.]*$/i, '').trim();
            respondent = parts.slice(1).join(' vs ').replace(/[\s\.]*RESPONDENTS?[\s\.]*$/i, '').trim();
            break;
          }
        }
      }

      if (applicant && respondent) {
        title = `${applicant} vs ${respondent}`;
      } else if (applicant) {
        title = applicant;
      }

      // Client Name: Safely strip service number, rank, and status suffixes from applicant
      if (applicant) {
        const stripped = applicant
          .replace(/^No\.?\s*[\dA-Z\-_\/]+\s*[-_]?\s*/i, '') // service number prefix
          .replace(/^[A-Z]_/i, '')                             // F_ or similar prefix
          .replace(/\b(Nk|DSC|Sgt|Hav|Col|Maj|Brig|Lt|Gen|Cpl|Flt|Wg|Air|Sqn|Sub|Sep|Rfn|Gnr|Dvr|Sig|L\/Nk|L\/Hav|Capt|Cmde|Adm|Cd|Cfn|Pte|Lcpl|Wo|Jco|Nb)\b\.?\s*/gi, '')
          .replace(/\s*[\(（]Retd[\)）]\.?/gi, '')
          .replace(/\s*\.\.\.\s*$/, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Only commit if result looks like a real name (contains letters, not too short)
        if (stripped.length > 3 && /[a-zA-Z]{2,}/.test(stripped)) {
          clientName = stripped;
        }
        // Leave blank if not confident — do not hallucinate
      }
    }

    // Fallback title: scan all lines, explicitly skip Annexure table rows
    if (!title) {
      for (const line of lines) {
        if (
          / vs\.? | versus /i.test(line) &&
          !/annexure|copy of|judgment in|^\d+\./i.test(line)
        ) {
          title = line.trim();
          break;
        }
      }
    }

    // --- 4. DATE: First valid date ---
    let formattedDate = '';
    const dateRegex = /\b(\d{2})[-\/](\d{2})[-\/](\d{4})\b/;
    for (const line of lines) {
      const m = line.match(dateRegex);
      if (m) {
        formattedDate = `${m[3]}-${m[2]}-${m[1]}`;
        break;
      }
    }

    return { title, caseNumber, date: formattedDate, court, clientName };
  },

  async summarizeLegalDocument(base64Image: string): Promise<string> {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    const geminiModel = import.meta.env.VITE_GOOGLE_GEMINI_MODEL ?? 'gemini-2.5-flash';
    
    if (!geminiApiKey) {
      throw new Error('Gemini API Key is required for Document Summarization. Please add VITE_GOOGLE_GEMINI_API_KEY to .env');
    }

    // Safely extract mime type and strip base64 prefix
    const prefixRegex = /^data:(.*?);base64,/;
    const mimeMatch = base64Image.match(prefixRegex);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const normalizedBase64 = base64Image.replace(prefixRegex, '');

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
              { text: 'Analyze this legal document. Provide a structured summary containing: 1. Main Case Title/Parties, 2. Key Facts, 3. Legal Sections Mentioned, and 4. What the document is (e.g., FIR, Order, Application). Use clear Markdown formatting with bullet points.' },
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
        throw new Error('AI Engine rate limit reached. Please wait ~1 minute and try again.');
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errBody?.error?.message ?? response.status}`);
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || 'No clear summary could be generated.';
    }
    return '';
  }
};
