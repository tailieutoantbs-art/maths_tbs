'use client';
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import Excalidraw dynamically to avoid SSR issues
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

const exportToSvg = async (elements: any, appState: any, files: any) => {
  const { exportToSvg: _exportToSvg } = await import('@excalidraw/excalidraw');
  return _exportToSvg({
    elements,
    appState,
    files,
    exportPadding: 16,
  });
};

export default function ExcalidrawWrapper({ onSave, onCancel }: { onSave: (base64Svg: string) => void, onCancel: () => void }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const handleSave = async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) return;
    
    try {
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      const svg = await exportToSvg(elements, {
        ...appState,
        exportBackground: true,
        viewBackgroundColor: '#ffffff'
      }, files);
      
      const svgString = new XMLSerializer().serializeToString(svg);
      const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
      
      onSave(base64Svg);
    } catch (e) {
      console.error('Error exporting SVG', e);
    }
  };

  return (
    <div className="w-full h-[70vh] flex flex-col bg-white">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="text-lg font-bold">Vẽ tay bằng Excalidraw</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm bg-slate-200 rounded hover:bg-slate-300">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Chèn vào bài</button>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
      </div>
    </div>
  );
}
