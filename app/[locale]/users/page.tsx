'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function UsersManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'monthly'>('students');

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const currentDate = new Date();
  const currentMonthStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [isClient, setIsClient] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load from Firebase on mount
  React.useEffect(() => {
    setIsClient(true);
    const session = localStorage.getItem('teacher_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.role === 'Admin') {
          setIsAdmin(true);
        }
      } catch (e) {}
    }

    const loadData = async () => {
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const stData = studentsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setStudents(stData as any[]);

        const teachersSnap = await getDocs(collection(db, 'teachers'));
        const tcData = teachersSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setTeachers(tcData as any[]);

        const evSnap = await getDocs(collection(db, 'evaluations'));
        const evData = evSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setEvaluations(evData as any[]);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    };
    loadData();
  }, []);

  // STATE: Quản lý Modal (Cửa sổ nổi)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // STATE: Biểu mẫu nhập liệu Học sinh
  const [studentForm, setStudentForm] = useState({
    id: '',
    name: '',
    gender: 'Nam',
    dob: '',
    class: '10A1',
    note: '',
    status: 'Đang học'
  });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // STATE: Biểu mẫu nhập liệu Giáo viên
  const [teacherForm, setTeacherForm] = useState({
    id: '',
    name: '',
    role: '',
    contractType: 'Cơ hữu',
    email: '',
    phone: '',
    experience: '',
    achievements: '',
    status: 'Đang công tác'
  });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // STATE: Biểu mẫu đánh giá chuyên môn
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    id: '',
    teacherId: '',
    teacherName: '',
    month: '',
    observation: '',
    progress: 'Đúng tiến độ',
    grading: 'Hoàn thành tốt',
    training: 'Không',
    rating: 'A',
    note: ''
  });

  // Xử lý tạo và tải xuống File Mẫu (CSV Template)
  const handleDownloadTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Thêm BOM để Excel đọc tiếng Việt không bị lỗi font

    if (activeTab === 'students') {
      csvContent += "Mã HS,Họ và Tên,Giới tính (Nam/Nữ),Ngày sinh (DD/MM/YYYY),Lớp,Ghi chú\n";
      csvContent += "HS26003,Nguyễn Văn A,Nam,01/01/2010,10A1,Lớp trưởng\n";
    } else {
      csvContent += "Mã GV,Họ và Tên,Chức vụ,Diện hợp đồng (Cơ hữu/Thỉnh giảng),Email,Số điện thoại,Thâm niên,Thành tích\n";
      csvContent += "GV003,Trần Thị B,Giáo viên Toán,Cơ hữu,gv.b@thanhbinh.edu.vn,0901234567,5 năm,GVG Cấp Trường\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", activeTab === 'students' ? "Mau_Nhap_Hoc_Sinh_TBS.csv" : "Mau_Nhap_Giao_Vien_TBS.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', `Đã tải xuống file mẫu nhập liệu ${activeTab === 'students' ? 'Học sinh' : 'Giáo viên'}!`);
  };

  // Xử lý Import Excel thực tế
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('info', `Đang đọc dữ liệu từ file: ${file.name}...`);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Sử dụng { raw: false } để các ô định dạng Date/Number trong Excel được đọc ra dưới dạng chuỗi hiển thị đúng (vd: 01/01/2010 thay vì 40179)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

        if (activeTab === 'students') {
          const newStudents = jsonData.map((row: any) => {
            const studentClass = String(row['Lớp'] || '10A1');
            return {
              id: row['Mã HS'] ? String(row['Mã HS']) : `HS${Math.floor(10000 + Math.random() * 90000)}`,
              name: row['Họ và Tên'] || '',
              gender: row['Giới tính (Nam/Nữ)'] || 'Nam',
              dob: row['Ngày sinh (DD/MM/YYYY)'] || '',
              class: studentClass,
              defaultPass: `Tbs@${studentClass.toLowerCase()}`,
              passChanged: false,
              status: 'Đang học',
              note: row['Ghi chú'] || ''
            };
          }).filter(hs => hs.name); // Chỉ lấy những dòng có tên

          if (newStudents.length > 0) {
            setStudents(prev => {
              const prevMap = new Map(prev.map(s => [s.id, s]));
              newStudents.forEach(newS => {
                if (prevMap.has(newS.id)) {
                  // Cập nhật thông tin nếu đã tồn tại
                  prevMap.set(newS.id, { ...prevMap.get(newS.id), ...newS, passChanged: prevMap.get(newS.id).passChanged });
                } else {
                  // Thêm mới nếu chưa có
                  prevMap.set(newS.id, newS);
                }
              });
              // Đưa các học sinh mới thêm/cập nhật lên đầu danh sách
              const updatedList = Array.from(prevMap.values());
              updatedList.sort((a, b) => newStudents.some(s => s.id === a.id) ? -1 : 1);
              return updatedList;
            });
            for (const s of newStudents) {
              await setDoc(doc(db, 'students', s.id), s, { merge: true });
            }
            showToast('success', `Đã nhập và cập nhật dữ liệu học sinh thành công!`);
          } else {
            showToast('error', 'File không đúng định dạng mẫu học sinh!');
          }
        } else {
          const newTeachers = jsonData.map((row: any) => {
            return {
              id: row['Mã GV'] ? String(row['Mã GV']) : `GV${Math.floor(100 + Math.random() * 900)}`,
              name: row['Họ và Tên'] || '',
              role: row['Chức vụ'] || 'Giáo viên',
              contractType: row['Diện hợp đồng (Cơ hữu/Thỉnh giảng)'] || 'Cơ hữu',
              email: row['Email'] || '',
              phone: row['Số điện thoại'] ? String(row['Số điện thoại']) : '',
              experience: row['Thâm niên'] || '',
              achievements: row['Thành tích'] || '',
              status: 'Đang công tác'
            };
          }).filter(gv => gv.name); // Chỉ lấy những dòng có tên

          if (newTeachers.length > 0) {
            setTeachers(prev => {
              const prevMap = new Map(prev.map(t => [t.id, t]));
              newTeachers.forEach(newT => {
                if (prevMap.has(newT.id)) {
                  // Cập nhật thông tin nếu đã tồn tại
                  prevMap.set(newT.id, { ...prevMap.get(newT.id), ...newT });
                } else {
                  // Thêm mới nếu chưa có
                  prevMap.set(newT.id, newT);
                }
              });
              const updatedList = Array.from(prevMap.values());
              updatedList.sort((a, b) => newTeachers.some(t => t.id === a.id) ? -1 : 1);
              return updatedList;
            });
            for (const t of newTeachers) {
              await setDoc(doc(db, 'teachers', t.id), { ...t, defaultPass: 'Tbs@gv2026', passChanged: false }, { merge: true });
            }
            showToast('success', `Đã nhập và cập nhật dữ liệu giáo viên thành công!`);
          } else {
            showToast('error', 'File không đúng định dạng mẫu giáo viên!');
          }
        }
      } catch (error) {
        console.error('Excel parse error:', error);
        showToast('error', 'Có lỗi khi đọc file Excel. Vui lòng kiểm tra lại!');
      }
      
      // Reset input file để có thể chọn lại file cũ nếu muốn
      e.target.value = '';
    }
  };

  const handleResetPassword = async (studentId: string, studentName: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn khôi phục mật khẩu của học sinh ${studentName} về mặc định không?`)) {
      await updateDoc(doc(db, 'students', studentId), { password: '', passChanged: false });
      showToast('success', `Đã reset mật khẩu cho học sinh ${studentName}!`);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa học sinh ${studentName} (${studentId}) khỏi danh sách không?`)) {
      await deleteDoc(doc(db, 'students', studentId));
      setStudents(prev => prev.filter(hs => hs.id !== studentId));
      showToast('success', `Đã xóa học sinh ${studentName} thành công!`);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên ${teacherName} (${teacherId}) khỏi danh sách không?`)) {
      await deleteDoc(doc(db, 'teachers', teacherId));
      setTeachers(prev => prev.filter(gv => gv.id !== teacherId));
      showToast('success', `Đã xóa giáo viên ${teacherName} thành công!`);
    }
  };

  const handleOpenAddStudent = () => {
    setStudentForm({
      id: `HS${Math.floor(26000 + Math.random() * 1000)}`,
      name: '',
      gender: 'Nam',
      dob: '',
      class: '10A1',
      note: '',
      status: 'Đang học'
    });
    setEditingStudentId(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: any) => {
    setStudentForm({
      id: student.id,
      name: student.name,
      gender: student.gender,
      dob: student.dob,
      class: student.class,
      note: student.note || '',
      status: student.status
    });
    setEditingStudentId(student.id);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudentId) {
      setStudents(prev => prev.map(hs => {
        if (hs.id === editingStudentId) {
          return {
            ...hs,
            name: studentForm.name,
            gender: studentForm.gender,
            dob: studentForm.dob,
            class: studentForm.class,
            note: studentForm.note,
            status: studentForm.status
          };
        }
        return hs;
      }));
      const updatedStudent = {
            id: editingStudentId,
            name: studentForm.name,
            gender: studentForm.gender,
            dob: studentForm.dob,
            class: studentForm.class,
            note: studentForm.note,
            status: studentForm.status
          };
          await setDoc(doc(db, 'students', editingStudentId), updatedStudent, { merge: true });
          showToast('success', 'Đã cập nhật thông tin học sinh!');
    } else {
      if (students.some(hs => hs.id === studentForm.id)) {
        showToast('error', 'Mã học sinh đã tồn tại!');
        return;
      }
      const newStudent = {
        id: studentForm.id,
        name: studentForm.name,
        gender: studentForm.gender,
        dob: studentForm.dob,
        class: studentForm.class,
        defaultPass: `Tbs@${studentForm.class.toLowerCase()}`,
        passChanged: false,
        status: studentForm.status,
        note: studentForm.note
      };
      setStudents(prev => [...prev, newStudent]);
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
      showToast('success', 'Đã thêm học sinh mới vào danh sách!');
    }
    setIsStudentModalOpen(false);
  };

  const handleOpenAddTeacher = () => {
    setTeacherForm({
      id: `GV${String(teachers.length + 1).padStart(3, '0')}`,
      name: '',
      role: 'Giáo viên Toán',
      contractType: 'Cơ hữu',
      email: '',
      phone: '',
      experience: '',
      achievements: '',
      status: 'Đang công tác'
    });
    setEditingTeacherId(null);
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: any) => {
    setTeacherForm({
      id: teacher.id,
      name: teacher.name,
      role: teacher.role,
      contractType: teacher.contractType,
      email: teacher.email,
      phone: teacher.phone,
      experience: teacher.experience,
      achievements: teacher.achievements,
      status: teacher.status
    });
    setEditingTeacherId(teacher.id);
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacherId) {
      const updatedTeacher = {
        name: teacherForm.name,
        role: teacherForm.role,
        contractType: teacherForm.contractType,
        email: teacherForm.email,
        phone: teacherForm.phone,
        experience: teacherForm.experience,
        achievements: teacherForm.achievements,
        status: teacherForm.status
      };
      
      setTeachers(prev => prev.map(gv => {
        if (gv.id === editingTeacherId) {
          return { ...gv, ...updatedTeacher };
        }
        return gv;
      }));
      
      // Save to Firebase
      await setDoc(doc(db, 'teachers', editingTeacherId), updatedTeacher, { merge: true });
      showToast('success', 'Đã cập nhật hồ sơ giáo viên!');
    } else {
      if (teachers.some(gv => gv.id === teacherForm.id)) {
        showToast('error', 'Mã giáo viên đã tồn tại!');
        return;
      }
      const newTeacher = {
        id: teacherForm.id,
        name: teacherForm.name,
        role: teacherForm.role,
        contractType: teacherForm.contractType,
        email: teacherForm.email,
        phone: teacherForm.phone,
        experience: teacherForm.experience,
        achievements: teacherForm.achievements,
        status: teacherForm.status,
        defaultPass: 'Tbs@gv2026',
        passChanged: false
      };
      setTeachers(prev => [...prev, newTeacher]);
      
      // Save to Firebase
      await setDoc(doc(db, 'teachers', newTeacher.id), newTeacher);
      showToast('success', 'Đã lưu hồ sơ giáo viên mới!');
    }
    setIsTeacherModalOpen(false);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvaluations(prev => {
        const prevMap = new Map(prev.map(ev => [ev.id, ev]));
        prevMap.set(evaluationForm.id, evaluationForm);
        const updatedList = Array.from(prevMap.values());
        updatedList.sort((a, b) => a.id === evaluationForm.id ? -1 : 1);
        return updatedList;
      });
      
      await setDoc(doc(db, 'evaluations', evaluationForm.id), evaluationForm, { merge: true });
      showToast('success', 'Đã lưu kết quả đánh giá!');
      setIsEvaluationModalOpen(false);
    } catch(err) {
      showToast('error', 'Có lỗi khi lưu đánh giá!');
    }
  };

  const handleDeleteEvaluation = async (evalId: string) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa bản đánh giá này?')) {
      try {
        await deleteDoc(doc(db, 'evaluations', evalId));
        setEvaluations(prev => prev.filter(ev => ev.id !== evalId));
        showToast('success', 'Đã xóa đánh giá!');
      } catch(err) {
        showToast('error', 'Lỗi khi xóa đánh giá!');
      }
    }
  };

  const handleToggleLockTeacher = async (id: string, name: string, currentStatus: string) => {
    const isLocking = currentStatus === 'Đang công tác';
    const actionText = isLocking ? 'khóa tài khoản' : 'mở khóa tài khoản';
    if (window.confirm(`Thầy/Cô có chắc chắn muốn ${actionText} của giáo viên ${name} không?`)) {
      const newStatus = isLocking ? 'Đã khóa' : 'Đang công tác';
      setTeachers(prev => prev.map(gv => {
        if (gv.id === id) {
          return { ...gv, status: newStatus };
        }
        return gv;
      }));
      
      // Save to Firebase
      await updateDoc(doc(db, 'teachers', id), { status: newStatus });
      showToast('success', `Đã ${isLocking ? 'khóa' : 'mở khóa'} tài khoản giáo viên ${name}!`);
    }
  };

  if (!isClient) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800 relative flex items-center justify-center">
          <div className="text-xl font-bold text-slate-500">Đang tải dữ liệu...</div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800 relative">
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER CHUNG */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Phòng Giáo Vụ Kỹ Thuật Số
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Quản Lý Hồ Sơ & Tài Khoản
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
            <button 
              onClick={() => setActiveTab('students')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-sky-600'}`}
            >
              🎓 Danh Sách Học Sinh
            </button>
            <button 
              onClick={() => setActiveTab('teachers')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              👨‍🏫 Hồ Sơ Giáo Viên
            </button>
            <button 
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'monthly' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-amber-500'}`}
            >
              📊 Đánh Giá Tổ Toán-Tin
            </button>
          </div>

          {/* VÙNG NỘI DUNG */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[600px]">
            
            {/* ========================================== */}
            {/* TAB 1: QUẢN LÝ HỌC SINH */}
            {/* ========================================== */}
            {activeTab === 'students' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-sky-700 uppercase tracking-wider">Dữ liệu học viên năm học mới</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Quản lý mã định danh, lớp học và bảo mật tài khoản.</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-white text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200 shadow-sm flex items-center gap-2"
                    >
                      📄 Xuất file mẫu
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm flex items-center gap-2">
                      📥 Nhập từ Excel
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button 
                      onClick={handleOpenAddStudent}
                      className="px-4 py-2 bg-sky-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-sky-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                      + Thêm 1 HS
                    </button>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU HỌC SINH */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b">Mã HS</th>
                        <th className="px-4 py-3 border-b">Họ và Tên</th>
                        <th className="px-4 py-3 border-b">Giới tính / NS</th>
                        <th className="px-4 py-3 border-b">Lớp</th>
                        <th className="px-4 py-3 border-b">Bảo mật (MK)</th>
                        <th className="px-4 py-3 border-b">Ghi chú</th>
                        <th className="px-4 py-3 border-b text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((hs) => (
                        <tr key={hs.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-sky-600">{hs.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{hs.name}</td>
                          <td className="px-4 py-3 font-medium text-xs">{hs.gender} <br/><span className="text-slate-400">{hs.dob}</span></td>
                          <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded-md font-bold">{hs.class}</span></td>
                          <td className="px-4 py-3 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-500">Mặc định: <code className="bg-slate-100 px-1 rounded">{hs.defaultPass}</code></span>
                              {hs.passChanged ? (
                                <span className="text-emerald-600 font-bold">✓ Đã tự đổi MK</span>
                              ) : (
                                <span className="text-rose-500 font-bold">⚠ Chưa đổi MK</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs italic">{hs.note}</td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <button onClick={() => handleOpenEditStudent(hs)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Sửa</button>
                            <button onClick={() => handleResetPassword(hs.id, hs.name)} className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Reset MK</button>
                            <button onClick={() => handleDeleteStudent(hs.id, hs.name)} className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: QUẢN LÝ GIÁO VIÊN */}
            {/* ========================================== */}
            {activeTab === 'teachers' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-indigo-700 uppercase tracking-wider">Hồ sơ Cán bộ - Giáo viên</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Lưu trữ thâm niên, thành tích, tài khoản và phân công chuyên môn.</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-white text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200 shadow-sm flex items-center gap-2"
                    >
                      📄 Xuất file mẫu
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm flex items-center gap-2">
                      📥 Nhập file nhân sự
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button 
                      onClick={handleOpenAddTeacher}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                      + Thêm GV mới
                    </button>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU GIÁO VIÊN */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {teachers.map((gv) => (
                    <div key={gv.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow bg-slate-50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-full -z-0"></div>
                      <div className="relative z-10 flex flex-col h-full">
                        
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded uppercase tracking-wider">{gv.id}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase border ${gv.contractType === 'Cơ hữu' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>
                            {gv.contractType}
                          </span>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded uppercase ml-auto">{gv.status}</span>
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800">{gv.name}</h3>
                        <p className="text-xs font-bold text-indigo-600 mb-4">{gv.role}</p>
                        
                        <div className="space-y-2.5 text-xs text-slate-600 font-medium border-t border-slate-200 pt-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">📧</span>
                            <span className="truncate" title={gv.email}>{gv.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">📞</span>
                            <span>{gv.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-slate-400">⏳</span>
                            <span>{gv.experience} thâm niên</span>
                          </div>
                          <div className="flex gap-2 items-start">
                            <span className="text-slate-400 mt-0.5">🏆</span>
                            <span className="leading-relaxed">{gv.achievements}</span>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2 pt-4 border-t border-slate-100">
                          <button onClick={() => handleOpenEditTeacher(gv)} className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm">Sửa</button>
                          <button onClick={() => handleToggleLockTeacher(gv.id, gv.name, gv.status)} className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm">{gv.status === 'Đang công tác' ? 'Khóa' : 'Mở'}</button>
                          <button onClick={() => handleDeleteTeacher(gv.id, gv.name)} className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm">Xóa</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 3: QUẢN LÝ CHUYÊN MÔN THEO THÁNG */}
            {/* ========================================== */}
            {activeTab === 'monthly' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-amber-600 uppercase tracking-wider">Đánh giá chuyên môn theo tháng</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Nghiệp vụ Tổ Toán - Tin: Dự giờ, chấm bài, tiến độ và thi đua.</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3 items-center">
                    <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 shadow-sm">
                      <span className="text-xs font-black text-amber-700 uppercase">Tháng:</span>
                      <input 
                        type="text" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        placeholder="MM/YYYY"
                        className="bg-transparent text-sm font-bold text-slate-700 w-20 focus:outline-none placeholder:text-slate-300" 
                      />
                    </div>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU ĐÁNH GIÁ */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b">Giáo Viên</th>
                        <th className="px-4 py-3 border-b">Tháng</th>
                        <th className="px-4 py-3 border-b">Dự Giờ / Thao Giảng</th>
                        <th className="px-4 py-3 border-b">Tiến độ chương trình</th>
                        <th className="px-4 py-3 border-b">Đề thi / Chấm bài</th>
                        <th className="px-4 py-3 border-b">Phụ đạo / HSG</th>
                        <th className="px-4 py-3 border-b text-center">Xếp Loại</th>
                        <th className="px-4 py-3 border-b text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teachers.map((gv) => {
                        const ev = evaluations.find(e => e.teacherId === gv.id && e.month === selectedMonth);
                        return (
                          <tr key={gv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {gv.name}
                              <div className="text-[10px] text-amber-600 uppercase mt-0.5">{gv.id}</div>
                            </td>
                            {ev ? (
                              <>
                                <td className="px-4 py-3 font-bold">{ev.month}</td>
                                <td className="px-4 py-3 text-xs">{ev.observation || '-'}</td>
                                <td className="px-4 py-3 text-xs">
                                  <span className={`px-2 py-1 rounded font-bold ${ev.progress === 'Đúng tiến độ' ? 'bg-emerald-50 text-emerald-600' : ev.progress === 'Vượt tiến độ' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {ev.progress}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs">{ev.grading}</td>
                                <td className="px-4 py-3 text-xs">{ev.training}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${ev.rating === 'A' ? 'bg-emerald-100 text-emerald-700' : ev.rating === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {ev.rating}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center space-x-2">
                                  <button onClick={() => {
                                    setEvaluationForm(ev);
                                    setIsEvaluationModalOpen(true);
                                  }} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Sửa</button>
                                  <button onClick={() => handleDeleteEvaluation(ev.id)} className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold transition-colors">Xóa</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-bold text-slate-400">{selectedMonth}</td>
                                <td colSpan={5} className="px-4 py-3 text-center">
                                  <span className="text-rose-500 font-bold text-xs bg-rose-50 px-3 py-1 rounded-full">⚠ Chưa có đánh giá</span>
                                </td>
                                <td className="px-4 py-3 text-center space-x-2">
                                  <button onClick={() => {
                                    setEvaluationForm({
                                      id: `EV${Date.now()}`,
                                      teacherId: gv.id,
                                      teacherName: gv.name,
                                      month: selectedMonth,
                                      observation: '',
                                      progress: 'Đúng tiến độ',
                                      grading: 'Hoàn thành tốt',
                                      training: 'Không',
                                      rating: 'A',
                                      note: ''
                                    });
                                    setIsEvaluationModalOpen(true);
                                  }} className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-bold transition-colors border border-amber-200 shadow-sm">Đánh giá ngay</button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      {teachers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">Chưa có giáo viên nào trong danh sách.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL: FORM CẬP NHẬT HỌC SINH */}
        {/* ========================================================= */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-sky-50 p-5 border-b border-sky-100 flex justify-between items-center">
                <h3 className="text-base font-black text-sky-800 uppercase tracking-wide">Cập Nhật Hồ Sơ Học Sinh</h3>
                <button onClick={() => setIsStudentModalOpen(false)} className="text-sky-800 hover:bg-sky-200 p-2 rounded-full transition-colors font-black">✕</button>
              </div>
              <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mã HS / ID:</label>
                    <input 
                      type="text" 
                      placeholder="VD: HS26005" 
                      value={studentForm.id}
                      onChange={(e) => setStudentForm({ ...studentForm, id: e.target.value })}
                      disabled={!!editingStudentId}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400 disabled:opacity-60" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và Tên:</label>
                    <input 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lớp:</label>
                    <input 
                      type="text" 
                      placeholder="10A1" 
                      value={studentForm.class}
                      onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Giới tính:</label>
                    <select 
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400"
                    >
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ngày sinh:</label>
                    <input 
                      type="text" 
                      placeholder="DD/MM/YYYY" 
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ghi chú thêm:</label>
                  <textarea 
                    placeholder="Chức vụ lớp, diện chính sách..." 
                    value={studentForm.note}
                    onChange={(e) => setStudentForm({ ...studentForm, note: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 resize-none h-20"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsStudentModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                  <button type="submit" className="flex-1 py-3.5 bg-sky-600 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-sky-700 transition-colors">💾 Lưu Dữ Liệu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: FORM CẬP NHẬT GIÁO VIÊN */}
        {/* ========================================================= */}
        {isTeacherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-indigo-50 p-5 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-base font-black text-indigo-800 uppercase tracking-wide">Hồ Sơ Cán Bộ - Giáo Viên</h3>
                <button onClick={() => setIsTeacherModalOpen(false)} className="text-indigo-800 hover:bg-indigo-200 p-2 rounded-full transition-colors font-black">✕</button>
              </div>
              <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mã GV:</label>
                    <input 
                      type="text" 
                      placeholder="VD: GV015" 
                      value={teacherForm.id}
                      onChange={(e) => setTeacherForm({ ...teacherForm, id: e.target.value })}
                      disabled={!!editingTeacherId}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 disabled:opacity-60" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và Tên:</label>
                    <input 
                      type="text" 
                      placeholder="Trần Thị B" 
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Chức vụ / Phân công:</label>
                    <input 
                      type="text" 
                      placeholder="Giáo viên Toán" 
                      value={teacherForm.role}
                      onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Diện Hợp Đồng:</label>
                    <select 
                      value={teacherForm.contractType}
                      onChange={(e) => setTeacherForm({ ...teacherForm, contractType: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400"
                    >
                      <option>Cơ hữu</option><option>Thỉnh giảng</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email (Tài khoản truy cập):</label>
                    <input 
                      type="email" 
                      placeholder="email@thanhbinh.edu.vn" 
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Số điện thoại:</label>
                    <input 
                      type="text" 
                      placeholder="09xxxxxxx" 
                      value={teacherForm.phone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thâm niên công tác:</label>
                    <input 
                      type="text" 
                      placeholder="VD: 5 năm" 
                      value={teacherForm.experience}
                      onChange={(e) => setTeacherForm({ ...teacherForm, experience: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thành tích nổi bật:</label>
                    <input 
                      type="text" 
                      placeholder="CSTĐ, GVG..." 
                      value={teacherForm.achievements}
                      onChange={(e) => setTeacherForm({ ...teacherForm, achievements: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsTeacherModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                  <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">💾 Xác Nhận Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: FORM ĐÁNH GIÁ CHUYÊN MÔN THÁNG */}
        {/* ========================================================= */}
        {isEvaluationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-amber-50 p-5 border-b border-amber-100 flex justify-between items-center">
                <h3 className="text-base font-black text-amber-800 uppercase tracking-wide">Đánh Giá Chuyên Môn Tổ Toán - Tin</h3>
                <button onClick={() => setIsEvaluationModalOpen(false)} className="text-amber-800 hover:bg-amber-200 p-2 rounded-full transition-colors font-black">✕</button>
              </div>
              <form onSubmit={handleSaveEvaluation} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Giáo viên được đánh giá:</label>
                    <input 
                      type="text" 
                      value={`${evaluationForm.teacherName} (${evaluationForm.teacherId})`}
                      disabled
                      className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tháng / Năm:</label>
                    <input 
                      type="text" 
                      placeholder="VD: 09/2026" 
                      value={evaluationForm.month}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, month: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dự giờ / Thao giảng:</label>
                    <input 
                      type="text" 
                      placeholder="VD: 2 tiết (Tốt)" 
                      value={evaluationForm.observation}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, observation: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tiến độ chương trình:</label>
                    <select 
                      value={evaluationForm.progress}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, progress: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option>Đúng tiến độ</option>
                      <option>Vượt tiến độ</option>
                      <option>Chậm 1 tiết</option>
                      <option>Chậm nhiều tiết</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Công tác Đề thi / Chấm bài:</label>
                    <input 
                      type="text" 
                      placeholder="VD: Hoàn thành tốt" 
                      value={evaluationForm.grading}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, grading: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Phụ đạo / Bồi dưỡng HSG:</label>
                    <input 
                      type="text" 
                      placeholder="VD: BD HSG Khối 10" 
                      value={evaluationForm.training}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, training: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Xếp loại chung (Tháng):</label>
                    <select 
                      value={evaluationForm.rating}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, rating: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:border-amber-400"
                    >
                      <option value="A">Loại A (Hoàn thành xuất sắc)</option>
                      <option value="B">Loại B (Hoàn thành tốt)</option>
                      <option value="C">Loại C (Hoàn thành nhiệm vụ)</option>
                      <option value="D">Loại D (Không hoàn thành)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nhận xét / Ghi chú:</label>
                    <input 
                      type="text" 
                      placeholder="Nhận xét thêm..." 
                      value={evaluationForm.note}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, note: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEvaluationModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                  <button type="submit" className="flex-1 py-3.5 bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-amber-600 transition-colors">💾 Lưu Đánh Giá</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </AuthGuard>
  );
}