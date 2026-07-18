'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface BankItem {
  id: string;
  pdfUrl?: string;
  result: string;
  timestamp: any;
  topic?: string;
}

export default function TeacherBankPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const [bankItems, setBankItems] = useState<BankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreatingArena, setIsCreatingArena] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('Nhận biết');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBankData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'olympic_nganhang'));
      const items: BankItem[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as BankItem);
      });
      
      // Sort by timestamp desc
      items.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setBankItems(items);
    } catch (error) {
      console.error("Lỗi khi tải ngân hàng đề:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, []);

  const handleCreateArena = async (item: BankItem) => {
    setIsCreatingArena(true);
    try {
      // Generate 6 digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      await addDoc(collection(db, 'arenas'), {
        pinCode: pin,
        content: item.result,
        sourceId: item.id,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      
      setGeneratedPin(pin);
    } catch (error) {
      console.error("Lỗi tạo đấu trường:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsCreatingArena(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      alert('Vui lòng nhập chủ đề!');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          level: aiLevel,
          count: aiCount,
          locale: locale
        })
      });

      const data = await res.json();
      if (res.ok && data.result) {
        // Lưu thẳng vào Firebase
        await addDoc(collection(db, 'olympic_nganhang'), {
          title: `Sinh tự động: ${aiTopic}`,
          topic: aiTopic,
          result: data.result,
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp(),
          source: 'AI Assistant'
        });

        alert('Đã sinh bộ câu hỏi thành công và lưu vào Ngân hàng!');
        setShowAiModal(false);
        setAiTopic('');
        fetchBankData(); // Refresh list
      } else {
        throw new Error(data.error || 'Gặp sự cố khi sinh câu hỏi.');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Lỗi kết nối API AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPin) {
      navigator.clipboard.writeText(generatedPin);
      alert('Đã sao chép mã!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 pt-24 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
              Ngân Hàng Đề Thi
            </h1>
            <p className="text-gray-300 text-lg">Quản lý kho tàng câu hỏi và tạo Đấu trường trực tuyến</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => router.push('/teacher/dashboard')} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all">
              Trở về Dashboard
            </button>
            <button onClick={() => router.push('/plan-assistant')} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all">
              Trích Xuất PDF
            </button>
            <button 
              onClick={() => setShowAiModal(true)} 
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center gap-2"
            >
              <span>Tạo Câu Hỏi Bằng AI</span>
              <span>🤖</span>
            </button>
          </div>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl min-h-[500px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : bankItems.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">🗂️</span>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Ngân hàng trống</h3>
              <p className="text-gray-500">Chưa có đề thi nào được trích xuất. Hãy dùng công cụ PDF to LaTeX hoặc AI để thêm đề thi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankItems.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.id} 
                  className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 transition-all group relative overflow-hidden flex flex-col h-[250px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-[100px] -z-10 group-hover:bg-orange-500/20 transition-all"></div>
                  
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="text-4xl">📄</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-gray-400 bg-black/20 px-3 py-1 rounded-full whitespace-nowrap">
                        {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                      {item.topic && (
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                          {item.topic}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl text-white mb-2 line-clamp-2">
                    Tài liệu #{item.id.slice(-6).toUpperCase()}
                  </h3>
                  
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1 font-mono text-[10px]">
                    {item.result?.substring(0, 150)}...
                  </p>
                  
                  <button 
                    onClick={() => handleCreateArena(item)}
                    disabled={isCreatingArena}
                    className="w-full py-3 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:text-orange-300 font-bold rounded-xl border border-orange-500/50 transition-all active:scale-95"
                  >
                    Khởi Tạo Đấu Trường
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-slate-800 relative"
            >
              <h2 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                AI Sinh Câu Hỏi 🤖
              </h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-6">
                Tự động tạo câu hỏi trắc nghiệm Toán chuẩn LaTeX
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase mb-2">Chủ đề / Từ khóa</label>
                  <input 
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="VD: Cực trị hàm số bậc 3"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-2">Mức độ</label>
                    <select 
                      value={aiLevel} 
                      onChange={e => setAiLevel(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                      disabled={isGenerating}
                    >
                      <option>Nhận biết</option>
                      <option>Thông hiểu</option>
                      <option>Vận dụng</option>
                      <option>Vận dụng cao</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-2">Số lượng</label>
                    <input 
                      type="number"
                      min={1}
                      max={10}
                      value={aiCount}
                      onChange={e => setAiCount(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowAiModal(false)}
                    disabled={isGenerating}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang sáng tác...</span>
                      </>
                    ) : (
                      'Bắt Đầu Sinh Đề'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pin Code Modal */}
      <AnimatePresence>
        {generatedPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-orange-500/50 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(249,115,22,0.3)] max-w-lg w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent animate-spin-slow pointer-events-none"></div>
              
              <div className="relative z-10">
                <span className="text-6xl mb-6 block animate-bounce">🔥</span>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Mã Đấu Trường</h2>
                <p className="text-gray-400 mb-8">Hãy gửi mã này cho học sinh để bắt đầu làm bài</p>
                
                <div onClick={copyToClipboard} className="bg-black/50 border-2 border-orange-500 rounded-3xl p-6 mb-8 transform hover:scale-105 transition-transform cursor-pointer group">
                  <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 tracking-widest group-hover:from-orange-300 group-hover:to-amber-200 transition-colors text-center font-mono">
                    {generatedPin}
                  </p>
                  <p className="text-xs text-orange-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-widest">
                    Nhấn để sao chép
                  </p>
                </div>

                <button 
                  onClick={() => setGeneratedPin(null)}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors uppercase tracking-wider text-sm"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

