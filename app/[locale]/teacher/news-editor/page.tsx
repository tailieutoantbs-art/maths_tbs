'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewsEditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng điền đủ tiêu đề và nội dung.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'news_posts'), {
        title,
        content,
        imageUrl: imageUrl.trim() || null,
        author: 'Admin', // In real app, get from auth session
        createdAt: serverTimestamp(),
        likesCount: 0
      });
      alert("Đăng bản tin thành công!");
      router.push('/'); // Về trang chủ để xem
    } catch (error) {
      console.error("Lỗi đăng bài:", error);
      alert("Không thể đăng bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-24 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800">Soạn Bản Tin Mới</h1>
          <button 
            onClick={() => router.push('/teacher/dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          >
            Hủy / Quay Lại
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu Đề Bản Tin *</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="Nhập tiêu đề hấp dẫn..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Đường Dẫn Hình Ảnh (URL - Tùy chọn)</label>
            <input 
              type="url" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <div className="mt-4 rounded-xl overflow-hidden max-h-48 bg-slate-100 border border-slate-200 flex justify-center">
                <img src={imageUrl} alt="Preview" className="object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nội Dung Chính *</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              placeholder="Viết nội dung bản tin ở đây (hỗ trợ HTML cơ bản: <b>in đậm</b>, <i>in nghiêng</i>)..."
              required
            ></textarea>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all ${
              isSubmitting ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 shadow-[0_4px_0_0_#0284c7] active:translate-y-1 active:shadow-none'
            }`}
          >
            {isSubmitting ? 'Đang đăng bài...' : 'Đăng Lên Cổng Thông Tin'}
          </button>
        </form>
      </div>
    </div>
  );
}
