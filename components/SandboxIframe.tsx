"use client";

import React, { useEffect, useRef, useState } from 'react';

interface SandboxIframeProps {
  htmlContent: string;
  scriptContent: string;
  dataArrays?: any[];
  onComplete?: (score: number, data: any) => void;
  className?: string;
}

export default function SandboxIframe({
  htmlContent,
  scriptContent,
  dataArrays = [],
  onComplete,
  className = "w-full h-full min-h-[500px] border-0 rounded-xl shadow-lg overflow-hidden bg-gray-900"
}: SandboxIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lắng nghe postMessage từ iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vì iframe có thể là 'null' source nếu dùng srcDoc tùy trình duyệt, ta kiểm tra event.data
      if (event.data && event.data.type === 'MODULE_COMPLETE') {
        console.log("Received complete event from sandbox:", event.data);
        if (onComplete) {
          onComplete(event.data.score || 0, event.data.payload || {});
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  const generateSrcDoc = () => {
    // Truyền dataArrays vào window để script có thể truy cập
    const injectedData = `<script>window.MODULE_DATA = ${JSON.stringify(dataArrays)};</script>`;
    
    // Script để kết nối ngược lại parent app
    const bridgeScript = `
      <script>
        function sendComplete(score, payload = {}) {
          window.parent.postMessage({ type: 'MODULE_COMPLETE', score: score, payload: payload }, '*');
        }
      </script>
    `;

    // Nhúng Tailwind CDN để style hoạt động
    const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

    // Nhúng Font Awesome hoặc icon nếu cần
    const fontAwesome = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`;
    
    const combinedScript = `<script>${scriptContent}</script>`;

    return `
      <!DOCTYPE html>
      <html lang="vi" class="dark">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${tailwindScript}
        ${fontAwesome}
        ${injectedData}
        ${bridgeScript}
        <style>
          body { 
            background-color: transparent; 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif;
            color: #fff;
          }
          /* Custom scrollbar for iframe */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        </style>
      </head>
      <body>
        ${htmlContent}
        ${combinedScript}
      </body>
      </html>
    `;
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm z-10 rounded-xl text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">Đang tải mô-đun học tập...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={generateSrcDoc()}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
        onLoad={() => setIsLoaded(true)}
        title="Interactive Sandbox"
      />
    </div>
  );
}
