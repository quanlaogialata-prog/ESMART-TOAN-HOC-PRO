import React, { useState } from 'react';
import { AlertTriangle, Clock, Calendar, Search, CheckCircle2 } from 'lucide-react';

interface OverdueAssignmentsListProps {
  assignments: any[];
  user: any;
}

export default function OverdueAssignmentsList({ assignments, user }: OverdueAssignmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = assignments.filter(a => 
    !searchTerm.trim() || 
    (a.testTitle && a.testTitle.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const getDueDate = (a: any) => {
    return (a.extensions && user?.uid && a.extensions[user.uid]) ? a.extensions[user.uid] : a.dueDate;
  };

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-rose-500" size={20} />
            <span>Danh sách bài kiểm tra quá hạn</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              {assignments.length} bài
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Các bài kiểm tra đã hết hạn nộp và chưa được hoàn thành.
          </p>
        </div>

        {assignments.length > 3 && (
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên bài quá hạn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-50"
            />
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-emerald-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Không có bài kiểm tra nào bị quá hạn!</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Rất tốt! Bạn luôn hoàn thành bài tập đúng thời gian quy định hoặc không có bài nào bị trễ hạn.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <p className="text-sm text-gray-500">Không tìm thấy bài quá hạn phù hợp với &ldquo;{searchTerm}&rdquo;.</p>
        </div>
      ) : (
        /* Rows / Table layout as explicitly requested */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Tên bài kiểm tra</th>
                  <th className="py-3.5 px-4">Thời gian giao</th>
                  <th className="py-3.5 px-4">Hạn nộp bài</th>
                  <th className="py-3.5 px-4 text-center">Thời lượng</th>
                  <th className="py-3.5 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((a: any, idx: number) => {
                  const dueDate = getDueDate(a);
                  const assignedTime = a.assignedDate || a.createdAt;

                  return (
                    <tr key={a.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-4 px-4 text-center text-xs font-semibold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 leading-snug">
                          {a.testTitle}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Lớp {a.className} • Khối {a.grade}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDateTime(assignedTime)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-rose-700">
                          <Clock size={14} className="text-rose-400" />
                          <span>{formatDateTime(dueDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap text-xs font-semibold text-gray-600">
                        {a.testDuration || 45} phút
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
                          <AlertTriangle size={12} /> Đã quá hạn
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <span>Nếu cần làm lại bài kiểm tra quá hạn, vui lòng liên hệ giáo viên phụ trách để được gia hạn nộp bài.</span>
            <span className="font-bold text-gray-700">{filtered.length} bài</span>
          </div>
        </div>
      )}
    </div>
  );
}
