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

const colorThemes = {
  cosmic: {
    isDark: true,
    bgClass: "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
    cardBg: "bg-white/5 border-white/10 hover:bg-white/10",
    textMain: "text-white",
    textSub: "text-purple-200",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400",
  },
  oceanic: {
    isDark: false,
    bgClass: "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100",
    cardBg: "bg-white/60 border-white/40 hover:bg-white/80",
    textMain: "text-slate-800",
    textSub: "text-slate-600",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600",
  },
  sunset: {
    isDark: false,
    bgClass: "bg-gradient-to-br from-orange-100 via-rose-50 to-amber-100",
    cardBg: "bg-white/60 border-white/40 hover:bg-white/80",
    textMain: "text-slate-800",
    textSub: "text-rose-600",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600",
  },
  emerald: {
    isDark: true,
    bgClass: "bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900",
    cardBg: "bg-white/5 border-white/10 hover:bg-white/10",
    textMain: "text-white",
    textSub: "text-emerald-200",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400",
  },
  minimal: {
    isDark: false,
    bgClass: "bg-slate-100",
    cardBg: "bg-white/80 border-slate-200 hover:bg-white",
    textMain: "text-slate-800",
    textSub: "text-slate-500",
    accentText: "text-slate-800",
  }
};
type ThemeKey = keyof typeof colorThemes;

export default function TeacherDashboard() {
  const t = useTranslations('TeacherDashboard');
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  
  const [studentsList, setStudentsList] = useState<StudentData[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('oceanic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dashboard_theme') as ThemeKey;
    if (saved && colorThemes[saved]) {
      setActiveTheme(saved);
    }
  }, []);

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

  const theme = colorThemes[activeTheme] || colorThemes.oceanic;

  if (!mounted) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className={`min-h-screen ${theme.bgClass} p-6 pt-24 font-sans relative overflow-hidden transition-colors duration-700`}>
      {/* Background Orbs */}
      {theme.isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
        </>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4"
        >
          <div>
            <h1 className={`text-4xl md:text-5xl font-extrabold mb-2 ${theme.accentText}`}>
              {t('title')}
            </h1>
            <p className={`text-lg font-medium ${theme.textSub}`}>{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs shadow-md">
              ⬅ Về Dashboard
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
            {/* Class List Card */}
            <div className={`${theme.cardBg} backdrop-blur-xl border p-6 rounded-3xl shadow-xl transition-colors`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t('classesTitle')}</h2>
              </div>

              {isLoading ? (
                <div className={`text-center py-10 ${theme.textSub}`}>Đang tải dữ liệu...</div>
              ) : (
                <div className="space-y-4">
                  <div 
                    onClick={() => setSelectedClass('All')}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedClass === 'All' ? 'bg-blue-500/10 border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent ' + theme.textSub}`}
                  >
                    <h3 className={`font-bold text-lg`}>{t('classFilter')}</h3>
                  </div>
                  {classesList.map((cls) => (
                    <div 
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border flex justify-between items-center ${selectedClass === cls.id ? 'bg-blue-500/10 border-blue-400' : 'border-transparent ' + theme.textMain}`}
                    >
                      <div>
                        <h3 className={`font-bold text-lg ${selectedClass === cls.id ? 'text-blue-600 dark:text-blue-400' : theme.textMain}`}>{cls.name}</h3>
                        <p className={`text-sm ${theme.textSub}`}>{cls.students} học sinh</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-500">{cls.avgScore}</div>
                        <div className={`text-xs ${theme.textSub}`}>Điểm TB</div>
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
            <div className={`${theme.cardBg} backdrop-blur-xl border p-6 rounded-3xl shadow-xl h-full transition-colors`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t('studentsTitle')}</h2>
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder={t('searchStudent')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full py-2 px-4 pl-10 ${theme.textMain} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              {isLoading ? (
                <div className={`text-center py-20 ${theme.textSub}`}>Đang tải dữ liệu học sinh...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b border-black/10 dark:border-white/10 ${theme.textSub}`}>
                        <th className="py-3 px-4 font-bold uppercase text-xs">Họ và Tên</th>
                        <th className="py-3 px-4 font-bold uppercase text-xs">Lớp</th>
                        <th className="py-3 px-4 font-bold uppercase text-xs">Điểm TB</th>
                        <th className="py-3 px-4 font-bold uppercase text-xs text-right">Thao tác</th>
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
                            className={`border-b border-black/5 dark:border-white/5 transition-colors ${theme.textMain}`}
                          >
                            <td className="py-4 px-4 font-bold">{student.name}</td>
                            <td className={`py-4 px-4 font-medium ${theme.textSub}`}>{student.className}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-lg text-sm font-bold ${student.score >= 8.0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : student.score >= 6.5 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : student.score === 0 ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                {student.score === 0 ? 'Chưa thi' : student.score.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button className="text-sm text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider">
                                {t('actionView')}
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={`py-8 text-center ${theme.textSub}`}>
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
