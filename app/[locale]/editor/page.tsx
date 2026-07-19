'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import { useLocale } from 'next-intl';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import pptxgen from 'pptxgenjs';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import DrawingModal, { DrawingType } from '@/components/DrawingModal';
const TikZ = dynamic(() => import('@/components/TikzRenderer'), { 
  ssr: false, 
  loading: () => <p className="text-sm text-indigo-500 italic text-center p-4">Đang chuẩn bị vẽ hình...</p> 
});

export default function MathEditorWorkspace() {
  const router = useRouter();
  const { showToast } = useToast();
  const locale = useLocale();
  
  const [content, setContent] = useState('');
  const [activeView, setActiveView] = useState<'split' | 'edit' | 'preview'>('preview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Generation States
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Student Mode State (Hide solutions in Print)
  const [studentMode, setStudentMode] = useState(false);

  // TikZJax Load State
  const [tikzLoaded, setTikzLoaded] = useState(false);

  // Drawing Modal State
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [drawingType, setDrawingType] = useState<DrawingType>('excalidraw');

  // Format State
  const [isFormatting, setIsFormatting] = useState(false);

  const openDrawingModal = (type: DrawingType) => {
    setDrawingType(type);
    setDrawingModalOpen(true);
  };

  const handleInsertDrawing = (base64Data: string) => {
    const textToInsert = `\n\n![Hình vẽ trực quan](${base64Data})\n\n`;
    
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.substring(0, start) + textToInsert + content.substring(end);
      setContent(newContent);
      
      // Khôi phục vị trí con trỏ sau khi chèn (tùy chọn)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + textToInsert.length;
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      setContent(prev => prev + textToInsert);
    }
    setDrawingModalOpen(false);
    showToast('success', 'Đã chèn hình vẽ vào bài giảng');
  };

  const handleFormat = async () => {
    if (!content.trim()) {
      showToast('warning', 'Không có nội dung để chuẩn hóa!');
      return;
    }

    setIsFormatting(true);
    showToast('info', 'Đang phân tích và chuẩn hóa định dạng...');

    try {
      const response = await fetch('/api/format-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi từ máy chủ AI');
      }

      const normalizedText = data.text ? data.text.normalize('NFC') : '';
      setContent(normalizedText);
      showToast('success', 'Đã chuẩn hóa định dạng thành công!');
    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Lỗi khi chuẩn hóa.');
    } finally {
      setIsFormatting(false);
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).process_tikz) {
      setTikzLoaded(true);
    }
    // Fallback if onLoad fails or script is cached
    const timer = setTimeout(() => setTikzLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async () => {
    if (!textInput.trim() && !file) {
      showToast('warning', 'Vui lòng nhập chủ đề, dán link hoặc tải lên file PDF/Ảnh!');
      return;
    }

    setIsGenerating(true);
    showToast('info', 'AI đang phân tích tài liệu và thiết kế bài giảng...');

    try {
      const formData = new FormData();
      formData.append('locale', locale);
      if (textInput) formData.append('textInput', textInput);
      if (file) formData.append('file', file);

      const response = await fetch('/api/editor-ai', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi từ máy chủ AI');
      }

      // Chuẩn hóa chuỗi Unicode về dạng NFC (Dựng sẵn) để sửa lỗi font tiếng Việt bị rời rạc dấu
      const normalizedText = data.text ? data.text.normalize('NFC') : '';

      setContent(normalizedText);
      setActiveView('preview'); // Tự động chuyển sang chế độ xem trước khi xong
      showToast('success', 'Đã thiết kế xong bài giảng!');
    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Gặp sự cố khi sinh bài giảng.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportLaTeX = () => {
    const latexTemplate = `\\documentclass[12pt,a4paper]{article}\n\\usepackage[utf8]{vietnam}\n\\usepackage{amsmath, amssymb}\n\\begin{document}\n\n${content}\n\n\\end{document}`;
    const blob = new Blob([latexTemplate], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bai_Giang_Toan_TBS.tex';
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('success', 'Đã tải xuống file LaTeX (.tex)');
  };

  const exportPDF = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const exportPPTX = () => {
    setShowExportMenu(false);
    if (!content) {
      showToast('warning', 'Chưa có nội dung để xuất PowerPoint!');
      return;
    }
    
    showToast('info', 'Đang tạo tệp PowerPoint...');
    try {
      let pres = new pptxgen();
      
      // Xử lý Markdown cơ bản thành các Slide
      // Một slide mới bắt đầu bằng thẻ Heading 1 (# ) hoặc Heading 2 (## )
      const sections = content.split(/\n(?=# |\n## )/);

      sections.forEach((section, index) => {
        let slide = pres.addSlide();
        
        // Trích xuất tiêu đề (Dòng đầu tiên nếu bắt đầu bằng #)
        const lines = section.trim().split('\n');
        let title = '';
        let bodyText = '';

        if (lines[0].startsWith('#')) {
          title = lines[0].replace(/#/g, '').trim();
          bodyText = lines.slice(1).join('\n').trim();
        } else {
          bodyText = lines.join('\n').trim();
        }

        // Định dạng Slide
        if (title) {
          slide.addText(title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 24, bold: true, color: '363636' });
          slide.addText(bodyText, { x: 0.5, y: 1.5, w: '90%', h: '75%', fontSize: 16, color: '666666', valign: 'top' });
        } else {
          slide.addText(bodyText, { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 16, color: '666666', valign: 'top' });
        }
      });

      pres.writeFile({ fileName: "Bai_Giang_Toan_TBS.pptx" });
      showToast('success', 'Đã xuất thành công tệp PowerPoint!');
    } catch (e) {
      console.error(e);
      showToast('error', 'Lỗi khi tạo tệp PowerPoint.');
    }
  };

  const handleClear = () => {
    if(window.confirm('Bạn có chắc muốn xóa toàn bộ nội dung?')) {
      setContent('');
      setTextInput('');
      setFile(null);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('warning', 'Chưa có nội dung để lưu!');
      return;
    }
    const title = window.prompt("Vui lòng nhập tiêu đề bài giảng:");
    if (!title) return;
    
    showToast('info', 'Đang lưu bài giảng...');
    try {
      await addDoc(collection(db, 'lectures'), {
        title,
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('success', 'Đã lưu bài giảng thành công!');
      router.push('/department/lectures');
    } catch (error: any) {
      console.error(error);
      showToast('error', 'Lỗi khi lưu bài giảng.');
    }
  };

  return (
    <AuthGuard>
      {/* 
        Inject global CSS rules for printing based on studentMode.
        If studentMode is true, we hide <details> elements containing solutions when printing.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-hide { display: none !important; }
          ${studentMode ? 'details { display: none !important; }' : 'details { display: block !important; } details summary { font-weight: bold; } details[open] { display: block !important; } details:not([open])::after { content: " (Xem lời giải trong file mềm)"; display: block; }'}
        }
      `}} />

      <Script 
        src="https://tikzjax.com/v1/tikzjax.js" 
        onLoad={() => setTikzLoaded(true)} 
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-slate-100 flex flex-col font-sans">
        
        {/* --- NAVBAR --- */}
        <header className="bg-white border-b border-slate-200 p-4 shadow-sm z-10 flex justify-between items-center print-hide">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                AI Soạn Bài Giảng Đa Phương Tiện
              </h1>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Phân tích File / URL để tự động thiết kế tiết học trực quan
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
            {/* Toggle Student Mode */}
            <div className="flex items-center gap-2 mr-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Bản in Học Sinh (Ẩn lời giải)</span>
              <button 
                onClick={() => setStudentMode(!studentMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${studentMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${studentMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs uppercase rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              💾 Lưu
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                📥 Xuất File
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden flex flex-col z-50">
                  <button onClick={exportPDF} className="px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    📄 Xuất PDF (Print)
                  </button>
                  <button onClick={exportPPTX} className="px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    📊 Xuất PowerPoint (.pptx)
                  </button>
                  <button onClick={exportLaTeX} className="px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    💻 Xuất LaTeX (.tex)
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-800 text-white font-bold text-xs uppercase rounded-lg hover:bg-slate-700 transition-colors"
            >
              ⬅ Đóng
            </button>
          </div>
        </header>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR INPUT: GIAO DIỆN TẢI LÊN & CHỈ ĐỊNH */}
          <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto print-hide space-y-6 shadow-md z-0">
            <div>
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>1</span> Nguồn Dữ Liệu
              </h2>
              <p className="text-[10px] text-slate-500 mb-4">Upload đề thi, bài đọc hoặc cung cấp Link chủ đề.</p>
              
              <div className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {file ? (
                    <div className="text-sm font-bold text-emerald-600 truncate">
                      📄 {file.name}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs font-medium">
                      Kéo thả hoặc click để tải lên File (PDF, Hình ảnh)
                    </div>
                  )}
                </div>
                
                {/* Text/Link Input */}
                <div>
                  <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Hoặc dán Link URL bài giảng, nội dung văn bản thuần vào đây..."
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || (!textInput.trim() && !file)}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isGenerating ? 'Đang phân tích...' : '🤖 Sinh bài giảng'}
              </button>
            </div>
          </div>

          {/* KHÔNG GIAN SOẠN THẢO VÀ XEM TRƯỚC */}
          <div className="flex-1 flex flex-col p-4 bg-slate-100">
            
            {/* View Toggle */}
            <div className="flex justify-between items-center mb-4 print-hide">
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
                  👁️ Xem trước & In
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
                <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-hide ${activeView === 'edit' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã nguồn (Markdown & LaTeX)</span>
                    <div className="flex gap-2">
                      <button onClick={() => openDrawingModal('excalidraw')} className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1 shadow-sm text-slate-700">
                        ✍️ Bảng trắng
                      </button>
                      <button onClick={() => openDrawingModal('geogebra')} className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1 shadow-sm text-slate-700">
                        📐 GeoGebra
                      </button>
                      <button onClick={handleFormat} disabled={isFormatting} className="text-xs px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-100 font-medium flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors">
                        {isFormatting ? '⏳ Đang xử lý...' : '✨ Chuẩn hóa'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value.normalize('NFC'))}
                    placeholder="AI sẽ sinh ra nội dung Markdown tại đây..."
                    className="flex-1 w-full p-6 text-sm font-mono text-slate-700 bg-transparent focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* PREVIEW PANE */}
              {(activeView === 'preview' || activeView === 'split') && (
                <div className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:m-0 ${activeView === 'preview' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center print-hide">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Bản xem trước trực quan (Tương tác được)</span>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto text-base text-slate-800 leading-relaxed font-serif prose prose-slate max-w-none">
                    {content ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match && match[1] === 'tikz') {
                              return (
                                <div className="flex justify-center my-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                                  {tikzLoaded ? (
                                    <TikZ content={String(children).replace(/\n$/, '')} />
                                  ) : (
                                    <p className="text-sm text-indigo-500 italic text-center p-4">Đang tải công cụ vẽ hình...</p>
                                  )}
                                </div>
                              );
                            }
                            if (!inline && match && match[1] === 'svg') {
                              return (
                                <div 
                                  className="flex justify-center my-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                                  dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, '') }}
                                />
                              );
                            }
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }}
                      >
                        {content.normalize('NFC')}
                      </ReactMarkdown>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                        {isGenerating ? 'Đang soạn bài giảng...' : 'Kết quả bài giảng sẽ xuất hiện tại đây...'}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <DrawingModal 
          isOpen={drawingModalOpen} 
          type={drawingType}
          onSave={handleInsertDrawing}
          onClose={() => setDrawingModalOpen(false)}
        />

      </main>
    </AuthGuard>
  );
}