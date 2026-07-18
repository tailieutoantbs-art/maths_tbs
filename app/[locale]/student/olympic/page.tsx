'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentGuard from '@/components/StudentGuard';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function StudentOlympicPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Fetch latest 20 questions for self-practice
        const q = query(
          collection(db, 'olympic_nganhang'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(data);
      } catch (error) {
        console.error("Lỗi khi tải câu hỏi Olympic:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const toggleSolution = (id: string) => {
    setShowSolution(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <StudentGuard>
      <div className="min-h-screen bg-[#eaf4fb] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide">Đấu Trường Olympic</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Luyện tập các câu hỏi nâng cao từ Ngân hàng đề</p>
            </div>
            <Link href="/student" className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors">
              ⬅ Quay lại
            </Link>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-center items-center h-40">
                <p className="text-slate-400 font-bold animate-pulse">Đang tải câu hỏi...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center h-40 text-center">
                <span className="text-4xl mb-2">🏆</span>
                <p className="text-slate-500 font-bold">Chưa có câu hỏi nào trong ngân hàng đề.</p>
              </div>
            ) : (
              questions.map((q, index) => (
                <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-orange-50 border-b border-orange-100 p-4 px-6 flex justify-between items-center">
                    <span className="text-orange-600 font-black text-xs uppercase tracking-widest">
                      Câu hỏi #{index + 1}
                    </span>
                    {q.topic && (
                      <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 shadow-sm">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <article className="prose prose-sm max-w-none text-slate-700">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {q.latexCode || q.content || 'Nội dung trống'}
                      </ReactMarkdown>
                    </article>
                    
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <button 
                        onClick={() => toggleSolution(q.id)}
                        className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase transition-colors hover:bg-slate-700"
                      >
                        {showSolution[q.id] ? 'Ẩn Lời Giải' : 'Xem Hướng Dẫn Giải'}
                      </button>
                      
                      {showSolution[q.id] && (
                        <div className="mt-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">Gợi ý / Lời giải:</h4>
                          <article className="prose prose-sm max-w-none text-slate-700">
                            {q.solution ? (
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {q.solution}
                              </ReactMarkdown>
                            ) : (
                              <p className="italic text-slate-500">Lời giải chi tiết sẽ nằm trong thẻ \begin&#123;solution&#125; của mã LaTeX nếu được sinh tự động. Xin hãy đọc nội dung phía trên.</p>
                            )}
                          </article>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </StudentGuard>
  );
}
