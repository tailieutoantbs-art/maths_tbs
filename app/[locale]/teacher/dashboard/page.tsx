'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface StudentData {
  id: string;
  name: string;
  classId: string;
  className: string;
  score: number; // Average score
}

interface ClassData {
  id: string;
  name: string;
  students: number;
  avgScore: number;
}

export default function TeacherDashboard() {
  const t = useTranslations('TeacherDashboard');
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  
  const [studentsList, setStudentsList] = useState<StudentData[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const examsSnap = await getDocs(collection(db, 'exam_results'));
        
        const rawStudents: any[] = [];
        studentsSnap.forEach((doc) => {
          rawStudents.push({ id: doc.id, ...doc.data() });
        });

        const rawExams: any[] = [];
        examsSnap.forEach((doc) => {
          rawExams.push({ id: doc.id, ...doc.data() });
        });

        const classMap: Record<string, { count: number; totalScores: number; examCount: number }> = {};
        
        const parsedStudents: StudentData[] = rawStudents.map((s) => {
          const sClass = s.classroom || s.class || 'Unknown';
          const sName = s.fullName || s.name || 'Không tên';
          
          if (!classMap[sClass]) {
            classMap[sClass] = { count: 0, totalScores: 0, examCount: 0 };
          }
          classMap[sClass].count += 1;

          // Find exams for this student
          const studentExams = rawExams.filter(
            (ex) => ex.studentName === sName && ex.studentClass === sClass
          );

          let studentAvgScore = 0;
          if (studentExams.length > 0) {
            const total = studentExams.reduce((acc, curr) => acc + (curr.score || 0), 0);
            studentAvgScore = total / studentExams.length;
            classMap[sClass].totalScores += total;
            classMap[sClass].examCount += studentExams.length;
          }

          return {
            id: s.studentId || s.id || 'Unknown',
            name: sName,
            classId: sClass,
            className: sClass,
            score: studentAvgScore,
          };
        });

        const parsedClasses: ClassData[] = Object.keys(classMap).map((cName) => {
          const cData = classMap[cName];
          return {
            id: cName,
            name: cName,
            students: cData.count,
            avgScore: cData.examCount > 0 ? Number((cData.totalScores / cData.examCount).toFixed(1)) : 0,
          };
        }).sort((a, b) => a.name.localeCompare(b.name));

        setStudentsList(parsedStudents);
        setClassesList(parsedClasses);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = studentsList.filter(student => {
    const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClass === 'All' || student.classId === selectedClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 pt-24 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-300 text-lg">{t('subtitle')}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 justify-end">
            <button onClick={() => router.push('/teacher/news-editor')} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              Đăng Bản Tin
            </button>
            <button onClick={() => router.push('/teacher/interactive-studio')} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              Interactive Studio (Mới)
            </button>
            <button onClick={() => router.push('/teacher/bank')} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              Ngân Hàng Đề Thi
            </button>
            <button onClick={() => router.push('/')} className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              {t('logout')}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions / Class List - Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-pink-500/30 p-6 rounded-3xl shadow-2xl">
              <h2 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-bullhorn"></i> Quản Lý Cổng Thông Tin
              </h2>
              <p className="text-sm text-gray-300 mb-6">Đăng tải thông báo, sự kiện mới lên trang chủ để học sinh và phụ huynh cập nhật.</p>
              <button 
                onClick={() => router.push('/teacher/news-editor')} 
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              >
                + Soạn Bản Tin Mới
              </button>
            </div>

            {/* Class List Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{t('classesTitle')}</h2>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-gray-400">Đang tải dữ liệu...</div>
              ) : (
                <div className="space-y-4">
                  <div 
                    onClick={() => setSelectedClass('All')}
                    className={`p-4 rounded-2xl cursor-pointer transition-all ${selectedClass === 'All' ? 'bg-gradient-to-r from-blue-600/50 to-purple-600/50 border border-blue-400/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <h3 className="font-semibold text-lg">{t('classFilter')}</h3>
                  </div>
                  {classesList.map((cls) => (
                    <div 
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${selectedClass === cls.id ? 'bg-gradient-to-r from-blue-600/50 to-purple-600/50 border border-blue-400/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                    >
                      <div>
                        <h3 className="font-bold text-xl text-blue-200">{cls.name}</h3>
                        <p className="text-sm text-gray-400">{cls.students} học sinh</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400">{cls.avgScore}</div>
                        <div className="text-xs text-gray-400">Điểm TB</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Student List - Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-white">{t('studentsTitle')}</h2>
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder={t('searchStudent')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-20 text-gray-400">Đang tải dữ liệu học sinh...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="py-3 px-4 font-medium">Họ và Tên</th>
                        <th className="py-3 px-4 font-medium">Lớp</th>
                        <th className="py-3 px-4 font-medium">Điểm TB</th>
                        <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, index) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * Math.min(index, 20) }}
                            key={student.id} 
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-4 font-semibold text-white">{student.name}</td>
                            <td className="py-4 px-4 text-blue-300">{student.className}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-lg text-sm font-bold ${student.score >= 8.0 ? 'bg-emerald-500/20 text-emerald-400' : student.score >= 6.5 ? 'bg-yellow-500/20 text-yellow-400' : student.score === 0 ? 'bg-slate-500/20 text-slate-400' : 'bg-red-500/20 text-red-400'}`}>
                                {student.score === 0 ? 'Chưa thi' : student.score.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                                {t('actionView')}
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            Không tìm thấy học sinh nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
