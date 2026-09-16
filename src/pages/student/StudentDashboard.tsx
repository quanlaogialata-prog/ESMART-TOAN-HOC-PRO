import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadUserGradeAndAssignments();
    }
  }, [user]);

  const loadUserGradeAndAssignments = async () => {
    // 1. Get user grade
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user?.email)));
    let grade = 9;
    let className = '';
    if (!userDoc.empty) {
      const uData = userDoc.docs[0].data();
      if (uData.grade) grade = Number(uData.grade) || 9;
      if (uData.className) className = uData.className;
    }
    setUserGrade(grade);

    // 2. Get assignments for this grade
    const snap = await getDocs(collection(db, 'assignments'));
    
    const subQ = query(collection(db, 'submissions'), where('studentEmail', '==', user?.email));
    const subSnap = await getDocs(subQ);
    const submittedAssignMap = new Map();
    subSnap.docs.forEach(doc => {
      submittedAssignMap.set(doc.data().assignmentId, doc.data());
    });

    const validAssignments: any[] = [];
    for (const d of snap.docs) {
      const assignData = d.data();
      // Filter by grade and class
      if (Number(assignData.grade) !== Number(grade)) continue;
      if (assignData.className !== className) continue;
      // Check if test actually exists (handles cases where tests were deleted without cascade)
      const testSnap = await getDoc(doc(db, 'tests', assignData.testId));
      if (testSnap.exists()) {
        const subData = submittedAssignMap.get(d.id);
        validAssignments.push({ 
          id: d.id, 
          ...assignData, 
          isSubmitted: !!subData,
          score: subData?.score,
          maxScore: subData?.maxScore,
          submittedAt: subData?.submittedAt,
          timeSpent: subData?.timeSpent
        });
      } else {
        // Clean up orphaned assignment
        try {
          await deleteDoc(doc(db, 'assignments', d.id));
        } catch(e) {
          console.error("Cleanup error", e);
        }
      }
    }
    
    // Sort by due date
    validAssignments.sort((a, b) => {
      const aDue = a.extensions && user?.uid && a.extensions[user.uid] ? a.extensions[user.uid] : a.dueDate;
      const bDue = b.extensions && user?.uid && b.extensions[user.uid] ? b.extensions[user.uid] : b.dueDate;
      return new Date(aDue).getTime() - new Date(bDue).getTime();
    });
    
    setAssignments(validAssignments);
    setLoading(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center">Đang tải bài tập...</div>;

  // Group assignments by date
  const getDueDate = (a: any) => (a.extensions && user?.uid && a.extensions[user.uid]) ? a.extensions[user.uid] : a.dueDate;
  const groupedAssignments: { [date: string]: any[] } = {};
  assignments.forEach(a => {
    const dateStr = new Date(a.dueDate).toLocaleDateString('vi-VN', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    if (!groupedAssignments[dateStr]) {
      groupedAssignments[dateStr] = [];
    }
    groupedAssignments[dateStr].push(a);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bài tập của tôi</h2>
          <p className="text-gray-500 mt-1">Danh sách các bài kiểm tra được giao theo ngày (Khối {userGrade})</p>
        </div>
      </div>
      
      {Object.keys(groupedAssignments).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(groupedAssignments).map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <h3 className="text-lg font-bold text-indigo-800 border-b border-indigo-100 pb-2 flex items-center gap-2">
                <Calendar size={20} />
                {dateKey}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedAssignments[dateKey].map(a => (
                  <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    {a.isSubmitted ? (
                    <>
                      <div className="p-5 border-b border-gray-100 flex-1">
                        <div className="flex justify-between items-start mb-3">
                           <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-green-100 text-green-700">
                             Đã nộp bài
                           </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4 line-clamp-2">{a.testTitle}</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" /> <span className="font-medium">Giao bài:</span> {((dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` })(a.assignedDate || a.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" /> <span className="font-medium">Nộp bài:</span> {((dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` })(a.submittedAt)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <AlertCircle size={14} className="text-gray-400" /> <span className="font-medium">Thời gian làm:</span> {((seconds) => { if (!seconds) return '0 phút'; const m = Math.floor(seconds / 60); const s = seconds % 60; return m > 0 ? `${m} phút ${s} giây` : `${s} giây`; })(a.timeSpent)}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 flex items-center gap-3">
                         <div className="flex-1 text-center bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed">
                            Đã làm bài
                         </div>
                         {a.score !== undefined && (
                            <div className="px-3 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg whitespace-nowrap">
                              {Number(a.score).toFixed(2)} / {a.maxScore}
                            </div>
                         )}
                      </div>
                    </>
                  ) : (
                    <>
                    <div className="p-5 border-b border-gray-100 flex-1">
                      <div className="flex justify-end items-start mb-3">
                        <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          <Clock size={12} /> Hạn nộp: {((dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` })(getDueDate(a))}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2">{a.testTitle}</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <AlertCircle size={14} className="text-gray-400" /> <span className="font-medium">Thời lượng:</span> {a.testDuration} phút
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" /> <span className="font-medium">Giao bài:</span> {((dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` })(a.assignedDate || a.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex items-center gap-3">
                        {new Date() > new Date(getDueDate(a)) ? (
                            <div className="block w-full text-center bg-gray-300 text-gray-600 font-medium py-2 rounded-lg cursor-not-allowed">
                              Quá hạn thời gian làm bài
                            </div>
                        ) : (
                            <Link to={`/assignment/${a.id}`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                              Làm bài ngay
                            </Link>
                        )}
                    </div>
                    </>
                  )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-500">
          <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
          <p className="text-xl font-medium text-gray-800 mb-2">Tuyệt vời!</p>
          <p>Bạn không có bài tập nào cần làm lúc này.</p>
        </div>
      )}
    </div>
  );
}
