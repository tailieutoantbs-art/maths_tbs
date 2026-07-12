'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider'; // Bổ sung sử dụng Toast

interface DocumentFile {
  id: string;
  title: string;
  grade: string;
  url: string;
  fileType: string;
  createdAt: any;
}

const GRADES = ['6', '7', '8', '9', '10', '11', '12', 'Luyện thi THPT'];

function DocumentsManagementPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast(); // Kích hoạt Hook thông báo
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterGrade, setFilterGrade] = useState('ALL');

  const [docTitle, setDocTitle] = useState('');
  const [docGrade, setDocGrade] = useState('12');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: DocumentFile[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as DocumentFile);
      });
      setDocuments(data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Lỗi đồng bộ danh mục file!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!docTitle.trim()) {
      showToast('warning', 'Thầy vui lòng điền tên tài liệu trước nhé!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    showToast('info', 'Hệ thống bắt đầu tải dữ liệu lên Cloudinary...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'TAILIEUTBS');

    try {
      const cloudName = 'dlqjlzekw';
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        await addDoc(collection(db, 'documents'), {
          title: docTitle,
          grade: docGrade,
          url: data.secure_url,
          fileType: data.format || file.name.split('.').pop() || 'document',
          createdAt: serverTimestamp(),
        });

        showToast('success', 'Đã lưu trữ tài liệu số thành công!');
        setDocTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        throw new Error();
      }
    } catch (error) {
      showToast('error', 'Tải file lên trục trặc, vui lòng kiểm tra lại!');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Thầy có chắc chắn muốn gỡ tài liệu này không?")) {
      try {
        await deleteDoc(doc(db, 'documents', id));
        showToast('success', 'Đã xóa tài liệu khỏi hệ thống!');
        fetchDocuments();
      } catch (error) {
        showToast('error', 'Xóa tài liệu thất bại.');
      }
    }
  };

  const filteredDocs = filterGrade === 'ALL' ? documents : documents.filter(d => d.grade === filterGrade);

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">Kho Tài Liệu Số</h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Lưu trữ giáo án, chuyên đề và đề thi gốc Toán TBS</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase shadow-sm">⬅ Về Dashboard</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4 sticky top-6">
              <h3 className="text-sm font-black text-[#0284C7] uppercase tracking-wider border-b border-sky-100 pb-3">📤 Tải Lên Tài Liệu Mới</h3>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Tên Tài Liệu:</label>
                <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="VD: Chuyên đề Hình Oxyz..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm font-bold shadow-inner" disabled={uploading} />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Thuộc Khối / Chuyên mục:</label>
                <select value={docGrade} onChange={(e) => setDocGrade(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-inner focus:outline-none" disabled={uploading}>
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g === 'Luyện thi THPT' ? g : `Khối lớp ${g}`}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.tex,.zip,.rar" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all text-xs uppercase tracking-wider disabled:opacity-60 flex justify-center items-center">
                  {uploading ? '⏳ Đang truyền dữ liệu...' : '📁 Chọn File & Tải Lên'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-sm flex overflow-x-auto gap-2 scrollbar-hide">
              <button onClick={() => setFilterGrade('ALL')} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all border ${filterGrade === 'ALL' ? 'bg-[#0284C7] text-white border-[#0284C7]' : 'bg-white text-slate-500 border-slate-200'}`}>Tất cả</button>
              {GRADES.map(g => (
                <button key={g} onClick={() => setFilterGrade(g)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all border ${filterGrade === g ? 'bg-[#0284C7] text-white border-[#0284C7]' : 'bg-white text-slate-500 border-slate-200'}`}>{g === 'Luyện thi THPT' ? g : `Khối ${g}`}</button>
              ))}
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-xl min-h-[400px]">
              {loading ? (
                <div className="text-center py-12 text-sky-600 font-bold animate-pulse text-xs uppercase">Đang đồng bộ dữ liệu tài liệu...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">Chưa có tài liệu nào thuộc chuyên mục này.</div>
              ) : (
                <div className="space-y-3">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center font-black text-xs uppercase shrink-0">{doc.fileType.substring(0, 3)}</div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-bold text-slate-700 group-hover:text-[#0284C7] transition-colors line-clamp-1">{doc.title}</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{doc.grade === 'Luyện thi THPT' ? 'Luyện thi THPT' : `Khối ${doc.grade}`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sky-50 text-[#0284C7] font-bold rounded-xl text-xs hover:bg-sky-100">Tải Về</a>
                        <button onClick={() => handleDelete(doc.id)} className="px-3 py-2 bg-rose-50 text-rose-500 font-bold rounded-xl text-xs hover:bg-rose-100">Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function ProtectedDocumentsPage() {
  return (
    <AuthGuard>
      <DocumentsManagementPage />
    </AuthGuard>
  );
}