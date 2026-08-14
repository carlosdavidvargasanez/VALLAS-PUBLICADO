/**
 * Client-side image compressor utility
 * Resizes and compresses image files into lightweight Base64 data URLs (~30-70KB)
 * to prevent browser localStorage QuotaExceededError while maintaining visual clarity.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.65
): Promise<{ dataUrl: string; sizeKb: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image as data URL'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback: return raw data if image loading fails
        const fallbackKb = (file.size / 1024).toFixed(1) + ' KB';
        resolve({ dataUrl: result, sizeKb: fallbackKb, name: file.name });
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Calculate scaling
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const fallbackKb = (file.size / 1024).toFixed(1) + ' KB';
            resolve({ dataUrl: result, sizeKb: fallbackKb, name: file.name });
            return;
          }

          // Fill white background (useful for transparent PNGs converted to JPEG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const approxKb = (Math.round((compressedDataUrl.length * 3) / 4) / 1024).toFixed(1) + ' KB';

          resolve({
            dataUrl: compressedDataUrl,
            sizeKb: approxKb,
            name: file.name
          });
        } catch {
          // Fallback to original read result
          const fallbackKb = (file.size / 1024).toFixed(1) + ' KB';
          resolve({ dataUrl: result, sizeKb: fallbackKb, name: file.name });
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
