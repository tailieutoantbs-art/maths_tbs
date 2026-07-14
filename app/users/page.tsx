'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';

export default function UsersManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  // Dữ liệu mẫu
  const [students, setStudents] = useState([
    { id: 'HS26001', name: 'Nguyễn Hải Đăng', gender: 'Nam', dob: '15/08/2010', class: '10A1', defaultPass: 'Tbs@10a1', passChanged: true, status: 'Đang học', note: 'Lớp phó học tập' },
    { id: 'HS26002', name: 'Trần Thị Thu Hà', gender: 'Nữ', dob: '22/11/2010', class: '10A1', defaultPass: 'Tbs@10a1', passChanged: false, status: 'Đang học', note: '' },
    { id: 'HS25045', name: 'Lê Hoàng Bách', gender: 'Nam', dob: '05/02/2009', class: '11A2', defaultPass: 'Tbs@11a2', passChanged: true, status: 'Đang học', note: 'Đội tuyển HSG' },
  ]);

  const [teachers, setTeachers] = useState([
    { id: 'GV001', name: 'Thầy Hùng', role: 'Tổ trưởng chuyên môn', contractType: 'Cơ hữu', email: 'hung.tbs@thanhbinh.edu.vn', experience: '15 năm', achievements: 'CSTĐ Cấp Tỉnh, GVG', phone: '090xxxxxxx', status: 'Đang công tác' },
    { id: 'GV002', name: 'Cô Phạm Mai', role: 'Giáo viên Toán', contractType: 'Thỉnh giảng', email: 'mai.pham@thanhbinh.edu.vn', experience: '5 năm', achievements: 'GVG Cấp Trường', phone: '091xxxxxxx', status: 'Đang công tác' },
  ]);

  // STATE: Quản lý Modal (Cửa sổ nổi)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

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

  // Xử lý giả lập Import Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('info', `Đang đọc dữ liệu từ file: ${file.name}...`);
      setTimeout(() => {
        showToast('success', 'Đã nhập danh sách thành công từ file Excel!');
      }, 1500);
    }
  };

  const handleResetPassword = (studentName: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn khôi phục mật khẩu của học sinh ${studentName} về mặc định không?`)) {
      showToast('success', `Đã reset mật khẩu cho học sinh ${studentName}!`);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStudentModalOpen(false);
    showToast('success', 'Đã lưu thông tin học sinh vào cơ sở dữ liệu!');
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTeacherModalOpen(false);
    showToast('success', 'Đã lưu hồ sơ giáo viên mới!');
  };

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
                      onClick={() => setIsStudentModalOpen(true)}
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
                            <button onClick={() => setIsStudentModalOpen(true)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Sửa</button>
                            <button onClick={() => handleResetPassword(hs.name)} className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Reset MK</button>
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
                      onClick={() => setIsTeacherModalOpen(true)}
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
                          <button onClick={() => setIsTeacherModalOpen(true)} className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm">Sửa hồ sơ</button>
                          <button className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm">Khóa TK</button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <input type="text" placeholder="VD: HS26005" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và Tên:</label>
                    <input type="text" placeholder="Nguyễn Văn A" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lớp:</label>
                    <input type="text" placeholder="10A1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Giới tính:</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400">
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ngày sinh:</label>
                    <input type="text" placeholder="DD/MM/YYYY" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ghi chú thêm:</label>
                  <textarea placeholder="Chức vụ lớp, diện chính sách..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 resize-none h-20"></textarea>
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
                    <input type="text" placeholder="VD: GV015" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và Tên:</label>
                    <input type="text" placeholder="Trần Thị B" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Chức vụ / Phân công:</label>
                    <input type="text" placeholder="Giáo viên Toán" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Diện Hợp Đồng:</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400">
                      <option>Cơ hữu</option><option>Thỉnh giảng</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email (Tài khoản truy cập):</label>
                    <input type="email" placeholder="email@thanhbinh.edu.vn" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Số điện thoại:</label>
                    <input type="text" placeholder="09xxxxxxx" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thâm niên công tác:</label>
                    <input type="text" placeholder="VD: 5 năm" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thành tích nổi bật:</label>
                    <input type="text" placeholder="CSTĐ, GVG..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
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

      </main>
    </AuthGuard>
  );
}