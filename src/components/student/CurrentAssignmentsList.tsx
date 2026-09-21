import React, { useState } from 'react';
import { Link } from 'react-router';
import { Clock, Calendar, AlertCircle, ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react';

interface CurrentAssignmentsListProps {
  assignments: any[];
  user: any;
}

export default function CurrentAssignmentsList({ assignments, user }: CurrentAssignmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = assignments.filter(a => 
    !searchTerm.trim() || 
    (a.testTitle && a.testTitle.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const grouped = filtered.reduce((acc, current) => {
    const date = new Date(current.assignedDate || current.createdAt).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(current);
    return acc;
  }, {} as Record<string, any[]>);

  const getDueDate = (a: any) => {
    return (a.extensions && user?.uid && a.extensions[user.uid]) ? a.extensions[user.uid] : a.dueDate;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={20} />
            <span>Bài kiểm tra cần làm hiện tại</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {assignments.length} bài
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Các bài kiểm tra đang mở và còn thời hạn làm bài được phân bổ cho lớp của bạn.
          </p>
        </div>

        {assignments.length > 3 && (
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Không có bài kiểm tra nào cần làm!</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Tuyệt vời! Bạn đã hoàn thành hết các bài kiểm tra được giao hoặc giáo viên chưa giao bài mới.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <p className="text-sm text-gray-500">Không tìm thấy bài kiểm tra nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(grouped) as [string, any[]][]).map(([date, items]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                {date}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((assignment: any) => {
                  const dueDate = getDueDate(assignment);
                  const isExtended = assignment.extensions && user?.uid && assignment.extensions[user.uid];

                  return (
                    <div 
                      key={assignment.id} 
                      className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                            {assignment.className} - Khối {assignment.grade}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                            <Clock size={12} />
                            Hạn: {new Date(dueDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {assignment.testTitle}
                        </h4>

                        <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-6 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-gray-400 shrink-0" />
                            <span>Thời gian làm: <strong>{assignment.testDuration || 45} phút</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={15} className="text-gray-400 shrink-0" />
                            <span>
                              Giao lúc: {new Date(assignment.assignedDate || assignment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(assignment.assignedDate || assignment.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {isExtended && (
                            <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
                              Được gia hạn thêm thời gian
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Link 
                          to={`/assignment/${assignment.id}`}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs group-hover:shadow-sm"
                        >
                          <span>Làm bài ngay</span>
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
