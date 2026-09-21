import React, { useState, useMemo } from 'react';
import { 
  Award, TrendingUp, BookOpen, Clock, Calendar, Search, 
  Printer, Eye, CheckCircle2, AlertCircle, ChevronDown, BarChart3, Filter
} from 'lucide-react';

interface StudentGradebookProps {
  user: any;
  studentInfo: any;
  completedAssignments: any[];
  onReview: (assignment: any, submission: any) => void;
}

export default function StudentGradebook({
  user,
  studentInfo,
  completedAssignments,
  onReview
}: StudentGradebookProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Compute calculated metrics
  const stats = useMemo(() => {
    if (!completedAssignments.length) {
      return {
        total: 0,
        average10: 0,
        highest10: 0,
        lowest10: 0,
        rating: 'Chưa có dữ liệu'
      };
    }

    const scores10 = completedAssignments.map(a => {
      const sub = a.submission || {};
      const score = Number(sub.score || 0);
      const max = Number(sub.maxScore || 10);
      return max > 0 ? (score / max) * 10 : score;
    });

    const sum = scores10.reduce((acc, s) => acc + s, 0);
    const avg = sum / scores10.length;
    const highest = Math.max(...scores10);
    const lowest = Math.min(...scores10);

    let rating = 'Chưa xếp loại';
    if (avg >= 8.5) rating = 'Xuất sắc';
    else if (avg >= 8.0) rating = 'Giỏi';
    else if (avg >= 6.5) rating = 'Khá';
    else if (avg >= 5.0) rating = 'Trung bình';
    else rating = 'Cần cố gắng';

    return {
      total: completedAssignments.length,
      average10: Math.round(avg * 100) / 100,
      highest10: Math.round(highest * 100) / 100,
      lowest10: Math.round(lowest * 100) / 100,
      rating
    };
  }, [completedAssignments]);

  // Helper to rate individual test
  const getIndividualRating = (score10: number) => {
    if (score10 >= 8.5) return { label: 'Xuất sắc', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (score10 >= 8.0) return { label: 'Giỏi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (score10 >= 6.5) return { label: 'Khá', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (score10 >= 5.0) return { label: 'Trung bình', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Cần cố gắng', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  // Filter and sort items
  const processedList = useMemo(() => {
    let list = [...completedAssignments];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(a => a.testTitle && a.testTitle.toLowerCase().includes(term));
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      list = list.filter(a => {
        const sub = a.submission || {};
        const score = Number(sub.score || 0);
        const max = Number(sub.maxScore || 10);
        const score10 = max > 0 ? (score / max) * 10 : score;
        const r = getIndividualRating(score10).label;
        return r === ratingFilter;
      });
    }

    // Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.submission?.submittedAt || a.createdAt).getTime();
      const dateB = new Date(b.submission?.submittedAt || b.createdAt).getTime();
      
      const subA = a.submission || {};
      const maxA = Number(subA.maxScore || 10);
      const scoreA10 = maxA > 0 ? (Number(subA.score || 0) / maxA) * 10 : Number(subA.score || 0);

      const subB = b.submission || {};
      const maxB = Number(subB.maxScore || 10);
      const scoreB10 = maxB > 0 ? (Number(subB.score || 0) / maxB) * 10 : Number(subB.score || 0);

      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'highest') return scoreB10 - scoreA10;
      if (sortBy === 'lowest') return scoreA10 - scoreB10;
      return 0;
    });

    return list;
  }, [completedAssignments, searchTerm, ratingFilter, sortBy]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      
      {/* Title & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs print:border-none print:shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Sổ kết quả cá nhân</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                Năm học 2025 - 2026
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Học sinh: <strong className="text-gray-800">{studentInfo?.fullName || user?.displayName || user?.email}</strong> • Lớp: <strong className="text-gray-800">{studentInfo?.className || '--'}</strong> • Khối: <strong className="text-gray-800">{studentInfo?.grade || '--'}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="print:hidden inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          title="In hoặc lưu PDF sổ kết quả học tập"
        >
          <Printer size={15} />
          <span>In sổ kết quả</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completed */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold mb-2">
            <span>BÀI ĐÃ LÀM</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-gray-900">
            {stats.total} <span className="text-sm font-medium text-gray-400">bài</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Tổng số bài kiểm tra đã nộp</p>
        </div>

        {/* GPA / Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex justify-between items-center text-blue-700 text-xs font-semibold mb-2">
            <span>ĐIỂM TRUNG BÌNH (HỆ 10)</span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600">
            {stats.total > 0 ? stats.average10.toFixed(2).replace(/\.00$/, '') : '--'}
            <span className="text-sm font-medium text-gray-400"> / 10</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Trung bình cộng các bài thi</p>
        </div>

        {/* Highest Score */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold mb-2">
            <span>ĐIỂM CAO NHẤT</span>
            <Award size={16} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {stats.total > 0 ? stats.highest10.toFixed(2).replace(/\.00$/, '') : '--'}
            <span className="text-sm font-medium text-gray-400"> / 10</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Thành tích tốt nhất đạt được</p>
        </div>

        {/* Overall Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold mb-2">
            <span>XẾP LOẠI HỌC TẬP</span>
            <Award size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {stats.rating}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Dựa trên thang điểm trung bình</p>
        </div>
      </div>

      {/* Interactive Progress Visual Chart */}
      {completedAssignments.length > 1 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              <span>Biểu đồ tiến độ điểm số các bài kiểm tra</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">Theo thứ tự thời gian nộp bài</span>
          </div>

          <div className="h-44 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 overflow-x-auto">
            {completedAssignments
              .slice()
              .sort((a, b) => new Date(a.submission?.submittedAt || a.createdAt).getTime() - new Date(b.submission?.submittedAt || b.createdAt).getTime())
              .map((a, i) => {
                const sub = a.submission || {};
                const score = Number(sub.score || 0);
                const max = Number(sub.maxScore || 10);
                const score10 = max > 0 ? (score / max) * 10 : score;
                const heightPercent = Math.max(8, Math.min(100, (score10 / 10) * 100));
                
                let barColor = 'bg-blue-500';
                if (score10 >= 8.5) barColor = 'bg-emerald-500';
                else if (score10 >= 6.5) barColor = 'bg-blue-500';
                else if (score10 >= 5.0) barColor = 'bg-amber-500';
                else barColor = 'bg-rose-500';

                return (
                  <div key={a.id} className="flex-1 min-w-[40px] max-w-[64px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-gray-900 text-white text-[11px] py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                      {a.testTitle}: <strong>{score10.toFixed(2)}/10</strong>
                    </div>

                    <span className="text-[11px] font-bold text-gray-700">
                      {score10.toFixed(1).replace(/\.0$/, '')}
                    </span>
                    <div className="w-full bg-gray-100 rounded-t-lg h-28 flex items-end p-0.5">
                      <div 
                        style={{ height: `${heightPercent}%` }} 
                        className={`w-full ${barColor} rounded-t-md transition-all group-hover:brightness-110`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold truncate max-w-full text-center" title={a.testTitle}>
                      B{i + 1}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search, Filter & Sorter Toolbar */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài kiểm tra trong sổ kết quả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <Filter size={14} />
            <span>Xếp loại:</span>
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden font-medium text-gray-700"
          >
            <option value="all">Tất cả xếp loại</option>
            <option value="Xuất sắc">Xuất sắc (&ge; 8.5)</option>
            <option value="Giỏi">Giỏi (8.0 - 8.4)</option>
            <option value="Khá">Khá (6.5 - 7.9)</option>
            <option value="Trung bình">Trung bình (5.0 - 6.4)</option>
            <option value="Cần cố gắng">Cần cố gắng (&lt; 5.0)</option>
          </select>

          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden font-medium text-gray-700"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="highest">Điểm cao nhất</option>
            <option value="lowest">Điểm thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Transcript Table */}
      {completedAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có dữ liệu bài kiểm tra</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Học sinh cần hoàn thành ít nhất một bài kiểm tra để sổ kết quả bắt đầu ghi nhận và theo dõi tiến độ.
          </p>
        </div>
      ) : processedList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <p className="text-sm text-gray-500">Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-3 sm:px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-3 sm:px-4">Tên bài kiểm tra</th>
                  <th className="py-3.5 px-3 sm:px-4">Ngày nộp</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center">Điểm TN</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center">Điểm TL</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center">Điểm đề</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center">Điểm hệ 10</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center">Xếp loại</th>
                  <th className="py-3.5 px-3 sm:px-4 text-right print:hidden">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {processedList.map((a: any, idx: number) => {
                  const sub = a.submission || {};
                  const submittedAt = sub.submittedAt;
                  const score = Number(sub.score || 0);
                  const maxScore = Number(sub.maxScore || 10);
                  const score10 = maxScore > 0 ? (score / maxScore) * 10 : score;
                  const mcqScore = sub.mcqScore !== undefined ? Number(sub.mcqScore) : null;
                  const essayScore = sub.essayScore !== undefined ? Number(sub.essayScore) : null;
                  const rating = getIndividualRating(score10);

                  return (
                    <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs font-semibold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="font-bold text-gray-900 leading-snug">
                          {a.testTitle}
                        </div>
                        {sub.variantCode && (
                          <span className="text-[11px] text-indigo-600 font-semibold">
                            Mã đề: {sub.variantCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                        {formatDateTime(submittedAt)}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs font-medium text-gray-600">
                        {mcqScore !== null ? `${mcqScore.toFixed(1).replace(/\.0$/, '')}/${sub.mcqMax || '--'}` : '--'}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs font-medium text-gray-600">
                        {essayScore !== null ? `${essayScore.toFixed(1).replace(/\.0$/, '')}/${sub.essayMax || '--'}` : '--'}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-gray-700 text-xs sm:text-sm">
                          {score.toFixed(2).replace(/\.00$/, '')} / {maxScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-sm rounded-lg border border-blue-100">
                          {score10.toFixed(2).replace(/\.00$/, '')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${rating.color}`}>
                          {rating.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap print:hidden">
                        <button
                          type="button"
                          onClick={() => onReview(a, sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Xem lại</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <span>Điểm hệ 10 được tính bằng (Điểm đạt được / Điểm tối đa của đề) &times; 10.</span>
            <span className="font-bold text-gray-700">Tổng cộng {processedList.length} bài thi</span>
          </div>
        </div>
      )}

      {/* Official Signature Footer for Printing */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-12 text-center text-xs text-gray-700 border-t border-gray-300">
        <div>
          <p className="font-bold mb-14">HỌC SINH / PHỤ HUYNH KÝ TÊN</p>
          <p className="italic text-gray-500">(Ký và ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="font-bold mb-14">GIÁO VIÊN PHỤ TRÁCH</p>
          <p className="italic text-gray-500">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>

    </div>
  );
}
