import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Search, 
  Users, 
  CheckCircle,
  Key,
  Phone,
  ShieldCheck,
  Building
} from 'lucide-react';

export interface StudentData {
  id: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  rawPassword?: string;
  parentPhone?: string;
  grade?: string | number;
  className?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ClassData {
  id: string;
  name: string;
  grade: string | number;
  [key: string]: any;
}

interface ExportStudentAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentData[];
  classes: ClassData[];
  initialSelectedClass?: string; // class name or 'all'
}

export default function ExportStudentAccountsModal({
  isOpen,
  onClose,
  students,
  classes,
  initialSelectedClass = 'all'
}: ExportStudentAccountsModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>(initialSelectedClass);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'cards'>('preview');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Extract all distinct class names from classes list and students list
  const distinctClasses = useMemo(() => {
    const map = new Map<string, { name: string; grade: string; count: number }>();
    
    // First register official classes
    classes.forEach(c => {
      if (c && c.name) {
        map.set(c.name, {
          name: c.name,
          grade: String(c.grade || ''),
          count: 0
        });
      }
    });

    // Then count students and add any unlisted class names
    students.forEach(s => {
      const clsName = s.className || 'Chưa phân lớp';
      if (!map.has(clsName)) {
        map.set(clsName, {
          name: clsName,
          grade: String(s.grade || ''),
          count: 1
        });
      } else {
        const item = map.get(clsName)!;
        item.count += 1;
        if (!item.grade && s.grade) item.grade = String(s.grade);
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const gA = Number(a.grade) || 0;
      const gB = Number(b.grade) || 0;
      if (gA !== gB) return gA - gB;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [classes, students]);

  // Format student records
  const formattedStudents = useMemo(() => {
    return students.map(s => {
      const email = s.email || '';
      const username = email.includes('@toanhoc.pro')
        ? email.replace('@toanhoc.pro', '')
        : (email.split('@')[0] || '');
      
      const fullName = s.fullName || s.displayName || 'Chưa cập nhật';
      const className = s.className || 'Chưa phân lớp';
      const grade = s.grade ? String(s.grade) : '';
      const rawPassword = s.rawPassword || '';
      const parentPhone = s.parentPhone || '';

      return {
        id: s.id,
        fullName,
        displayName: s.displayName || fullName,
        className,
        grade,
        username,
        email,
        rawPassword,
        parentPhone,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : ''
      };
    });
  }, [students]);

  // Filter students by selected class and search term
  const displayedStudents = useMemo(() => {
    return formattedStudents.filter(s => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        s.fullName.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term) ||
        s.className.toLowerCase().includes(term) ||
        s.parentPhone.includes(term);

      return matchClass && matchSearch;
    }).sort((a, b) => {
      const gA = Number(a.grade) || 0;
      const gB = Number(b.grade) || 0;
      if (gA !== gB) return gA - gB;
      const clsDiff = a.className.localeCompare(b.className);
      if (clsDiff !== 0) return clsDiff;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [formattedStudents, selectedClass, searchTerm]);

  // Copy helper
  const handleCopyAccount = (student: any) => {
    const text = `Tài khoản học sinh: ${student.fullName} | Lớp: ${student.className}\nTên đăng nhập: ${student.username}\nMật khẩu: ${student.rawPassword || '••••••'}\nWebsite: ESmart KB`;
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Excel Single Class or All Classes
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (selectedClass !== 'all') {
      // Export single selected class
      const classStudents = formattedStudents.filter(s => s.className === selectedClass);
      const gradeStr = classStudents[0]?.grade ? `Khối ${classStudents[0].grade}` : '';

      const rows: any[][] = [
        ['TRUNG TÂM ESMART KB - HỆ THỐNG ÔN TẬP VÀ KIỂM TRA MÔN TOÁN'],
        [`DANH SÁCH TÀI KHOẢN HỌC SINH - LỚP ${selectedClass.toUpperCase()}`],
        [`Thông tin: ${gradeStr} | Sĩ số: ${classStudents.length} học sinh | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        ['Địa chỉ đăng nhập: Hệ thống ESmart KB (Đăng nhập bằng Tên đăng nhập hoặc Email)'],
        [], // blank line
        [
          'STT',
          'Họ và tên học sinh',
          'Khối',
          'Lớp',
          'Tên đăng nhập (Username)',
          'Email đăng nhập',
          'Mật khẩu',
          'SĐT Phụ huynh',
          'Ngày tạo tài khoản',
          'Hướng dẫn đăng nhập'
        ]
      ];

      classStudents.forEach((stu, index) => {
        rows.push([
          index + 1,
          stu.fullName,
          stu.grade,
          stu.className,
          stu.username,
          stu.email,
          stu.rawPassword,
          stu.parentPhone,
          stu.createdAt,
          'Nhập Tên đăng nhập & Mật khẩu trên app ESmart KB'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 8 },
        { wch: 12 },
        { wch: 22 },
        { wch: 28 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 38 }
      ];

      const safeSheetName = selectedClass.replace(/[\\/?*[\]:]/g, '_').substring(0, 30) || 'Lop';
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      
      const fileName = `Danh_sach_tai_khoan_Lop_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setDownloadSuccess(`Đã xuất file Excel thành công cho lớp ${selectedClass}!`);
      setTimeout(() => setDownloadSuccess(''), 4000);
    } else {
      // Export ALL classes: Create Summary Sheet + Individual Sheet for each Class!
      // 1. Summary Sheet
      const summaryRows: any[][] = [
        ['TRUNG TÂM ESMART KB - HỆ THỐNG ÔN TẬP VÀ KIỂM TRA MÔN TOÁN'],
        ['TỔNG HỢP DANH SÁCH TÀI KHOẢN HỌC SINH TOÀN TRUNG TÂM'],
        [`Tổng số học sinh: ${formattedStudents.length} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        [
          'STT',
          'Họ và tên học sinh',
          'Khối',
          'Lớp',
          'Tên đăng nhập (Username)',
          'Email đăng nhập',
          'Mật khẩu',
          'SĐT Phụ huynh',
          'Ngày tạo'
        ]
      ];

      formattedStudents.forEach((stu, index) => {
        summaryRows.push([
          index + 1,
          stu.fullName,
          stu.grade,
          stu.className,
          stu.username,
          stu.email,
          stu.rawPassword,
          stu.parentPhone,
          stu.createdAt
        ]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 8 },
        { wch: 12 },
        { wch: 22 },
        { wch: 28 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tat_ca_hoc_sinh');

      // 2. Individual Sheet for each class
      distinctClasses.forEach(cls => {
        const clsStudents = formattedStudents.filter(s => s.className === cls.name);
        if (clsStudents.length === 0) return;

        const clsRows: any[][] = [
          ['TRUNG TÂM ESMART KB - HỆ THỐNG ÔN TẬP VÀ KIỂM TRA MÔN TOÁN'],
          [`DANH SÁCH TÀI KHOẢN HỌC SINH - LỚP ${cls.name.toUpperCase()}`],
          [`Khối: ${cls.grade} | Sĩ số: ${clsStudents.length} học sinh | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
          [],
          [
            'STT',
            'Họ và tên học sinh',
            'Khối',
            'Lớp',
            'Tên đăng nhập (Username)',
            'Email đăng nhập',
            'Mật khẩu',
            'SĐT Phụ huynh',
            'Ngày tạo'
          ]
        ];

        clsStudents.forEach((stu, idx) => {
          clsRows.push([
            idx + 1,
            stu.fullName,
            stu.grade,
            stu.className,
            stu.username,
            stu.email,
            stu.rawPassword,
            stu.parentPhone,
            stu.createdAt
          ]);
        });

        const wsCls = XLSX.utils.aoa_to_sheet(clsRows);
        wsCls['!cols'] = [
          { wch: 6 },
          { wch: 25 },
          { wch: 8 },
          { wch: 12 },
          { wch: 22 },
          { wch: 28 },
          { wch: 18 },
          { wch: 16 },
          { wch: 16 }
        ];

        const sheetTitle = cls.name.replace(/[\\/?*[\]:]/g, '_').substring(0, 30) || 'Lop';
        XLSX.utils.book_append_sheet(wb, wsCls, sheetTitle);
      });

      const fileName = `Danh_sach_tai_khoan_Toan_bo_cac_lop_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setDownloadSuccess(`Đã xuất thành công file Excel gồm tất cả các lớp (tách từng Sheet)!`);
      setTimeout(() => setDownloadSuccess(''), 4000);
    }
  };

  // Print function (opens print dialog with styled printable cards/table)
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileSpreadsheet className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Xuất Danh Sách Tài Khoản Học Sinh Theo Lớp</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Xuất file Excel (.xlsx), danh sách bảng và phiếu in thẻ tài khoản học sinh
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Building size={14} className="text-blue-600" /> Chọn Lớp:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all"> Tất cả các lớp ({formattedStudents.length} học sinh)</option>
                {distinctClasses.map(cls => (
                  <option key={cls.name} value={cls.name}>
                    Lớp {cls.name} {cls.grade ? `(Khối ${cls.grade})` : ''} - {cls.count} học sinh
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Tìm tên, username, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none w-44 sm:w-56"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bảng danh sách
              </button>
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  activeTab === 'cards' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phiếu in thẻ tài khoản
              </button>
            </div>

            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1"
              title={showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{showPasswords ? 'Ẩn MK' : 'Hiện MK'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Banner */}
        <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-blue-900 flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            <span>
              Đang hiển thị: <strong>{displayedStudents.length}</strong> học sinh
              {selectedClass !== 'all' ? ` thuộc lớp ` : ` (toàn bộ các lớp)`}
              {selectedClass !== 'all' && <strong className="text-blue-700 underline ml-1">{selectedClass}</strong>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <FileSpreadsheet size={15} />
              <span>
                {selectedClass === 'all' ? 'Xuất Excel tất cả các lớp' : `Xuất Excel lớp ${selectedClass}`}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer size={15} />
              <span>{activeTab === 'cards' ? 'In phiếu tài khoản' : 'In danh sách bảng'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="px-4 py-2 bg-emerald-100 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle size={15} className="text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/60 print:p-0 print:bg-white">
          
          {displayedStudents.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-200">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">Không tìm thấy tài khoản học sinh nào</p>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng kiểm tra lại bộ lọc lớp hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : activeTab === 'preview' ? (
            /* Table View */
            <div className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden print:border-0 print:shadow-none">
              
              {/* Print Header (Only visible when printing) */}
              <div className="hidden print:block p-4 text-center border-b border-gray-300 mb-4">
                <h2 className="text-lg font-bold uppercase text-gray-900">TRUNG TÂM ESMART KB - HỆ THỐNG TOÁN HỌC</h2>
                <h3 className="text-base font-bold text-gray-800 mt-1">
                  DANH SÁCH TÀI KHOẢN HỌC SINH {selectedClass !== 'all' ? `- LỚP ${selectedClass.toUpperCase()}` : 'TOÀN TRƯỜNG'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ngày in: {new Date().toLocaleDateString('vi-VN')} | Tổng số: {displayedStudents.length} học sinh
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/90 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="px-3.5 py-3 font-bold text-center w-12">STT</th>
                      <th className="px-4 py-3 font-bold">Họ và Tên</th>
                      <th className="px-3 py-3 font-bold text-center">Khối</th>
                      <th className="px-3 py-3 font-bold text-center">Lớp</th>
                      <th className="px-4 py-3 font-bold">Tên đăng nhập (Username)</th>
                      <th className="px-4 py-3 font-bold">Mật khẩu</th>
                      <th className="px-3.5 py-3 font-bold">SĐT Phụ huynh</th>
                      <th className="px-3.5 py-3 font-bold text-center print:hidden">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-medium text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-gray-900">
                          {s.fullName}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600">
                          {s.grade || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200 text-[11px]">
                            {s.className}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-blue-800">
                          {s.username}
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {showPasswords ? (
                            <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                              {s.rawPassword || '(chưa đặt)'}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold">••••••••</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-gray-600 flex items-center gap-1">
                          {s.parentPhone ? (
                            <>
                              <Phone size={11} className="text-gray-400" />
                              <span>{s.parentPhone}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center print:hidden">
                          <button
                            onClick={() => handleCopyAccount(s)}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded transition-colors inline-flex items-center gap-1"
                            title="Sao chép thông tin tài khoản"
                          >
                            {copiedId === s.id ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Printable Account Slips / Cards View */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-700 shrink-0" />
                  <span>
                    Chế độ <strong>Phiếu in tài khoản</strong>: Mỗi học sinh được định dạng thành một thẻ tài khoản nhỏ xinh xắn với viền kẻ đứt nét để giáo viên dùng kéo cắt phát cho từng bạn mang về nhà.
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Printer size={13} />
                  <span>In ngay</span>
                </button>
              </div>

              {/* Printable Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 print:grid-cols-2 print:gap-3">
                {displayedStudents.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-between space-y-2.5 print:border-gray-400 print:shadow-none break-inside-avoid shadow-2xs hover:border-blue-400 transition-colors"
                  >
                    {/* Slip Header */}
                    <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          TRUNG TÂM ESMART KB
                        </div>
                        <div className="text-xs font-black text-gray-900">
                          THẺ TÀI KHOẢN HỌC TẬP
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10.5px] font-bold rounded">
                        Lớp {s.className}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-gray-500 text-[11px]">Họ và tên:</span>
                        <strong className="text-gray-900 font-bold">{s.fullName}</strong>
                      </div>
                      
                      <div className="flex justify-between items-baseline bg-gray-50 px-2 py-1 rounded">
                        <span className="text-gray-600 text-[11px]">Tên đăng nhập:</span>
                        <strong className="font-mono text-blue-700 font-black">{s.username}</strong>
                      </div>

                      <div className="flex justify-between items-baseline bg-gray-50 px-2 py-1 rounded">
                        <span className="text-gray-600 text-[11px]">Mật khẩu:</span>
                        <strong className="font-mono text-amber-800 font-black">
                          {showPasswords ? (s.rawPassword || '123456') : '••••••••'}
                        </strong>
                      </div>

                      {s.parentPhone && (
                        <div className="flex justify-between items-baseline text-[10.5px] text-gray-500">
                          <span>SĐT Phụ huynh:</span>
                          <span>{s.parentPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Slip Footer */}
                    <div className="border-t border-gray-100 pt-1.5 text-[9.5px] text-gray-500 text-center leading-snug">
                      Đăng nhập trên ứng dụng ESmart KB hoặc web trường. Lưu giữ bảo mật mật khẩu.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 print:hidden">
          <div className="text-xs text-gray-500">
            Mẹo: Bấm <strong>"Xuất Excel tất cả các lớp"</strong> để tự động tạo một file Excel gồm đầy đủ các sheet riêng biệt cho từng lớp.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download size={15} />
              <span>Tải file Excel (.xlsx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
