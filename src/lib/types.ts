export interface WargaData {
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  jenis_kelamin: 'LAKI-LAKI' | 'PEREMPUAN';
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  status_perkawinan: string;
  status_hubungan: string;
  kewarganegaraan: string;
  nama_ayah?: string;
  nama_ibu?: string;
  status_warga?: 'Aktif' | 'Meninggal' | 'Pindah';
  no_telp?: string;
  golongan_darah?: string;
}

export interface KKData {
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kode_pos?: string;
  no_rumah?: string;
  blok?: string;
  status_hunian: 'Tetap' | 'Kontrak' | 'Kos';
  tgl_dikeluarkan?: string;
  anggota: WargaData[];
}

export interface ExtractedKKResult {
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kode_pos?: string;
  tgl_dikeluarkan?: string;
  anggota: {
    nik: string;
    nama_lengkap: string;
    jenis_kelamin: 'LAKI-LAKI' | 'PEREMPUAN' | string;
    tempat_lahir: string;
    tanggal_lahir: string;
    agama: string;
    pendidikan: string;
    pekerjaan: string;
    status_perkawinan: string;
    status_hubungan: string;
    kewarganegaraan: string;
    nama_ayah?: string;
    nama_ibu?: string;
    golongan_darah?: string;
  }[];
  confidence_score: number;
  warnings?: string[];
  rotation_needed?: number;
}
