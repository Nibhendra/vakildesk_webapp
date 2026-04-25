export const compressDocumentForOCR = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If somehow a non-image gets here, fallback safety
    if (!file.type.startsWith('image/')) {
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve(fallbackReader.result as string);
      fallbackReader.onerror = reject;
      fallbackReader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX_DIMENSION = 2000;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Quality 0.92 — preserves small printed legal text clearly
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.92);
          resolve(compressedBase64);
        } else {
          // Fallback if canvas context fails
          resolve(event.target?.result as string);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Failed to read file target'));
      }
    };
    
    reader.onerror = () => reject(new Error('FileReader error during compression'));
    reader.readAsDataURL(file);
  });
};
