'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, getDoc, doc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  type: 'MCQ' | 'TF' | 'SA';
  question: string;
  level: string;
  options?: { A: string; B: string; C: string; D: string };
  correctAnswer?: any;
  statements?: any[];
}

export default function StudentExamRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = searchParams.get('pin');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2700);

  // Thông tin định danh học sinh
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('10A1');

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [finalScore, setFinalScore] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    if (!pin) {
      alert("Thiếu mã đấu trường!");
      router.push('/student/exams');
      return;
    }

    // Lấy thông tin từ session
    const sessionStr = localStorage.getItem('student_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setStudentId(session.studentId || '');
      setStudentName(session.fullName || '');
      setStudentClass(session.classroom || '10A1');
    }

    const loadExamQuestions = async () => {
      try {
        // Tạm thời lấy tất cả câu hỏi từ cauhoi_nganhang, sau này có thể query theo sourceId từ bảng arenas
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
  }, [pin, router]);

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
    if (!studentName.trim() || !studentId.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin trước khi làm bài!');
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
    
    // Gamification Logic: Score * 10 = Arena Points
    const expPoints = Math.round(score * 10);
    setEarnedPoints(expPoints);

    try {
      // 1. Lưu bài làm
      await addDoc(collection(db, 'exam_results'), {
        studentId: studentId.trim().toUpperCase(),
        studentName: studentName.trim(),
        studentClass: studentClass,
        score: score,
        arenaPin: pin,
        totalQuestions: questions.length,
        submittedAt: serverTimestamp()
      });

      // 2. Cộng điểm kinh nghiệm và huy hiệu vào profile học sinh
      if (studentId) {
        const studentRef = doc(db, 'students', studentId.toUpperCase());
        const studentDoc = await getDoc(studentRef);
        
        const newBadges = [];
        if (score === 10) {
           newBadges.push('PERFECT_SCORE');
        } else if (score >= 8) {
           newBadges.push('EXCELLENT');
        }

        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          if (!studentData.badges || studentData.badges.length === 0) {
             newBadges.push('FIRST_BLOOD');
          }

          const updateData: any = {
            arenaPoints: increment(expPoints)
          };

          if (newBadges.length > 0) {
            updateData.badges = arrayUnion(...newBadges);
          }

          await updateDoc(studentRef, updateData);
        } else {
           newBadges.push('FIRST_BLOOD');
           await setDoc(studentRef, {
             fullName: studentName.trim(),
             classroom: studentClass,
             arenaPoints: expPoints,
             badges: newBadges,
             createdAt: serverTimestamp()
           });
        }
      }
    } catch (error) {
      console.error("Lỗi đồng bộ kết quả:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E0F2FE] dark:bg-slate-950">
        <div className="text-orange-500 font-bold animate-pulse text-xl uppercase tracking-widest">Đang tải đấu trường...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#E0F2FE] dark:bg-slate-950 p-4 md:p-8 text-slate-700 flex flex-col items-center transition-colors">
      <div className="max-w-5xl w-full space-y-6">
        
        {!isStarted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] shadow-2xl max-w-xl mx-auto mt-12"
          >
            <h2 className="text-3xl font-black text-orange-500 text-center uppercase tracking-wide mb-2">Phòng Thi #{pin}</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6 font-bold text-sm">Hãy kiểm tra thông tin trước khi bắt đầu</p>
            
            <div className="space-y-4 bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5 pl-1">Mã Học Sinh:</label>
                <input 
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5 pl-1">Họ và Tên:</label>
                <input 
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5 pl-1">Lớp:</label>
                <select 
                  value={studentClass} 
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="10A1">Lớp 10A1</option><option value="10A2">Lớp 10A2</option>
                  <option value="11A1">Lớp 11A1</option><option value="11A2">Lớp 11A2</option>
                  <option value="12A1">Lớp 12A1</option><option value="12A2">Lớp 12A2</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-4 mt-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-[0_5px_0_0_#EA580C] active:translate-y-1 active:shadow-[0_0px_0_0_#EA580C] transition-all text-sm uppercase tracking-widest"
            >
              🚀 Bắt Đầu Chiến Đấu
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 space-y-6">
              {questions.map((q, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={q.id} 
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-xl space-y-4"
                >
                  <span className="text-xs font-black text-white bg-orange-500 px-3 py-1.5 rounded-lg uppercase">Câu {idx + 1} — {q.level}</span>
                  <div className="text-slate-800 dark:text-slate-200 font-medium text-sm p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto shadow-inner">
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
                            className={`p-3 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-center gap-3 ${isSelected ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-500' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                          >
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{key}</span>
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
                          <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-3 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 gap-4">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed"><span className="font-black text-orange-500 mr-2 text-sm">{st.id})</span> {st.text}</span>
                            <div className="flex gap-2 shrink-0">
                              <button disabled={isSubmitted} onClick={() => handleSelectAnswer(q.id, true, 'TF', st.id)} className={`px-5 py-2 text-[10px] font-black rounded-xl border-2 transition-colors ${currentAns === true ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-700 border-transparent hover:border-emerald-300'}`}>ĐÚNG</button>
                              <button disabled={isSubmitted} onClick={() => handleSelectAnswer(q.id, false, 'TF', st.id)} className={`px-5 py-2 text-[10px] font-black rounded-xl border-2 transition-colors ${currentAns === false ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50 dark:bg-slate-700 border-transparent hover:border-rose-300'}`}>SAI</button>
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
                        className="w-full md:w-1/2 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="space-y-6 lg:sticky lg:top-6">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl text-center space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Thời gian còn lại</span>
                <span className={`text-4xl font-mono font-black ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
                  {formatTime(timeLeft)}
                </span>
                
                {!isSubmitted ? (
                  <button onClick={handleSubmitExam} className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-[0_5px_0_0_#EA580C] active:translate-y-1 active:shadow-[0_0px_0_0_#EA580C] transition-all uppercase tracking-widest text-sm">
                    📥 Nộp Bài Ngay
                  </button>
                ) : (
                  <button onClick={() => router.push('/student/home')} className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-300 transition-colors">
                    Trở về Trang Chủ
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-3xl shadow-2xl"
                  >
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.4rem] text-center space-y-4">
                      <span className="text-4xl block">🏆</span>
                      <span className="text-xs font-black text-orange-500 uppercase tracking-widest block">Kết quả đấu trường</span>
                      <div className="text-5xl font-black text-slate-800 dark:text-white font-mono">{finalScore} <span className="text-xl text-slate-400 font-normal">/ 10</span></div>
                      
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Kinh nghiệm nhận được</p>
                        <p className="text-2xl font-black text-yellow-500">+ {earnedPoints} EXP</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
