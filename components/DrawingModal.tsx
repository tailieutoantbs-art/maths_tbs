'use client';
import React from 'react';
import ExcalidrawWrapper from './ExcalidrawWrapper';
import GeoGebraWrapper from './GeoGebraWrapper';

export type DrawingType = 'excalidraw' | 'geogebra';

interface DrawingModalProps {
  isOpen: boolean;
  type: DrawingType;
  onSave: (base64Data: string) => void;
  onClose: () => void;
}

export default function DrawingModal({ isOpen, type, onSave, onClose }: DrawingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {type === 'excalidraw' && (
          <ExcalidrawWrapper onSave={onSave} onCancel={onClose} />
        )}
        {type === 'geogebra' && (
          <GeoGebraWrapper onSave={onSave} onCancel={onClose} />
        )}
      </div>
    </div>
  );
}
