'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface Question {
  id: string;
  type: 'MCQ' | 'TF' | 'SA';
  question: string;
  level: string;
  options?: { A: string; B: string; C: string; D: string };
  correctAnswer?: any;
  statements?: any[];
}

export default function StudentExamPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2700);

  // Thông tin định danh học sinh
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('10A1');

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const loadExamQuestions = async () => {
      try {
        const q = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list: Question[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as any);
        });
        setQuestions(list);
      } catch (error) {
        console.error("Lỗi tải đề thi:", error);
      } finally {
        setLoading(false);
      }
    };
    loadExamQuestions();
  }, []);

  useEffect(() => {
    if (!isStarted || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId: string, value: any, type: 'MCQ' | 'TF' | 'SA', statementId?: string) => {
    if (isSubmitted) return;
    if (type === 'MCQ' || type === 'SA') {
      setAnswers((prev) => ({ ...prev, [qId]: value }));
    } else if (type === 'TF' && statementId) {
      setAnswers((prev) => {
        const currentQAnswers = prev[qId] || {};
        return { ...prev, [qId]: { ...currentQAnswers, [statementId]: value } };
      });
    }
  };

  const handleStartExam = () => {
    if (!studentName.trim()) {
      alert('Vui lòng nhập đầy đủ Họ và Tên trước khi làm bài!');
      return;
    }
    setIsStarted(true);
  };

  const handleAutoSubmit = () => {
    processGrading();
  };

  const handleSubmitExam = () => {
    if (window.confirm("Học sinh có chắc chắn muốn nộp bài khảo sát này không?")) {
      processGrading();
    }
  };

  // Hàm chấm điểm và gửi trực tiếp lên Firebase
  const processGrading = async () => {
    let totalCorrectPoints = 0;
    const pointsPerQuestion = 10 / (questions.length || 1);

    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (q.type === 'MCQ') {
        if (studentAns === q.correctAnswer) totalCorrectPoints += pointsPerQuestion;
      } else if (q.type === 'TF') {
        let correctStatementsCount = 0;
        q.statements?.forEach((st: any) => {
          if (studentAns?.[st.id] === st.correct) correctStatementsCount++;
        });
        totalCorrectPoints += (pointsPerQuestion * (correctStatementsCount / 4));
      } else if (q.type === 'SA') {
        if (studentAns?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase()) {
          totalCorrectPoints += pointsPerQuestion;
        }
      }
    });

    const score = Number(totalCorrectPoints.toFixed(2));
    setFinalScore(score);
    setIsSubmitted(true);

    // Đẩy kết quả lưu trữ thời gian thực lên Firebase
    try {
      await addDoc(collection(db, 'exam_results'), {
        studentName: studentName.trim(),
        studentClass: studentClass,
        score: score,
        totalQuestions: questions.length,
        submittedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Lỗi đồng bộ kết quả:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E0F2FE]">
        <div className="text-sky-600 font-bold animate-pulse text-sm uppercase tracking-widest">Đang tải cấu trúc đề thi...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700 flex flex-col items-center">
      <div className="max-w-5xl w-full space-y-6">
        
        {!isStarted ? (
          <div className="bg-white/70 backdrop-blur-md border border-white p-8 rounded-3xl shadow-xl space-y-6 max-w-xl mx-auto mt-12">
            <h2 className="text-2xl font-black text-[#0284C7] text-center uppercase tracking-wide">Khảo Sát Năng Lực Toán Học</h2>
            
            {/* KHỐI ĐỊNH DANH TÊN VÀ LỚP HỌC SINH */}
            <div className="space-y-4 bg-white/50 p-5 rounded-2xl border border-sky-100 shadow-inner">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Họ và Tên Học Sinh:</label>
                <input 
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nhập đầy đủ họ tên của em..."
                  className="w-full p-3 bg-white border border-sky-100 rounded-xl font-bold text-slate-700 focus:outline-none shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Lớp học hiện tại:</label>
                <select 
                  value={studentClass} 
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full p-3 bg-white border border-sky-100 rounded-xl font-bold text-slate-700 focus:outline-none"
                >
                  <option value="10A1">Lớp 10A1</option>
                  <option value="10A2">Lớp 10A2</option>
                  <option value="11A1">Lớp 11A1</option>
                  <option value="11A2">Lớp 11A2</option>
                  <option value="12A1">Lớp 12A1</option>
                  <option value="12A2">Lớp 12A2</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-black rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all text-xs uppercase tracking-widest"
            >
              Xác Nhận & Bắt Đầu Làm Bài 🚀
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-md space-y-4">
                  <span className="text-xs font-black text-white bg-[#0284C7] px-2.5 py-1 rounded-md uppercase">Câu {idx + 1} — {q.level}</span>
                  <div className="text-slate-800 font-medium text-sm p-4 bg-white rounded-xl shadow-inner text-center overflow-x-auto">
                    <BlockMath math={q.question || '\\text{Lỗi cấu trúc}'} />
                  </div>

                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {Object.entries(q.options).map(([key, value]) => {
                        const isSelected = answers[q.id] === key;
                        return (
                          <button
                            key={key}
                            disabled={isSubmitted}
                            onClick={() => handleSelectAnswer(q.id, key, 'MCQ')}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-3 ${isSelected ? 'bg-sky-100 text-[#0284C7] border-sky-400' : 'bg-white bg-white border-slate-200'}`}
                          >
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isSelected ? 'bg-[#0284C7] text-white' : 'bg-slate-100'}`}>{key}</span>
                            <span>{value}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'TF' && q.statements && (
                    <div className="space-y-3 pt-2">
                      {q.statements.map((st: any) => {
                        const currentAns = answers[q.id]?.[st.id];
                        return (
                          <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 px-4 rounded-xl border border-slate-100 gap-2">
                            <span className="text-xs font-bold text-slate-700"><span className="font-black text-[#0284C7] mr-1">{st.id})</span> {st.text}</span>
                            <div className="flex gap-1">
                              <button disabled={isSubmitted} onClick={() => handleSelectAnswer(q.id, true, 'TF', st.id)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg border ${currentAns === true ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50'}`}>ĐÚNG</button>
                              <button disabled={isSubmitted} onClick={() => handleSelectAnswer(q.id, false, 'TF', st.id)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg border ${currentAns === false ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50'}`}>SAI</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'SA' && (
                    <div className="pt-2">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value, 'SA')}
                        placeholder="Nhập kết quả số hoặc phân số..."
                        className="w-full md:w-1/2 p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6 lg:sticky lg:top-6">
              <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-3xl shadow-md text-center space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Thời gian còn lại</span>
                <span className="text-3xl font-mono font-black text-slate-700">{formatTime(timeLeft)}</span>
                
                {!isSubmitted ? (
                  <button onClick={handleSubmitExam} className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#059669]">📥 Nộp Bài Khảo Sát</button>
                ) : (
                  <button onClick={() => router.push('/dashboard')} className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase">Quay Về Workspace</button>
                )}
              </div>

              {isSubmitted && (
                <div className="bg-white border-2 border-emerald-500 p-6 rounded-3xl shadow-xl text-center space-y-2 bg-gradient-to-b from-emerald-50/50 to-white">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest block">Kết quả đạt được</span>
                  <div className="text-4xl font-black text-emerald-600 font-mono">{finalScore} <span className="text-sm text-slate-400 font-normal">/ 10</span></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hệ thống đã tự động lưu bảng điểm!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}