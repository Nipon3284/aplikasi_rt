'use client';

import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  Sliders, 
  Sparkles
} from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  initialRotation?: number;
  onRotationChange?: (newRotation: number) => void;
}

export default function ImageViewer({
  src,
  alt = 'Dokumen Kartu Keluarga',
  initialRotation = 0,
  onRotationChange,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(initialRotation || 0);
  const [highContrast, setHighContrast] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Update rotation if initialRotation changes (e.g. from AI extraction)
  React.useEffect(() => {
    if (typeof initialRotation === 'number') {
      setRotation(initialRotation);
    }
  }, [initialRotation]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  
  const handleRotate = () => {
    const next = (rotation + 90) % 360;
    setRotation(next);
    if (onRotationChange) onRotationChange(next);
  };

  const handleFlip180 = () => {
    const next = (rotation + 180) % 360;
    setRotation(next);
    if (onRotationChange) onRotationChange(next);
  };
  
  const handleReset = () => {
    setScale(1);
    setRotation(initialRotation || 0);
    setPosition({ x: 0, y: 0 });
    setHighContrast(false);
    setInverted(false);
    if (onRotationChange) onRotationChange(initialRotation || 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filter citra khusus untuk membaca fotokopi buram
  const filterStyles = [
    highContrast ? 'contrast(200%) brightness(95%)' : '',
    inverted ? 'invert(1) hue-rotate(180deg)' : '',
  ].filter(Boolean).join(' ') || 'none';

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      {/* Toolbar Kontrol Gambar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-slate-400 font-mono px-1">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Putar 90 Derajat Searah Jarum Jam"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFlip180}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] font-bold transition"
            title="Balikkan dokumen 180 derajat (jika dokumen terbalik)"
          >
            Balik 180°
          </button>
          {rotation > 0 && (
            <span className="text-amber-400 font-mono text-[10px] px-1 font-bold">
              {rotation}°
            </span>
          )}
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Reset Tampilan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Citra Fotokopi Buram */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition ${
              highContrast
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Tingkatkan kontras untuk memperjelas fotokopi buram"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kontras Tinggi</span>
          </button>

          <button
            onClick={() => setInverted(!inverted)}
            className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition ${
              inverted
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Mode Inversi Negatif (memperjelas tinta pudar)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mode Invert</span>
          </button>
        </div>
      </div>

      {/* Canvas Gambar yang Bisa Di-drag & Zoom */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing p-4 select-none min-h-[420px] max-h-[750px]"
        style={{
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            filter: filterStyles,
          }}
          className="max-w-none shadow-2xl rounded"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain pointer-events-none rounded border border-slate-700 bg-white"
            style={{ maxWidth: '850px' }}
          />
        </div>

        {/* Petunjuk Interaksi */}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[11px] text-slate-400 border border-slate-800 pointer-events-none">
          Tarik untuk menggeser gambar | Gunakan tombol atas untuk Zoom & Filter
        </div>
      </div>
    </div>
  );
}
