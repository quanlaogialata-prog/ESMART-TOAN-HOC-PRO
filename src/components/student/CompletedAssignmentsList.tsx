import React, { useState } from 'react';
import { CheckCircle2, Clock, Calendar, Eye, Search, Award, FileText, ChevronRight } from 'lucide-react';

interface CompletedAssignmentsListProps {
  assignments: any[];
  onReview: (assignment: any, submission: any) => void;
}

export default function CompletedAssignmentsList({ assignments, onReview }: CompletedAssignmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = assignments.filter(a => 
    !searchTerm.trim() || 
    (a.testTitle && a.testTitle.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  const formatTimeSpent = (seconds: number) => {
    if (!seconds && seconds !== 0) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}p ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <span>Danh sách bài kiểm tra đã làm</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {assignments.length} bài
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Danh sách bài kiểm tra bạn đã hoàn thành, thời gian giao bài, điểm số và xem lại kết quả chi tiết.
          </p>
        </div>

        {assignments.length > 3 && (
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm bài đã nộp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
            />
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có bài kiểm tra nào đã làm</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Khi bạn hoàn thành các bài kiểm tra được giao, danh sách các bài thi đã nộp và bảng kết quả sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <p className="text-sm text-gray-500">Không tìm thấy bài đã làm phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Tên bài kiểm tra</th>
                  <th className="py-3.5 px-4">Thời gian giao</th>
                  <th className="py-3.5 px-4">Thời gian nộp bài</th>
                  <th className="py-3.5 px-4 text-center">Điểm số</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((a: any, idx: number) => {
                  const sub = a.submission || {};
                  const assignedTime = a.assignedDate || a.createdAt;
                  const submittedAt = sub.submittedAt;
                  const score = Number(sub.score || 0);
                  const maxScore = Number(sub.maxScore || 10);
                  const score10 = maxScore > 0 ? (score / maxScore) * 10 : score;

                  return (
                    <tr key={a.id} className="hover:bg-emerald-50/20 transition-colors group">
                      <td className="py-4 px-4 text-center text-xs font-semibold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                          {a.testTitle}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          <span>Lớp {a.className} • Khối {a.grade}</span>
                          {sub.variantCode && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[11px] border border-indigo-100">
                              Mã đề: {sub.variantCode}
                            </span>
                          )}
                          {sub.timeSpent !== undefined && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock size={12} /> {formatTimeSpent(sub.timeSpent)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDateTime(assignedTime)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                          <Clock size={14} className="text-emerald-500" />
                          <span>{formatDateTime(submittedAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-black text-sm rounded-lg border border-emerald-200 shadow-2xs">
                            {score.toFixed(2).replace(/\.00$/, '')} / {maxScore}
                          </span>
                          {maxScore !== 10 && (
                            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
                              ({score10.toFixed(2).replace(/\.00$/, '')}/10)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onReview(a, sub)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                          title="Xem bảng kết quả chấm bài và đáp án chi tiết"
                        >
                          <Eye size={14} />
                          <span>Xem lại kết quả</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <span>Bấm &ldquo;Xem lại kết quả&rdquo; để xem bảng điểm, đáp án đúng và lời giải chi tiết từng câu.</span>
            <span className="font-bold text-gray-700">{filtered.length} bài đã làm</span>
          </div>
        </div>
      )}
    </div>
  );
}
