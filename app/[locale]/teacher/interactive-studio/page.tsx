'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SandboxIframe from '@/components/SandboxIframe';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function InteractiveStudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModule, setGeneratedModule] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedModule(null);
    try {
      const response = await fetch('/api/generate-interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Parse JSON response from AI
      let parsedData = data.result;
      if (typeof parsedData === 'string') {
        // Handle markdown json block if AI returns it wrapped
        parsedData = parsedData.replace(/```json\n?|\n?```/g, '');
        parsedData = JSON.parse(parsedData);
      }
      
      setGeneratedModule(parsedData);
    } catch (error) {
      console.error('Lỗi khi tạo module:', error);
      alert('Không thể tạo module học tập lúc này. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedModule) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'interactive_modules'), {
        ...generatedModule,
        createdBy: 'teacher_system', // In real app, get from auth
        createdAt: serverTimestamp(),
      });
      alert(`Đã lưu thành công Module ID: ${docRef.id}`);
    } catch (error) {
      console.error('Lỗi lưu module:', error);
      alert('Không thể lưu module.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 pt-24 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-full gap-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              Interactive Studio (Khôn Gian Sáng Tạo)
            </h1>
            <p className="text-gray-300">Nhập ý tưởng và AI sẽ thiết kế ngay một Mini-game hoặc Bài học tương tác.</p>
          </div>
          <button 
            onClick={() => router.push('/teacher/dashboard')}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10"
          >
            Quay Lại
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left panel - Prompt Input */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 flex flex-col gap-4"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex-1 flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-blue-200">Ý tưởng của bạn</h2>
              <textarea
                className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[200px]"
                placeholder="Ví dụ: Tạo một trò chơi điền số tính xác suất trúng thưởng vòng quay Roulette. Giao diện Tailwind dark mode sinh động. Bối cảnh Casino. Có 3 câu hỏi độ khó tăng dần..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`mt-4 w-full py-3 rounded-xl font-bold transition-all ${
                  isGenerating || !prompt.trim() 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                }`}
              >
                {isGenerating ? 'AI đang thiết kế...' : 'Tạo Module Bằng AI'}
              </button>
            </div>
            
            {/* Context/Knowledge Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl">
              <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <i className="fa-solid fa-brain"></i> AI Capabilities
              </h3>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Tự động tìm kiếm Web (Real-world data)</li>
                <li>Phát sinh mảng dữ liệu logic</li>
                <li>Thiết kế UI bằng Tailwind CSS</li>
              </ul>
            </div>
          </motion.div>

          {/* Right panel - Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 flex flex-col gap-4"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex-1 flex flex-col relative min-h-[600px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-emerald-300">Live Preview</h2>
                {generatedModule && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40 rounded-lg transition-all text-sm font-bold"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu vào Thư Viện'}
                  </button>
                )}
              </div>
              
              <div className="flex-1 bg-black/50 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="animate-pulse">Gemini đang phân tích và viết code (HTML/Tailwind/JS)...</p>
                  </div>
                ) : generatedModule ? (
                  <SandboxIframe 
                    htmlContent={generatedModule.htmlContent}
                    scriptContent={generatedModule.scriptContent}
                    dataArrays={generatedModule.dataArrays}
                    onComplete={(score, payload) => {
                      alert(`Test Module Complete! Score: ${score}, Payload: ${JSON.stringify(payload)}`);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <p>Kết quả thiết kế sẽ hiển thị tại đây.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
