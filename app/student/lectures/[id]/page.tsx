'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
// Lưu ý: Nếu thư viện react-quill-new/dist/quill.snow.css chưa tự format đẹp, chúng ta có thể chèn thêm ở đây
import 'react-quill-new/dist/quill.snow.css'; 

// Giả định thầy đã có StudentGuard, nếu chưa có, thầy có thể đổi thành thẻ <div> bọc bình thường
import StudentGuard from '@/components/StudentGuard'; 

interface LectureData {
  title: string;
  chapter: string;
  level: string;
  content: string;
  status: string;
  createdAt: any;
}

function StudentLectureView() {
  const params = useParams();
  const router = useRouter();
  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectureDetail = async () => {
      if (!params.id) return;
      
      try {
        const docRef = doc(db, 'lectures', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as LectureData;
          // Chỉ cho phép học sinh xem bài đã "published"
          if (data.status === 'published') {
            setLecture(data);
          } else {
            alert('Bài giảng này đang được thầy cô bảo trì, em quay lại sau nhé!');
            router.push('/student');
          }
        } else {
          alert('Không tìm thấy bài giảng!');
          router.push('/student');
        }
      } catch (error) {
        console.error("Lỗi tải bài giảng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLectureDetail();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center">
        <div className="text-xl font-black text-sky-600 animate-pulse uppercase tracking-wider">
          Đang tải dữ liệu bài học...
        </div>
      </div>
    );
  }

  if (!lecture) return null;

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* NÚT QUAY LẠI & THÔNG TIN CHUNG */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/60 backdrop-blur-md text-sky-700 font-bold rounded-xl shadow hover:bg-white/80 transition-all text-xs uppercase"
          >
            ⬅ Quay lại danh sách
          </button>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
              {lecture.chapter}
            </span>
          </div>
        </div>

        {/* KHUNG HIỂN THỊ NỘI DUNG CHÍNH */}
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Hiệu ứng kính mờ trang trí */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100 rounded-full blur-3xl -z-10 opacity-60"></div>
          
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
            {lecture.title}
          </h1>
          
          <div className="flex gap-4 items-center mb-10 pb-6 border-b-2 border-sky-50">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              Phân loại: <span className="text-[#0284C7]">{lecture.level === 'hard' ? 'Nâng cao' : lecture.level === 'medium' ? 'Vận dụng' : 'Cơ bản'}</span>
            </span>
          </div>

          {/* VÙNG RENDER HTML (QUAN TRỌNG) */}
          <div 
            className="ql-editor prose prose-slate max-w-none prose-headings:font-black prose-headings:text-[#0284C7] prose-a:text-sky-600 prose-img:rounded-2xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: lecture.content }}
          />
        </div>

        {/* NÚT TƯƠNG TÁC CUỐI BÀI */}
        <div className="flex justify-end pt-4">
          <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-extrabold rounded-2xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all text-sm uppercase tracking-wider flex items-center gap-2">
            <span>✅ Đã học xong</span>
          </button>
        </div>

      </div>
    </main>
  );
}

export default function ProtectedStudentLecture() {
  return (
    <StudentGuard>
      <StudentLectureView />
    </StudentGuard>
  );
}