'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Info,
  Maximize2,
  Crop as CropIcon,
} from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

interface CropBox {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

export default function ImageCropModal({
  imageSrc,
  fileName,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const [rotation, setRotation] = useState<number>(0);
  const [crop, setCrop] = useState<CropBox>({ x: 2, y: 2, width: 96, height: 96 });
  const [aspectRatioMode, setAspectRatioMode] = useState<'free' | 'landscape_kk' | 'full'>('landscape_kk');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);

  // Dragging state
  const dragRef = useRef<{
    isDragging: boolean;
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
    startX: number;
    startY: number;
    startCrop: CropBox;
  }>({
    isDragging: false,
    type: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, width: 100, height: 100 },
  });

  // Render rotated image on offscreen/display canvas
  const renderCanvas = useCallback((angle: number) => {
    const img = originalImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isPerpendicular = angle === 90 || angle === 270;
    const w = isPerpendicular ? img.naturalHeight : img.naturalWidth;
    const h = isPerpendicular ? img.naturalWidth : img.naturalHeight;

    canvas.width = w;
    canvas.height = h;
    setCanvasDimensions({ width: w, height: h });

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      originalImgRef.current = img;
      setImageLoaded(true);

      // Jika foto awal vertikal/portrait, otomatis putar 90 derajat ke lanskap KK
      let initialRotation = 0;
      if (img.naturalHeight > img.naturalWidth) {
        initialRotation = 90;
      }
      setRotation(initialRotation);
      renderCanvas(initialRotation);

      // Set default crop box
      setCrop({ x: 3, y: 3, width: 94, height: 94 });
    };
  }, [imageSrc, renderCanvas]);

  // Redraw when rotation changes
  useEffect(() => {
    if (imageLoaded) {
      renderCanvas(rotation);
    }
  }, [rotation, imageLoaded, renderCanvas]);

  // Set preset crop
  const applyPresetCrop = (mode: 'free' | 'landscape_kk' | 'full') => {
    setAspectRatioMode(mode);
    if (mode === 'full') {
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
      return;
    }

    if (mode === 'landscape_kk') {
      // Rasio standar KK (sekitar 3:2 atau 1.45)
      const targetRatio = 1.45; // lebar / tinggi
      const canvasRatio = canvasDimensions.width / canvasDimensions.height;

      let w = 92;
      let h = 92;
      if (canvasRatio > targetRatio) {
        // Canvas lebih lebar
        h = 90;
        w = (h * targetRatio) / canvasRatio;
      } else {
        // Canvas lebih tinggi
        w = 90;
        h = (w * canvasRatio) / targetRatio;
      }

      const x = Math.max(0, (100 - w) / 2);
      const y = Math.max(0, (100 - h) / 2);
      setCrop({ x, y, width: Math.min(100, w), height: Math.min(100, h) });
    } else {
      // Free
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
    }
  };

  // Rotation handlers
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    applyPresetCrop('full');
  };

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      isDragging: true,
      type,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop },
    };

    const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!dragRef.current.isDragging || !containerRef.current) return;

      const currentX =
        'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY =
        'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPercent = ((currentX - dragRef.current.startX) / rect.width) * 100;
      const deltaYPercent = ((currentY - dragRef.current.startY) / rect.height) * 100;

      const { startCrop, type: dragType } = dragRef.current;
      let newCrop = { ...startCrop };

      if (dragType === 'move') {
        newCrop.x = Math.max(0, Math.min(100 - startCrop.width, startCrop.x + deltaXPercent));
        newCrop.y = Math.max(0, Math.min(100 - startCrop.height, startCrop.y + deltaYPercent));
      } else {
        // Resizing handles
        if (dragType?.includes('e')) {
          newCrop.width = Math.max(10, Math.min(100 - startCrop.x, startCrop.width + deltaXPercent));
        }
        if (dragType?.includes('s')) {
          newCrop.height = Math.max(10, Math.min(100 - startCrop.y, startCrop.height + deltaYPercent));
        }
        if (dragType?.includes('w')) {
          const maxLeftShift = startCrop.width - 10;
          const actualDelta = Math.max(-startCrop.x, Math.min(maxLeftShift, deltaXPercent));
          newCrop.x = startCrop.x + actualDelta;
          newCrop.width = startCrop.width - actualDelta;
        }
        if (dragType?.includes('n')) {
          const maxUpShift = startCrop.height - 10;
          const actualDelta = Math.max(-startCrop.y, Math.min(maxUpShift, deltaYPercent));
          newCrop.y = startCrop.y + actualDelta;
          newCrop.height = startCrop.height - actualDelta;
        }
      }

      setCrop(newCrop);
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
      dragRef.current.type = null;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  // Export processed cropped image
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);

    try {
      // Calculate crop coordinates in actual canvas pixels
      const sx = Math.max(0, Math.round((crop.x / 100) * canvas.width));
      const sy = Math.max(0, Math.round((crop.y / 100) * canvas.height));
      const sw = Math.min(canvas.width - sx, Math.round((crop.width / 100) * canvas.width));
      const sh = Math.min(canvas.height - sy, Math.round((crop.height / 100) * canvas.height));

      if (sw <= 0 || sh <= 0) {
        throw new Error('Ukuran potongan gambar tidak valid.');
      }

      // Constrain maximum resolution to 2400px (keeps text crystal clear without bloating payload)
      const maxDimension = 2400;
      const scale = Math.min(1, maxDimension / Math.max(sw, sh));
      const outWidth = Math.round(sw * scale);
      const outHeight = Math.round(sh * scale);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outWidth;
      outCanvas.height = outHeight;
      const outCtx = outCanvas.getContext('2d');

      if (!outCtx) throw new Error('Gagal menyiapkan kanvas ekspor.');

      // Draw high quality
      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';
      outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, outWidth, outHeight);

      outCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            alert('Gagal mengekspor gambar.');
            return;
          }

          const processedFile = new File(
            [blob],
            `kk-adjusted-${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );

          onConfirm(processedFile);
        },
        'image/jpeg',
        0.92
      );
    } catch (err: any) {
      console.error('Crop export error:', err);
      setIsProcessing(false);
      alert(err.message || 'Terjadi kesalahan saat memotong gambar.');
    }
  };

  const isCurrentLandscape = canvasDimensions.width >= canvasDimensions.height;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CropIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sesuaikan Posisi & Potong Foto KK
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Langkah 1: Perapihan
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip Orientasi */}
        <div className={`px-5 py-2.5 flex items-center gap-2.5 text-xs border-b ${
          isCurrentLandscape 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50' 
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 font-medium'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {isCurrentLandscape ? (
              <>Orientasi saat ini sudah <strong>Lanskap (Mendatar)</strong>. Pastikan tulisan terbaca tegak dan tidak terbalik.</>
            ) : (
              <>⚠️ Dokumen masih dalam posisi <strong>Tegak (Portrait)</strong>. Gunakan tombol <strong>Putar 90°</strong> di bawah agar format KK menjadi mendatar!</>
            )}
          </span>
        </div>

        {/* Workspace Canvas & Crop Area */}
        <div className="flex-1 min-h-[320px] max-h-[58vh] bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none relative">
          {!imageLoaded && (
            <div className="text-slate-400 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memuat gambar dokumen...</span>
            </div>
          )}

          {/* Interactive Crop Container */}
          <div
            ref={containerRef}
            className="relative max-h-full max-w-full flex items-center justify-center shadow-lg"
            style={{
              aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
            }}
          >
            {/* The rendered Canvas */}
            <canvas
              ref={canvasRef}
              className="max-h-[54vh] max-w-full object-contain rounded block"
            />

            {/* Dark Scrim around crop box */}
            {imageLoaded && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top scrim */}
                <div
                  className="absolute bg-black/60 top-0 left-0 right-0"
                  style={{ height: `${crop.y}%` }}
                />
                {/* Bottom scrim */}
                <div
                  className="absolute bg-black/60 bottom-0 left-0 right-0"
                  style={{ height: `${100 - (crop.y + crop.height)}%` }}
                />
                {/* Left scrim */}
                <div
                  className="absolute bg-black/60 left-0"
                  style={{
                    top: `${crop.y}%`,
                    height: `${crop.height}%`,
                    width: `${crop.x}%`,
                  }}
                />
                {/* Right scrim */}
                <div
                  className="absolute bg-black/60 right-0"
                  style={{
                    top: `${crop.y}%`,
                    height: `${crop.height}%`,
                    width: `${100 - (crop.x + crop.width)}%`,
                  }}
                />
              </div>
            )}

            {/* Active Crop Box */}
            {imageLoaded && (
              <div
                className="absolute border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                }}
                onMouseDown={(e) => handlePointerDown(e, 'move')}
                onTouchStart={(e) => handlePointerDown(e, 'move')}
              >
                {/* Grid Lines (Rule of thirds) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-white/60"></div>
                  <div className="border-r border-white/60"></div>
                  <div></div>
                </div>

                {/* Resize Handles */}
                {/* NW */}
                <div
                  className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nwse-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'nw')}
                  onTouchStart={(e) => handlePointerDown(e, 'nw')}
                />
                {/* NE */}
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nesw-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'ne')}
                  onTouchStart={(e) => handlePointerDown(e, 'ne')}
                />
                {/* SW */}
                <div
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nesw-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'sw')}
                  onTouchStart={(e) => handlePointerDown(e, 'sw')}
                />
                {/* SE */}
                <div
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nwse-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'se')}
                  onTouchStart={(e) => handlePointerDown(e, 'se')}
                />
                {/* N */}
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-emerald-500 border border-white rounded-full cursor-ns-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'n')}
                  onTouchStart={(e) => handlePointerDown(e, 'n')}
                />
                {/* S */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-emerald-500 border border-white rounded-full cursor-ns-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 's')}
                  onTouchStart={(e) => handlePointerDown(e, 's')}
                />
                {/* W */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2 h-8 bg-emerald-500 border border-white rounded-full cursor-ew-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'w')}
                  onTouchStart={(e) => handlePointerDown(e, 'w')}
                />
                {/* E */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2 h-8 bg-emerald-500 border border-white rounded-full cursor-ew-resize z-10"
                  onMouseDown={(e) => handlePointerDown(e, 'e')}
                  onTouchStart={(e) => handlePointerDown(e, 'e')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          
          {/* Rotate buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotateCcw}
              disabled={!imageLoaded || isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Putar 90° Berlawanan Jarum Jam"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Putar Kiri (90°)</span>
            </button>

            <button
              type="button"
              onClick={handleRotateCw}
              disabled={!imageLoaded || isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Putar 90° Searah Jarum Jam"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Putar Kanan (90°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!imageLoaded || isProcessing}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Reset Orientasi & Potongan"
            >
              Reset
            </button>
          </div>

          {/* Preset Aspect Ratio Crop */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => applyPresetCrop('landscape_kk')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                aspectRatioMode === 'landscape_kk'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lanskap KK (Standar)
            </button>
            <button
              type="button"
              onClick={() => applyPresetCrop('free')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                aspectRatioMode === 'free'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bebas
            </button>
            <button
              type="button"
              onClick={() => applyPresetCrop('full')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                aspectRatioMode === 'full'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Penuh
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Batal / Pilih Ulang
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imageLoaded || isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Gambar...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Selesai & Analisis AI</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
