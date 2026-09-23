/**
 * Utilitas pemrosesan citra dokumen Kartu Keluarga (KK).
 * Kartu Keluarga selalu berformat Lanskap (Mendatar).
 */

/**
 * Memeriksa orientasi file gambar.
 * Jika gambar berorientasi Tegak / Portrait (tinggi > lebar),
 * otomatis rotasi 90 derajat searah jarum jam sehingga menjadi Lanskap (lebar > tinggi).
 */
export async function ensureLandscapeOrientation(file: File): Promise<File> {
  // Hanya proses jika file adalah gambar (lewati jika PDF)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // Jika sudah berorientasi Lanskap (lebar >= tinggi), gunakan file asli
      if (width >= height) {
        resolve(file);
        return;
      }

      try {
        // Foto berorientasi Portrait/Tegak (tinggi > lebar):
        // Putar 90 derajat searah jarum jam ke format Lanskap KK
        const canvas = document.createElement('canvas');
        canvas.width = height;
        canvas.height = width;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pindahkan titik pusat kanvas dan putar 90 derajat
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Ganti nama dengan imbuhan agar terlacak
            const newName = file.name.replace(/\.[^/.]+$/, '') + '-landscape.jpg';
            const rotatedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(rotatedFile);
          },
          'image/jpeg',
          0.95
        );
      } catch (err) {
        console.warn('Gagal merotasi gambar ke lanskap, menggunakan berkas asli:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
