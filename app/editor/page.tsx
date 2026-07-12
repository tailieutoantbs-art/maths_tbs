'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as any;

function LectureCreatorPage() {
  const router = useRouter();
  const quillRef = useRef<any>(null);

  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingPublish, setLoadingPublish] = useState(false);

  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('Chương 1: Mệnh đề - Tập hợp');
  const [level, setLevel] = useState('medium');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  // ==========================================
  // LUỒNG TẢI ẢNH LÊN CLOUDINARY
  // ==========================================
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'cosodulieuhungtbs'); 

        try {
          const cloudName = 'dlqjlzekw'; 
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          if (data.secure_url) {
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', data.secure_url);
            }
          }
        } catch (error) {
          console.error('Lỗi tải ảnh:', error);
          alert('Không thể tải ảnh lên kho Cloudinary! Thầy kiểm tra lại kết nối mạng nhé.');
        }
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video', 'formula'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  // ==========================================
  // LUỒNG LƯU BÀI MỚI LÊN FIREBASE
  // ==========================================
  const handleSaveToFirebase = async (status: 'draft' | 'published') => {
    if (!title) {
      alert("Thầy vui lòng nhập tiêu đề bài giảng!");
      return;
    }

    if (status === 'draft') setLoadingDraft(true);
    else setLoadingPublish(true);

    try {
      await addDoc(collection(db, 'lectures'), {
        title,
        chapter,
        level,
        tags: tags.split(',').map(tag => tag.trim()),
        content,
        status: status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      alert(status === 'draft' ? 'Đã lưu bản nháp thành công!' : '🎉 Đã đăng công khai bài giảng!');
      router.push('/department/lectures');
    } catch (error) {
      console.error("Lỗi lưu bài giảng:", error);
      alert('Có lỗi xảy ra khi đồng bộ lên Firebase.');
    } finally {
      setLoadingDraft(false);
      setLoadingPublish(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER XANH DƯƠNG CHUẨN UX */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-200/50 rounded-full blur-3xl -z-10"></div>
          
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">
              Trạm Soạn Thảo Bài Giảng
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
              Tạo học liệu số Tổ Toán TBS
            </p>
          </div>

          <div className="flex gap-3 z-10">
            <button 
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase"
            >
              Hủy bỏ
            </button>
            
            <button 
              onClick={() => handleSaveToFirebase('draft')}
              disabled={loadingDraft || loadingPublish}
              className="px-6 py-2.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loadingDraft ? 'Đang lưu nháp...' : '💾 Lưu Bản Nháp'}
            </button>
            
            <button 
              onClick={() => handleSaveToFirebase('published')}
              disabled={loadingDraft || loadingPublish}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {loadingPublish ? 'Đang phát hành...' : '🚀 Đăng Công Khai'}
            </button>
          </div>
        </div>

        {/* KHUNG SOẠN THẢO TEXT EDITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-md border border-white p-2 rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            {/* @ts-ignore */}
            <ReactQuill 
              ref={quillRef}
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
              className="flex-grow bg-white rounded-2xl border-none"
              placeholder="Thầy bắt đầu soạn nội dung bài giảng mới tại đây..."
            />
          </div>

          {/* HỘP NHẬP METADATA CỦA BÀI */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg space-y-5 h-fit">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-sky-100 pb-3 mb-4">
              Metadata Bài Giảng
            </h3>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Tiêu đề chính:</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold text-slate-700 shadow-inner"
                placeholder="VD: Xác suất có điều kiện"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Thuộc Chương:</label>
              <select 
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold text-slate-700 shadow-inner"
              >
                <option>Chương 1: Mệnh đề - Tập hợp</option>
                <option>Chương 2: Bất phương trình</option>
                <option>Chương 3: Hàm số bậc hai</option>
                <option>Hệ thống Ôn tập Đại số</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Mức độ phân hóa:</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setLevel('easy')} className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${level === 'easy' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-400 border-slate-200'}`}>Cơ Bản</button>
                <button type="button" onClick={() => setLevel('medium')} className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${level === 'medium' ? 'bg-sky-100 text-[#0284C7] border-sky-300' : 'bg-white text-slate-400 border-slate-200'}`}>Vận Dụng</button>
                <button type="button" onClick={() => setLevel('hard')} className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${level === 'hard' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-400 border-slate-200'}`}>Nâng Cao</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Tags (Cách nhau dấu phẩy):</label>
              <input 
                type="text" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold text-[#0284C7] shadow-inner"
                placeholder="#xacsuat, #oly"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProtectedLectureEditor() {
  return (
    <AuthGuard>
      <LectureCreatorPage />
    </AuthGuard>
  );
}