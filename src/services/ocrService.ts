export const ocrService = {
  async extractTextFromImage(base64Image: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    if (!apiKey) throw new Error("Google Vision API Key not found");

    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
      requests: [
        {
          image: { content: base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "") },
          features: [{ type: "TEXT_DETECTION" }],
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch from Google Vision API");
    }

    const data = await response.json();
    return data.responses?.[0]?.textAnnotations?.[0]?.description || "";
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
