'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import SandboxIframe from '@/components/SandboxIframe';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ModuleExecutionPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  const [moduleData, setModuleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const docRef = doc(db, 'interactive_modules', moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setModuleData({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert('Không tìm thấy bài học này!');
          router.push('/student/mastery-space');
        }
      } catch (error) {
        console.error("Lỗi tải bài học:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (moduleId) fetchModule();
  }, [moduleId, router]);

  const handleModuleComplete = (finalScore: number, payload: any) => {
    setScore(finalScore);
    setIsCompleted(true);
    // In a real app, you would also save this score to the student's profile in Firebase
    console.log("Saving score to profile:", finalScore, payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!moduleData) return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-8 font-sans flex flex-col">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md"
      >
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">{moduleData.title}</h1>
          <p className="text-sm text-gray-400">{moduleData.topic}</p>
        </div>
        <button 
          onClick={() => router.push('/student/mastery-space')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-medium"
        >
          Thoát
        </button>
      </motion.div>

      {/* Execution Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col relative"
      >
        {isCompleted ? (
          <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-xl rounded-3xl border border-emerald-500/30 flex flex-col items-center justify-center z-20">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring" }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🏆</div>
              <h2 className="text-4xl font-black text-white mb-4">Nhiệm Vụ Hoàn Thành!</h2>
              <p className="text-2xl text-emerald-300 font-bold mb-8">Điểm số: {score}</p>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                >
                  Chơi lại
                </button>
                <button 
                  onClick={() => router.push('/student/mastery-space')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                  Nhận thưởng & Quay về
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}

        <div className={`flex-1 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all ${isCompleted ? 'opacity-30 pointer-events-none' : ''}`}>
          <SandboxIframe 
            htmlContent={moduleData.htmlContent}
            scriptContent={moduleData.scriptContent}
            dataArrays={moduleData.dataArrays}
            onComplete={handleModuleComplete}
          />
        </div>
      </motion.div>
    </div>
  );
}
