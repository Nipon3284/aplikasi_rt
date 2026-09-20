'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Sparkles,
  Settings2,
  Building2,
  UserCheck
} from 'lucide-react';

export default function SuratPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [selectedNik, setSelectedNik] = useState('');
  const [jenisSurat, setJenisSurat] = useState('Surat Pengantar Pembuatan KTP / KK');
  const [keperluan, setKeperluan] = useState('Permohonan pembuatan KTP Baru di Kelurahan');
  const [nomorSurat, setNomorSurat] = useState('470 / 012 / RT.003 / 2026');
  
  // Custom Kop Surat & Penandatangan
  const [namaRT, setNamaRT] = useState('003');
  const [namaRW, setNamaRW] = useState('003');
  const [namaKelurahan, setNamaKelurahan] = useState('SUKAMAJU');
  const [namaKecamatan, setNamaKecamatan] = useState('CILODONG');
  const [namaKota, setNamaKota] = useState('DEPOK');
  const [alamatSekretariat, setAlamatSekretariat] = useState('Sekretariat: Lingkungan RT 003 / RW 003, Jawa Barat');
  const [namaKetuaRT, setNamaKetuaRT] = useState('BAMBANG SUTRISNO');
  const [showKopSettings, setShowKopSettings] = useState(false);

  const [tanggalSurat] = useState(new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }));

  useEffect(() => {
    const fetchWarga = async () => {
      try {
        const res = await fetch('/api/warga?status=Aktif');
        const data = await res.json();
        if (data.success) {
          setWargaList(data.data);
          if (data.data.length > 0) {
            setSelectedNik(data.data[0].nik);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWarga();
  }, []);

  const selectedWarga = wargaList.find((w) => w.nik === selectedNik) || (wargaList.length > 0 ? wargaList[0] : null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Form Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            <span>Generator Surat Pengantar RT</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cetak surat pengantar resmi ke Kelurahan atau Kecamatan dengan data warga terisi otomatis &amp; Kop Surat Resmi.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pengaturan Surat (Hidden Saat Print) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Pilih Warga &amp; Jenis Surat</span>
            </h2>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Pilih Pemohon (Warga RT)
              </label>
              <select
                value={selectedNik}
                onChange={(e) => setSelectedNik(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                {wargaList.length === 0 && (
                  <option value="">(Belum ada data warga terdaftar)</option>
                )}
                {wargaList.map((w) => (
                  <option key={w.nik} value={w.nik}>
                    {w.nama_lengkap} (NIK: {w.nik})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Jenis Surat
              </label>
              <select
                value={jenisSurat}
                onChange={(e) => {
                  setJenisSurat(e.target.value);
                  if (e.target.value.includes('KTP')) setKeperluan('Permohonan pembuatan KTP Baru di Kelurahan');
                  else if (e.target.value.includes('Domisili')) setKeperluan('Surat Keterangan Tempat Tinggal / Domisili');
                  else if (e.target.value.includes('SKCK')) setKeperluan('Pengantar Permohonan Surat Catatan Kepolisian (SKCK)');
                  else if (e.target.value.includes('Kematian')) setKeperluan('Keterangan Kematian Warga untuk Akta Kematian');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Surat Pengantar Pembuatan KTP / KK">Surat Pengantar Pembuatan KTP / KK</option>
                <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                <option value="Surat Pengantar SKCK">Surat Pengantar SKCK</option>
                <option value="Surat Keterangan Kematian">Surat Keterangan Kematian</option>
                <option value="Surat Keterangan Tidak Mampu (SKTM)">Surat Keterangan Tidak Mampu (SKTM)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Nomor Surat RT
              </label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Keperluan / Keterangan
              </label>
              <textarea
                rows={3}
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Toggle Pengaturan Kop & Penandatangan */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowKopSettings(!showKopSettings)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sesuaikan Data Kop &amp; Tanda Tangan</span>
                </span>
                <span className="text-[10px] text-slate-400">{showKopSettings ? '▲ Tutup' : '▼ Edit'}</span>
              </button>

              {showKopSettings && (
                <div className="mt-3 space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Nomor RT</label>
                      <input
                        type="text"
                        value={namaRT}
                        onChange={(e) => setNamaRT(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Nomor RW</label>
                      <input
                        type="text"
                        value={namaRW}
                        onChange={(e) => setNamaRW(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Nama Ketua RT (Tanda Tangan)</label>
                    <input
                      type="text"
                      value={namaKetuaRT}
                      onChange={(e) => setNamaKetuaRT(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Kelurahan</label>
                      <input
                        type="text"
                        value={namaKelurahan}
                        onChange={(e) => setNamaKelurahan(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Kecamatan</label>
                      <input
                        type="text"
                        value={namaKecamatan}
                        onChange={(e) => setNamaKecamatan(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={namaKota}
                      onChange={(e) => setNamaKota(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">Alamat Sekretariat di Kop</label>
                    <input
                      type="text"
                      value={alamatSekretariat}
                      onChange={(e) => setAlamatSekretariat(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              * Pratinjau di sebelah kanan menggunakan Logo Resmi RT 3 RW 3 Istimewa dan siap cetak langsung.
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Lembar Surat Resmi (Siap Print) */}
        <div className="lg:col-span-8">
          <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 min-h-[840px] flex flex-col justify-between font-serif print:shadow-none print:border-none print:p-0">
            {/* Kop Surat Resmi RT 3 RW 3 Istimewa */}
            <div>
              <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-3 mb-6 gap-3">
                {/* Logo RT di sisi kiri */}
                <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo RT 3 RW 3 Istimewa" 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-md"
                  />
                </div>

                {/* Teks Identitas Kop Surat */}
                <div className="text-center flex-1">
                  <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-slate-800">
                    RUKUN TETANGGA {namaRT} / RUKUN WARGA {namaRW}
                  </h3>
                  <h2 className="font-black text-lg sm:text-xl tracking-wider uppercase text-slate-950 font-serif">
                    PENGURUS RT {namaRT} RW {namaRW} &quot;ISTIMEWA&quot;
                  </h2>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-700 italic font-serif">
                    &ldquo;GUYUB &bull; RUKUN &bull; KOMPAK &bull; PEDULI&rdquo;
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-sans text-slate-600 mt-0.5">
                    Bersama Membangun Lingkungan yang Nyaman, Aman &amp; Harmonis
                  </p>
                  <p className="text-[10px] font-sans text-slate-500 mt-0.5">
                    {alamatSekretariat}
                  </p>
                </div>

                {/* Spacer penyeimbang di sisi kanan agar teks simetris sempurna di tengah halaman */}
                <div className="w-24 h-24 shrink-0 hidden sm:flex items-center justify-center">
                  <img 
                    src="/logo.jpg" 
                    alt="Spacer" 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-0 pointer-events-none"
                  />
                </div>
              </div>

              {/* Judul & Nomor Surat */}
              <div className="text-center my-6 space-y-1">
                <h1 className="font-bold text-base underline uppercase tracking-wide">
                  {jenisSurat}
                </h1>
                <p className="text-xs font-mono text-slate-700">
                  Nomor: {nomorSurat}
                </p>
              </div>

              {/* Pembuka */}
              <p className="text-xs leading-relaxed mb-4 text-justify font-sans">
                Yang bertanda tangan di bawah ini Ketua RT {namaRT} / RW {namaRW} {namaKelurahan ? `Kelurahan ${namaKelurahan}, Kecamatan ${namaKecamatan}` : ''} {namaKota ? namaKota : ''}, menerangkan dengan sebenarnya bahwa:
              </p>

              {/* Data Warga Pemohon */}
              {selectedWarga ? (
                <table className="w-full text-xs font-sans mb-6">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 w-44 font-semibold text-slate-700">Nama Lengkap</td>
                      <td className="py-1.5 w-4">:</td>
                      <td className="py-1.5 font-bold uppercase">{selectedWarga.nama_lengkap}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Nomor Induk Kependudukan (NIK)</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5 font-mono font-bold">{selectedWarga.nik}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Nomor Kartu Keluarga (KK)</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5 font-mono">{selectedWarga.no_kk}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Tempat / Tanggal Lahir</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5">{selectedWarga.tempat_lahir}, {selectedWarga.tanggal_lahir}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Jenis Kelamin / Agama</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5">{selectedWarga.jenis_kelamin} / {selectedWarga.agama}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Pekerjaan</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5">{selectedWarga.pekerjaan}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-700">Alamat KTP / Domisili</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5">
                        {selectedWarga.kartu_keluarga?.alamat}, RT {selectedWarga.kartu_keluarga?.rt || namaRT} / RW {selectedWarga.kartu_keluarga?.rw || namaRW}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-4 bg-slate-50 text-xs text-slate-400 italic">Pilih warga terlebih dahulu dari daftar warga RT di sebelah kiri.</div>
              )}

              {/* Isi Keperluan */}
              <div className="text-xs font-sans leading-relaxed space-y-2 text-justify">
                <p>
                  Nama tersebut di atas adalah benar-benar warga yang berdomisili di lingkungan RT {namaRT} / RW {namaRW} {namaKelurahan ? `Kelurahan ${namaKelurahan}` : ''}.
                </p>
                <p>
                  Surat pengantar ini diberikan untuk keperluan: <strong className="underline">{keperluan}</strong>.
                </p>
                <p className="pt-2">
                  Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-10 font-sans text-xs flex justify-end">
              <div className="text-center w-64 space-y-16">
                <div>
                  <p>{namaKota ? namaKota.replace('KOTA ', '').replace('KABUPATEN ', '') : 'Tempat'}, {tanggalSurat}</p>
                  <p className="font-semibold mt-1">Ketua RT {namaRT} / RW {namaRW}</p>
                </div>

                <div>
                  <p className="font-bold underline uppercase tracking-wider">{namaKetuaRT}</p>
                  <p className="text-[11px] text-slate-500">Ketua RT {namaRT}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
