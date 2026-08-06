// src/lib/image-compressor.ts

export interface CompressedResult {
  base64: string;
  blob: Blob;
  fileName: string;
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Outputs a WebP blob and base64 string optimized for size (<150KB) and speed.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<CompressedResult> {
  return new Promise((resolve, reject) => {
    // If browser doesn't support FileReader, resolve immediately
    if (typeof window === "undefined" || !window.FileReader) {
      reject(new Error("FileReader is not supported in this environment"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize proportional scale logic
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2d canvas context"));
          return;
        }

        // Draw image onto canvas with custom sizes
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas output to high-efficiency webp format (fallback to jpeg if unsupported)
        try {
          const webpDataUrl = canvas.toDataURL("image/webp", quality);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Return result
                resolve({
                  base64: webpDataUrl,
                  blob,
                  fileName: file.name.replace(/\.[^/.]+$/, "") + ".webp",
                });
              } else {
                reject(new Error("Failed to convert canvas to blob"));
              }
            },
            "image/webp",
            quality
          );
        } catch (err) {
          // Fallback to jpeg if WebP conversion throws an error
          const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  base64: jpegDataUrl,
                  blob,
                  fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                });
              } else {
                reject(new Error("Failed to convert canvas to blob (fallback)"));
              }
            },
            "image/jpeg",
            quality
          );
        }
      };

      img.onerror = (err) => {
        reject(new Error("Failed to load image element: " + err));
      };
    };

    reader.onerror = (err) => {
      reject(new Error("Failed to read file: " + err));
    };
  });
}
