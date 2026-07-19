'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function GeoGebraWrapper({ onSave, onCancel }: { onSave: (base64Img: string) => void, onCancel: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [appletLoaded, setAppletLoaded] = useState(false);

  useEffect(() => {
    // Load GeoGebra deploy script if not loaded
    if (!document.getElementById('ggb-deploy-script')) {
      const script = document.createElement('script');
      script.id = 'ggb-deploy-script';
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.onload = initApplet;
      document.head.appendChild(script);
    } else {
      initApplet();
    }

    function initApplet() {
      if (typeof window === 'undefined' || !(window as any).GGBApplet) return;
      
      const parameters = {
        "id": "ggbApplet",
        "width": 800,
        "height": 500,
        "showMenuBar": true,
        "showAlgebraInput": true,
        "showToolBar": true,
        "showToolBarHelp": false,
        "showResetIcon": false,
        "enableLabelDrags": false,
        "enableShiftDragZoom": true,
        "enableRightClick": true,
        "errorDialogsActive": false,
        "useBrowserForJS": false,
        "preventFocus": false,
        "language": "vi",
        "appletOnLoad": () => { setAppletLoaded(true); }
      };

      const applet = new (window as any).GGBApplet(parameters, true);
      if (containerRef.current) {
        // clear container before inject
        containerRef.current.innerHTML = '';
        applet.inject(containerRef.current);
      }
    }

    return () => {
      // Cleanup if needed (GeoGebra doesn't have a clean destroy method, so we just clear DOM)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleSave = () => {
    if (!appletLoaded || typeof window === 'undefined') return;
    const ggbApplet = (window as any).ggbApplet;
    if (ggbApplet) {
      const base64 = ggbApplet.getPNGBase64(1, false, (base64Str: string) => {
        onSave(`data:image/png;base64,${base64Str}`);
      });
      // Fallback in case callback is synchronous (older API)
      if (typeof base64 === 'string' && base64.length > 0) {
          onSave(`data:image/png;base64,${base64}`);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full flex flex-col bg-white">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="text-lg font-bold">Vẽ hình Toán học với GeoGebra</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm bg-slate-200 rounded hover:bg-slate-300">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Chèn vào bài</button>
        </div>
      </div>
      <div className="flex-1 w-full flex justify-center bg-slate-50 p-2">
        <div ref={containerRef} id="ggb-element" style={{ width: 800, height: 500 }}></div>
      </div>
    </div>
  );
}
