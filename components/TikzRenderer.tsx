'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function TikzRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current) return;

    try {
      setError(null);
      
      // Đảm bảo xóa nội dung cũ
      containerRef.current.innerHTML = '';

      // Tạo thẻ script cho tikzjax
      const script = document.createElement('script');
      script.type = 'text/tikz';
      script.textContent = content;
      
      // Inject thẻ script vào container để MutationObserver của tikzjax kích hoạt
      containerRef.current.appendChild(script);
      
      // Tikzjax sẽ tự động chuyển thẻ <script> này thành thẻ <svg> (nếu thành công) hoặc in ra lỗi ở console.
    } catch (err: any) {
      if (isMounted) {
        setError(err.message || 'Lỗi khi render hình TikZ');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [content]);

  return (
    <div className="tikz-render-container w-full overflow-auto flex flex-col items-center justify-center min-h-[50px] relative">
      {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded w-full text-center">{error}</div>}
      <div ref={containerRef} className="w-full flex justify-center items-center" />
    </div>
  );
}
