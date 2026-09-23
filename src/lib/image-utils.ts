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

      const MAX_DIMENSION = 1920;
      const isPortrait = height > width;

      // Jika sudah lanskap dan ukurannya tidak terlalu besar (<1920px dan < 1MB), gunakan file asli
      if (!isPortrait && width <= MAX_DIMENSION && file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      try {
        // Tentukan dimensi target (lanskap)
        let targetWidth = isPortrait ? height : width;
        let targetHeight = isPortrait ? width : height;

        // Skala turun jika melebihi MAX_DIMENSION (1920px) agar ringan & hemat kuota AI
        if (targetWidth > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / targetWidth;
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (isPortrait) {
          // Pindahkan titik pusat kanvas dan putar 90 derajat searah jarum jam
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -targetHeight / 2, -targetWidth / 2, targetHeight, targetWidth);
        } else {
          // Gambar lanskap diskalakan langsung
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const newName = file.name.replace(/\.[^/.]+$/, '') + '-opt.jpg';
            const optimizedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        console.warn('Gagal mengoptimalkan gambar, menggunakan berkas asli:', err);
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
