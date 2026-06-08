const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 1280;
const WEBP_QUALITY = 0.75;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
    return 'Formato inválido. Usa JPG, PNG ou WebP.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" excede 8 MB. Escolhe uma imagem mais pequena.`;
  }
  return null;
}

export async function compressToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve(blob);
        },
        'image/webp',
        WEBP_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error(`Não foi possível carregar "${file.name}".`));
    };

    img.src = blobUrl;
  });
}
