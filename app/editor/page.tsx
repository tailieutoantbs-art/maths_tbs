'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export default function MathEditorWorkspace() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [content, setContent] = useState('');
  const [activeView, setActiveView] = useState<'split' | 'edit' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Bộ công cụ nhập nhanh mã Toán học (Quick Snippets)
  const mathSnippets = [
    { label: 'Phân số', snippet: '\\frac{a}{b}' },
    { label: 'Căn bậc 2', snippet: '\\sqrt{x}' },
    { label: 'Căn bậc n', snippet: '\\sqrt[n]{x}' },
    { label: 'Lũy thừa', snippet: 'x^{2}' },
    { label: 'Tích phân', snippet: '\\int_{a}^{b} f(x) dx' },
    { label: 'Đạo hàm', snippet: "f'(x) = \\lim_{h \\to 0}" },
    { label: 'Giới hạn', snippet: '\\lim_{x \\to \\infty}' },
    { label: 'Tổng Sigma', snippet: '\\sum_{i=1}^{n} x_i' },
    { label: 'Ma trận (2x2)', snippet: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Hệ phương trình', snippet: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}' },
    { label: 'Vectơ', snippet: '\\vec{v}' },
    { label: 'Góc', snippet: '\\widehat{ABC}' },
  ];

  // Hàm chèn mã LaTeX tại vị trí con trỏ chuột
  const insertSnippet = (snippet: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const textBefore = content.substring(0, start);
      const textAfter = content.substring(end, content.length);
      
      // Tự động bọc dấu $ nếu chưa có
      const formattedSnippet = ` $${snippet}$ `;
      
      setContent(textBefore + formattedSnippet + textAfter);
      
      // Đưa focus lại vào textarea sau khi chèn
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = start + formattedSnippet.length;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setContent(prev => prev + ` $${snippet}$ `);
    }
  };

  // Hàm trích xuất và hiển thị xem trước (Giả lập render Markdown + Math)
  const renderPreview = (text: string) => {
    // Tách chuỗi theo dấu $...$ để render InlineMath
    const parts = text.split(/(\$.*?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        // Xóa dấu $ ở hai đầu
        const mathStr = part.slice(1, -1);
        return <InlineMath key={index} math={mathStr} />;
      }
      // Render text bình thường có ngắt dòng
      return (
        <span key={index}>
          {part.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showToast('success', 'Đã chép nội dung vào khay nhớ tạm!');
  };

  const handleClear = () => {
    if(window.confirm('Thầy có chắc muốn xóa toàn bộ nội dung đang soạn thảo không?')) {
      setContent('');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-100 flex flex-col font-sans">
        
        {/* --- NAVBAR --- */}
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✍️</span>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                Trình Biên Soạn Toán Học TBS
              </h1>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Phân hệ độc lập hỗ trợ thiết kế chuyên đề & câu hỏi
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase rounded-lg hover:bg-indigo-100 transition-colors"
            >
              📋 Sao chép
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-800 text-white font-bold text-xs uppercase rounded-lg hover:bg-slate-700 transition-colors"
            >
              ⬅ Đóng & Về Dashboard
            </button>
          </div>
        </header>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR TÍNH NĂNG NHANH */}
          <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col h-full overflow-y-auto">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">
              Bộ công cụ LaTeX
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {mathSnippets.map((item, index) => (
                <button
                  key={index}
                  onClick={() => insertSnippet(item.snippet)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:shadow-sm transition-all group"
                >
                  <span className="block text-[10px] font-black text-indigo-600 uppercase mb-1">{item.label}</span>
                  <span className="block text-xs font-mono text-slate-600 truncate group-hover:text-slate-800">{item.snippet}</span>
                </button>
              ))}
            </div>
          </div>

          {/* KHÔNG GIAN SOẠN THẢO VÀ XEM TRƯỚC */}
          <div className="flex-1 flex flex-col p-4 bg-slate-100">
            
            {/* View Toggle */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                <button 
                  onClick={() => setActiveView('edit')}
                  className={`px-4 py-1.5 text-xs font-black uppercase rounded-md transition-all ${activeView === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  📝 Soạn thảo
                </button>
                <button 
                  onClick={() => setActiveView('split')}
                  className={`px-4 py-1.5 text-xs font-black uppercase rounded-md transition-all ${activeView === 'split' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  ⚖️ Chia đôi
                </button>
                <button 
                  onClick={() => setActiveView('preview')}
                  className={`px-4 py-1.5 text-xs font-black uppercase rounded-md transition-all ${activeView === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  👁️ Xem trước
                </button>
              </div>
              <button 
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Xóa toàn bộ
              </button>
            </div>

            {/* Split Pane Container */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              
              {/* EDITOR PANE */}
              {(activeView === 'edit' || activeView === 'split') && (
                <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${activeView === 'edit' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã nguồn (Plain Text & LaTeX)</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Bắt đầu nhập nội dung. Đặt công thức Toán vào giữa 2 dấu $ (ví dụ: $ \int x dx $)..."
                    className="flex-1 w-full p-6 text-sm font-mono text-slate-700 bg-transparent focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* PREVIEW PANE */}
              {(activeView === 'preview' || activeView === 'split') && (
                <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${activeView === 'preview' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Bản xem trước trực quan</span>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto text-base text-slate-800 leading-relaxed font-serif">
                    {content ? renderPreview(content) : (
                      <span className="text-slate-300 italic text-sm">Bản xem trước sẽ xuất hiện tại đây...</span>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>
    </AuthGuard>
  );
}