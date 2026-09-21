import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, CheckCircle2, AlertTriangle, BookOpen, Award, 
  TrendingUp, RefreshCw, User, Sparkles
} from 'lucide-react';
import CurrentAssignmentsList from '../../components/student/CurrentAssignmentsList';
import OverdueAssignmentsList from '../../components/student/OverdueAssignmentsList';
import CompletedAssignmentsList from '../../components/student/CompletedAssignmentsList';
import StudentGradebook from '../../components/student/StudentGradebook';
import StudentResultModal from '../../components/student/StudentResultModal';

type StudentTab = 'current' | 'overdue' | 'completed' | 'gradebook';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>('current');

  const [currentAssignments, setCurrentAssignments] = useState<any[]>([]);
  const [overdueAssignments, setOverdueAssignments] = useState<any[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<any[]>([]);

  // Modal review state
  const [reviewState, setReviewState] = useState<{
    assignment: any;
    submission: any;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get user profile details
      let grade = 9;
      let className = '';
      let fullName = user?.displayName || '';

      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user?.email)));
      if (!userDoc.empty) {
        const uData = userDoc.docs[0].data();
        if (uData.grade) grade = Number(uData.grade) || 9;
        if (uData.className) className = uData.className;
        if (uData.fullName) fullName = uData.fullName;
      }
      setStudentInfo({ grade, className, fullName, email: user?.email });

      // 2. Get all submissions by this student
      const subQ = query(collection(db, 'submissions'), where('studentEmail', '==', user?.email));
      const subSnap = await getDocs(subQ);
      const submittedAssignMap = new Map();
      subSnap.docs.forEach(d => {
        const sData = d.data();
        submittedAssignMap.set(sData.assignmentId, { id: d.id, ...sData });
      });

      // Also check studentId matching if email didn't catch any
      if (user?.uid) {
        const subIdQ = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
        const subIdSnap = await getDocs(subIdQ);
        subIdSnap.docs.forEach(d => {
          const sData = d.data();
          if (!submittedAssignMap.has(sData.assignmentId)) {
            submittedAssignMap.set(sData.assignmentId, { id: d.id, ...sData });
          }
        });
      }

      // 3. Get assignments assigned to this class and grade
      const snap = await getDocs(collection(db, 'assignments'));
      const activeList: any[] = [];
      const overdueList: any[] = [];
      const doneList: any[] = [];

      const now = new Date();

      for (const d of snap.docs) {
        const assignData = d.data();

        // Filter by grade and class
        if (Number(assignData.grade) !== Number(grade)) continue;
        if (assignData.className !== className) continue;

        // Verify that the underlying test document exists
        const testSnap = await getDoc(doc(db, 'tests', assignData.testId));
        if (!testSnap.exists()) {
          // Clean up orphaned assignment safely
          try {
            await deleteDoc(doc(db, 'assignments', d.id));
          } catch (e) {
            console.error("Cleanup error", e);
          }
          continue;
        }

        const subData = submittedAssignMap.get(d.id);
        const isSubmitted = !!subData;

        // Calculate due date taking student-specific extension into account
        const dueDateToUse = (assignData.extensions && user?.uid && assignData.extensions[user.uid])
          ? assignData.extensions[user.uid]
          : assignData.dueDate;
        
        const isOverdue = !isSubmitted && dueDateToUse && (now > new Date(dueDateToUse));

        const item = {
          id: d.id,
          ...assignData,
          effectiveDueDate: dueDateToUse,
          isSubmitted,
          isOverdue,
          submission: subData,
          score: subData?.score,
          maxScore: subData?.maxScore,
          submittedAt: subData?.submittedAt,
          timeSpent: subData?.timeSpent
        };

        if (isSubmitted) {
          doneList.push(item);
        } else if (isOverdue) {
          overdueList.push(item);
        } else {
          activeList.push(item);
        }
      }

      // Sort current assignments by due date (nearest first)
      activeList.sort((a, b) => new Date(a.effectiveDueDate).getTime() - new Date(b.effectiveDueDate).getTime());

      // Sort overdue assignments by due date (most recent overdue first)
      overdueList.sort((a, b) => new Date(b.effectiveDueDate).getTime() - new Date(a.effectiveDueDate).getTime());

      // Sort completed assignments by submission date (latest submitted first)
      doneList.sort((a, b) => {
        const timeA = new Date(a.submittedAt || a.createdAt).getTime();
        const timeB = new Date(b.submittedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      setCurrentAssignments(activeList);
      setOverdueAssignments(overdueList);
      setCompletedAssignments(doneList);
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (assignment: any, submission: any) => {
    setReviewState({ assignment, submission });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-72 items-center justify-center gap-3">
        <RefreshCw size={28} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium text-gray-500">Đang tải dữ liệu học tập của bạn...</span>
      </div>
    );
  }

  // Calculate quick GPA for header summary
  const totalCompleted = completedAssignments.length;
  let avg10 = 0;
  if (totalCompleted > 0) {
    const sum = completedAssignments.reduce((acc, a) => {
      const sub = a.submission || {};
      const score = Number(sub.score || 0);
      const max = Number(sub.maxScore || 10);
      return acc + (max > 0 ? (score / max) * 10 : score);
    }, 0);
    avg10 = Math.round((sum / totalCompleted) * 100) / 100;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Student Welcome & Profile Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            {studentInfo?.fullName ? studentInfo.fullName.charAt(0).toUpperCase() : <User size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {studentInfo?.fullName || user?.displayName || 'Học sinh'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                Lớp {studentInfo?.className || '--'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Khối {studentInfo?.grade || '--'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email đăng nhập: <strong className="text-gray-700">{user?.email}</strong>
            </p>
          </div>
        </div>

        {/* Quick Progress Counters */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-gray-50/80 p-2 rounded-xl border border-gray-100">
          <div className="px-3 py-1 text-center">
            <div className="text-xs text-gray-400 font-medium">Cần làm</div>
            <div className="text-base font-bold text-blue-600">{currentAssignments.length}</div>
          </div>
          <div className="w-px h-7 bg-gray-200"></div>
          <div className="px-3 py-1 text-center">
            <div className="text-xs text-gray-400 font-medium">Đã làm</div>
            <div className="text-base font-bold text-emerald-600">{completedAssignments.length}</div>
          </div>
          <div className="w-px h-7 bg-gray-200"></div>
          <div className="px-3 py-1 text-center">
            <div className="text-xs text-gray-400 font-medium">ĐTB (Hệ 10)</div>
            <div className="text-base font-bold text-indigo-600">
              {totalCompleted > 0 ? avg10.toFixed(2).replace(/\.00$/, '') : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        
        {/* Tab 1: Bài kiểm tra hiện tại */}
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <BookOpen size={16} />
          <span>Bài kiểm tra hiện tại</span>
          {currentAssignments.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'current' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              {currentAssignments.length}
            </span>
          )}
        </button>

        {/* Tab 2: Bài kiểm tra quá hạn */}
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={16} />
          <span>Bài kiểm tra quá hạn</span>
          {overdueAssignments.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {overdueAssignments.length}
            </span>
          )}
        </button>

        {/* Tab 3: Bài kiểm tra đã làm */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Bài kiểm tra đã làm</span>
          {completedAssignments.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {completedAssignments.length}
            </span>
          )}
        </button>

        {/* Tab 4: Sổ kết quả cá nhân */}
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'gradebook'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Award size={16} />
          <span>Sổ kết quả cá nhân</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'current' && (
          <CurrentAssignmentsList 
            assignments={currentAssignments} 
            user={user} 
          />
        )}

        {activeTab === 'overdue' && (
          <OverdueAssignmentsList 
            assignments={overdueAssignments} 
            user={user} 
          />
        )}

        {activeTab === 'completed' && (
          <CompletedAssignmentsList 
            assignments={completedAssignments} 
            onReview={handleOpenReview} 
          />
        )}

        {activeTab === 'gradebook' && (
          <StudentGradebook 
            user={user} 
            studentInfo={studentInfo} 
            completedAssignments={completedAssignments} 
            onReview={handleOpenReview} 
          />
        )}
      </div>

      {/* Review Modal for submitted tests */}
      {reviewState && (
        <StudentResultModal
          assignment={reviewState.assignment}
          submission={reviewState.submission}
          onClose={() => setReviewState(null)}
        />
      )}

    </div>
  );
}

