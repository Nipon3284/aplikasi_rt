# 🏘️ SI-WARGA RT: Sistem Pengelolaan Data RT & AI OCR Scanner Kartu Keluarga

Aplikasi modern pengelolaan administrasi kependudukan Rukun Tetangga (RT) yang dilengkapi **AI OCR Scanner Kartu Keluarga (KK)** berbasis **Google Gemini AI**, manajemen data warga, cetak surat pengantar otomatis, rekap mutasi penduduk, impor/ekspor data Excel, dan sinkronisasi multi-device.

---

## 🌟 Fitur Utama

- 🤖 **AI OCR Scanner Kartu Keluarga (KK)**
  - Ekstraksi otomatis data Nomor KK, Kepala Keluarga, Alamat, serta seluruh Anggota Keluarga langsung dari foto scan/kamera.
  - Didukung model **Google Gemini AI** dengan sistem rotasi multi-model (`gemini-3.5-flash`, `gemini-3.5-flash-lite`) dan multi-API Key otomatis saat limit kuota.
  - Optimasi gambar otomatis (rotasi presisi ke lanskap & kompresi cerdas untuk hemat kuota dan cepat).
  - Workspace verifikasi interaktif berdampingan (*Side-by-side verification*): tinjau dan koreksi data sebelum disimpan.

- 👥 **Manajemen Data Warga & Kartu Keluarga**
  - Pencarian cepat warga berdasarkan Nama, NIK, No KK, atau Blok rumah.
  - Filter demografi (Kepala Keluarga, Balita, Lansia, Usia Produktif, Status Hunian).
  - Riwayat detail keluarga beserta status hubungan dan pekerjaan.

- 📊 **Impor & Ekspor Data Excel Terstruktur**
  - Download template Excel standar kependudukan RT.
  - Impor data massal dengan validasi cerdas, pratinjau data, dan deteksi duplikasi.
  - Ekspor seluruh data warga & KK ke format `.xlsx` dengan sekali klik.

- 📄 **Cetak Surat Pengantar RT Otomatis**
  - Generator surat pengantar resmi (KTP, SKCK, Domisili, dll.) siap cetak/PDF.
  - Pengisian otomatis berdasarkan data warga yang tersimpan di sistem.

- 📈 **Rekap Mutasi Penduduk**
  - Pencatatan warga datang, pindah, lahir, dan meninggal.
  - Statistik visual mutasi bulanan/tahunan untuk pelaporan ke RW/Kelurahan.

- 📱 **Akses Mobile & Scan Lewat Smartphone**
  - Hubungkan smartphone ke aplikasi laptop via QR Code di jaringan WiFi lokal yang sama.
  - Ambil foto KK langsung dari kamera smartphone dan otomatis masuk ke antrian scan laptop.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Komponen & Ikon**: [Lucide React](https://lucide.dev/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: SQLite (Lokal) / PostgreSQL (Cloud via Supabase/Neon)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
- **Manipulasi Data**: `xlsx`, `qrcode`

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 18 ke atas
- [Git](https://git-scm.com/)

### 2. Clone Repository
```bash
git clone https://github.com/Nipon3284/aplikasi_rt.git
cd aplikasi_rt
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin berkas template environment:
```bash
cp .env.example .env
```
Buka berkas `.env` dan sesuaikan nilainya:
```env
DATABASE_URL="file:./dev.db"

# Kunci rahasia & akun login admin
JWT_SECRET="ganti_dengan_random_secret_string_32_karakter"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password_admin_rahasia"

# Dapatkan gratis di https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSy..."
```

> **Tips Multi-Key Gemini API**: Anda dapat memasukkan beberapa API Key sekaligus dipisahkan tanda koma (misal: `GEMINI_API_KEY="key1,key2,key3"`). Sistem akan otomatis berpindah kunci jika salah satu kunci mencapai batas kuota harian/menit.

### 5. Inisialisasi Database
Jalankan migrasi database Prisma:
```bash
npx prisma db push
```

*(Opsional)* Jalankan seed data contoh untuk uji coba:
```bash
npm run seed
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan akses **[http://localhost:3000](http://localhost:3000)**.

---

## 📁 Struktur Direktori

```text
aplikasi_rt/
├── prisma/
│   └── schema.prisma         # Skema database (Warga, KartuKeluarga, Mutasi, ScanQueue)
├── public/
│   ├── uploads/              # Direktori upload berkas scan lokal (dikecualikan dari git)
│   └── logo.png              # Aset gambar & logo aplikasi
├── src/
│   ├── app/
│   │   ├── api/              # API Route Handlers (CRUD, OCR, Import/Export, Sync)
│   │   ├── import/           # Halaman manajemen impor/ekspor Excel
│   │   ├── kk/               # Halaman daftar dan detail Kartu Keluarga
│   │   ├── scan/             # Halaman antrian dan hasil OCR scan KK
│   │   ├── surat/            # Halaman generator surat pengantar RT
│   │   ├── warga/            # Halaman manajemen data seluruh warga
│   │   └── page.tsx          # Dashboard ringkasan RT & QR Code Mobile
│   ├── components/           # Komponen modular (Navbar, Verifier, CropModal)
│   └── lib/                  # Utilitas (gemini-ocr, excel-service, db, image-utils)
├── .env.example              # Template konfigurasi environment
├── .gitignore                # Proteksi file rahasia & database
└── package.json
```

---

## 🔒 Privasi & Keamanan Data
Aplikasi ini dirancang dengan memprioritaskan privasi data kependudukan:
- Kunci API dan kredensial sensitif dijaga di `.env` lokal dan tidak diunggah ke repository publik.
- Berkas scan fisik dan database tersimpan di perangkat lokal RT secara default.

---

## 📝 Lisensi
Proyek ini dikembangkan untuk mempermudah digitalisasi tata kelola rukun tetangga di Indonesia. Bebas digunakan dan dikembangkan untuk kepentingan kemasyarakatan.
