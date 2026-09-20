import html2canvasPro from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface GradebookStudentRow {
  stt: number;
  studentId: string;
  displayName: string;
  variantCode?: string;
  startTimeStr: string;
  submitTimeStr: string;
  durationStr: string;
  mcqStr: string;
  essayStr: string;
  scoreStr: string;
  numericScore: number | null;
  statusStr: string; // 'Đã nộp' | 'Chưa nộp' | 'Chờ chấm'
}

export interface GradebookAssignmentInfo {
  testTitle: string;
  className: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  totalStudents: number;
  submittedCount: number;
  avgScore: string;
  highestScore: string;
  lowestScore: string;
}

/**
 * Chuẩn bị dữ liệu hàng học sinh từ danh sách học sinh và bài nộp
 */
export function prepareGradebookData(
  students: Array<{ id: string; displayName?: string; email?: string }>,
  submissions: Array<any>,
  assignment: any,
  teacherName: string = 'Giáo viên'
): { rows: GradebookStudentRow[]; info: GradebookAssignmentInfo } {
  let submittedCount = 0;
  let totalScoreSum = 0;
  let highest = -1;
  let lowest = 999;

  const rows: GradebookStudentRow[] = students.map((stu, idx) => {
    const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === assignment.id);
    
    let startTimeStr = 'Chưa làm';
    let submitTimeStr = 'Chưa nộp';
    let durationStr = '-';
    let scoreStr = 'Chưa nộp';
    let mcqStr = '-';
    let essayStr = '-';
    let numericScore: number | null = null;
    let statusStr = 'Chưa nộp';

    if (sub && sub.submittedAt) {
      statusStr = 'Đã nộp';
      submittedCount++;
      submitTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');

      if (sub.timeSpent) {
        const durationMins = Math.floor(sub.timeSpent / 60);
        const durationSecs = sub.timeSpent % 60;
        durationStr = `${durationMins}p ${durationSecs}s`;
        const startTime = new Date(new Date(sub.submittedAt).getTime() - sub.timeSpent * 1000);
        startTimeStr = startTime.toLocaleString('vi-VN');
      } else {
        startTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
      }

      if (typeof sub.score === 'number') {
        numericScore = sub.score;
        scoreStr = sub.score.toString();
        totalScoreSum += sub.score;
        if (sub.score > highest) highest = sub.score;
        if (sub.score < lowest) lowest = sub.score;
      } else {
        scoreStr = 'Chờ chấm';
        statusStr = 'Chờ chấm';
      }

      if (sub.mcqMax > 0) {
        mcqStr = `${Number(sub.mcqScore || 0).toFixed(1)}/${sub.mcqMax}`;
      }
      if (sub.essayMax > 0) {
        essayStr = `${Number(sub.essayScore || 0).toFixed(1)}/${sub.essayMax}`;
      }
    }

    return {
      stt: idx + 1,
      studentId: stu.id,
      displayName: stu.displayName || stu.email || 'Không tên',
      variantCode: sub?.variantCode || '',
      startTimeStr,
      submitTimeStr,
      durationStr,
      mcqStr,
      essayStr,
      scoreStr,
      numericScore,
      statusStr
    };
  });

  const avgScore = submittedCount > 0 ? (totalScoreSum / submittedCount).toFixed(2) : '-';
  const highestScore = highest >= 0 ? highest.toString() : '-';
  const lowestScore = lowest <= 10 && lowest >= 0 ? lowest.toString() : '-';

  const info: GradebookAssignmentInfo = {
    testTitle: assignment.testTitle || 'Không tên',
    className: assignment.className || 'Lớp',
    teacherName,
    assignedDate: assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleString('vi-VN') : 'Không có',
    dueDate: assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('vi-VN') : 'Không có',
    totalStudents: students.length,
    submittedCount,
    avgScore,
    highestScore,
    lowestScore
  };

  return { rows, info };
}

/**
 * Chia danh sách học sinh thành các trang chuẩn A4 Landscape:
 * - Nếu tổng số học sinh <= 14: gom trọn vẹn trong 1 trang duy nhất.
 * - Nếu > 14: Trang 1 chứa 12 học sinh (do có phần tiêu đề & thông tin bài tập),
 *   các trang sau mỗi trang chứa 16 học sinh (có tiêu đề phụ rút gọn + lặp lại thead).
 */
function chunkRowsForPages(rows: GradebookStudentRow[]): GradebookStudentRow[][] {
  if (rows.length <= 14) {
    return [rows];
  }

  const pages: GradebookStudentRow[][] = [];
  // Trang 1: 12 học sinh
  pages.push(rows.slice(0, 12));

  let currentIndex = 12;
  const pageSizeSubsequent = 16;

  while (currentIndex < rows.length) {
    pages.push(rows.slice(currentIndex, currentIndex + pageSizeSubsequent));
    currentIndex += pageSizeSubsequent;
  }

  return pages;
}

/**
 * Xuất file PDF bảng điểm chuẩn A4 Landscape:
 * - Phân trang thông minh, KHÔNG BAO GIỜ bị cắt đôi dòng học sinh.
 * - Lặp lại `<thead>` đầy đủ trên mọi trang.
 * - Thiết kế trang trọng, độ nét cao (2x DPI).
 */
export async function exportGradebookPdf(
  students: Array<{ id: string; displayName?: string; email?: string }>,
  submissions: Array<any>,
  assignment: any,
  teacherName: string = 'Giáo viên',
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Đang chuẩn bị dữ liệu bảng điểm...');

  const { rows, info } = prepareGradebookData(students, submissions, assignment, teacherName);
  const pageChunks = chunkRowsForPages(rows);
  const totalPages = pageChunks.length;

  // Tạo container tạm ẩn ngoài màn hình để render các trang
  const mountContainer = document.createElement('div');
  mountContainer.style.position = 'fixed';
  mountContainer.style.left = '-9999px';
  mountContainer.style.top = '0';
  mountContainer.style.width = '1120px';
  mountContainer.style.zIndex = '-1000';
  mountContainer.style.background = '#ffffff';
  document.body.appendChild(mountContainer);

  try {
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape',
      compress: true
    });

    const pageWidthMm = 297;
    const pageHeightMm = 210;
    const marginMm = 8;
    const printableWidthMm = pageWidthMm - marginMm * 2; // 281mm
    const printableHeightMm = pageHeightMm - marginMm * 2; // 194mm

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      onProgress?.(`Đang tạo trang ${pageIdx + 1}/${totalPages}...`);

      const isFirst = pageIdx === 0;
      const isLast = pageIdx === totalPages - 1;
      const pageRows = pageChunks[pageIdx];

      // Tạo phần tử DOM cho trang hiện tại với kích thước chuẩn A4 Landscape (tỷ lệ 1120px : 790px)
      const pageEl = document.createElement('div');
      pageEl.style.width = '1120px';
      pageEl.style.minHeight = '785px';
      pageEl.style.maxHeight = '785px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.padding = '24px 28px';
      pageEl.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      pageEl.style.color = '#1f2937';
      pageEl.style.background = '#ffffff';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';

      let pageHtml = '';

      if (isFirst) {
        // HEADER TRANG 1: Tiêu đề lớn + Khung thông tin bài kiểm tra
        pageHtml += `
          <div>
            <div style="text-align: center; margin-bottom: 14px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">
                BẢNG ĐIỂM BÀI KIỂM TRA
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #4b5563; font-style: italic;">
                Hệ thống Quản lý và Học tập Trực tuyến
              </p>
            </div>

            <!-- Khung thông tin bài kiểm tra -->
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; margin-bottom: 14px; font-size: 12px; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px 16px;">
              <div>
                <span style="color: #64748b;">Bài kiểm tra:</span> <strong style="color: #0f172a; font-size: 13px;">${info.testTitle}</strong>
              </div>
              <div>
                <span style="color: #64748b;">Lớp học:</span> <strong style="color: #2563eb; font-size: 13px;">${info.className}</strong>
              </div>
              <div>
                <span style="color: #64748b;">Giáo viên:</span> <strong style="color: #0f172a;">${info.teacherName}</strong>
              </div>
              <div>
                <span style="color: #64748b;">Giao lúc:</span> <span style="color: #334155;">${info.assignedDate}</span>
              </div>
              <div>
                <span style="color: #64748b;">Hạn nộp:</span> <span style="color: #334155;">${info.dueDate}</span>
              </div>
              <div>
                <span style="color: #64748b;">Sĩ số / Đã nộp:</span> <strong style="color: #059669;">${info.submittedCount}/${info.totalStudents}</strong>
                ${info.submittedCount > 0 ? `<span style="color: #64748b; margin-left: 8px;">(ĐTB: <strong style="color: #2563eb;">${info.avgScore}</strong>)</span>` : ''}
              </div>
            </div>
        `;
      } else {
        // HEADER TRANG TIẾP THEO: Gọn gàng, có tên lớp và bài kiểm tra
        pageHtml += `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px;">
              <div>
                <span style="font-size: 15px; font-weight: bold; color: #1e40af; text-transform: uppercase;">
                  BẢNG ĐIỂM BÀI KIỂM TRA (Tiếp theo)
                </span>
                <span style="font-size: 12px; color: #64748b; margin-left: 12px;">
                  Bài: <strong>${info.testTitle}</strong> • Lớp: <strong style="color: #2563eb;">${info.className}</strong>
                </span>
              </div>
              <div style="font-size: 11px; color: #64748b;">
                Trang ${pageIdx + 1}/${totalPages}
              </div>
            </div>
        `;
      }

      // BẢNG HỌC SINH VỚI THEAD ĐẦY ĐỦ
      pageHtml += `
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; table-layout: fixed;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #1e293b; font-weight: bold; border: 1px solid #cbd5e1;">
              <th style="border: 1px solid #cbd5e1; padding: 7px 4px; width: 42px; text-align: center;">STT</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 10px; width: 220px; text-align: left;">Họ và Tên</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 80px; text-align: center;">Mã đề</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 145px; text-align: center;">Bắt đầu làm</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 145px; text-align: center;">Nộp bài</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 95px; text-align: center;">Thời gian làm</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 105px; text-align: center;">Trắc nghiệm</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 85px; text-align: center;">Tự luận</th>
              <th style="border: 1px solid #cbd5e1; padding: 7px 6px; width: 95px; text-align: center; color: #1e40af;">Tổng điểm</th>
            </tr>
          </thead>
          <tbody>
      `;

      pageRows.forEach((r, rIdx) => {
        const isZebra = rIdx % 2 === 1;
        const rowBg = isZebra ? '#f8fafc' : '#ffffff';
        const scoreColor = r.numericScore !== null 
          ? (r.numericScore >= 8 ? '#15803d' : r.numericScore >= 5 ? '#1d4ed8' : '#b91c1c')
          : (r.scoreStr === 'Chờ chấm' ? '#d97706' : '#9ca3af');

        pageHtml += `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0; height: 32px;">
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; color: #64748b;">${r.stt}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 10px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${r.displayName}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center;">
              ${r.variantCode ? `<span style="background-color: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; border: 1px solid #bfdbfe;">${r.variantCode}</span>` : '<span style="color: #cbd5e1;">-</span>'}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; color: ${r.startTimeStr === 'Chưa làm' ? '#94a3b8' : '#334155'};">
              ${r.startTimeStr}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; color: ${r.submitTimeStr === 'Chưa nộp' ? '#ef4444' : '#334155'};">
              ${r.submitTimeStr}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; color: #475569;">
              ${r.durationStr}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; color: #334155;">
              ${r.mcqStr}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; color: #334155;">
              ${r.essayStr}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-weight: bold; font-size: 12px; color: ${scoreColor};">
              ${r.scoreStr}
            </td>
          </tr>
        `;
      });

      pageHtml += `
          </tbody>
        </table>
        </div> <!-- đóng khối nội dung trên -->
      `;

      // FOOTER CỦA TRANG: Chân trang + Ký tên nếu là trang cuối
      pageHtml += `
        <div style="margin-top: 10px;">
          ${isLast ? `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 11.5px; color: #334155;">
              <div style="text-align: center; width: 220px;">
                <div><em>Ngày ..... tháng ..... năm 20...</em></div>
                <div style="font-weight: bold; margin-top: 4px; color: #0f172a;">GIÁO VIÊN BỘ MÔN</div>
                <div style="height: 38px;"></div>
                <div style="font-weight: 500;">${info.teacherName}</div>
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 10.5px; color: #94a3b8;">
            <div>
              Xuất ngày: ${new Date().toLocaleString('vi-VN')} • Hệ thống Quản lý Học tập
            </div>
            <div style="font-weight: 600; color: #64748b;">
              Trang ${pageIdx + 1} / ${totalPages}
            </div>
          </div>
        </div>
      `;

      pageEl.innerHTML = pageHtml;
      mountContainer.innerHTML = '';
      mountContainer.appendChild(pageEl);

      // Đợi font và layout render hoàn tất
      await new Promise(resolve => setTimeout(resolve, 80));

      // Render trang bằng html2canvasPro độ phân giải cao
      const canvas = await html2canvasPro(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (pageIdx > 0) {
        pdf.addPage();
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, printableHeightMm);
    }

    onProgress?.('Đang hoàn tất tệp PDF...');

    const cleanTitle = (info.testTitle || 'KiemTra').replace(/[\s\/\\:*?"<>|]+/g, '_');
    const cleanClass = (info.className || 'Lop').replace(/[\s\/\\:*?"<>|]+/g, '_');
    const fileName = `Bang_diem_${cleanClass}_${cleanTitle}_${Date.now()}.pdf`;

    pdf.save(fileName);
  } finally {
    if (document.body.contains(mountContainer)) {
      document.body.removeChild(mountContainer);
    }
  }
}

/**
 * Xuất file Excel (.xlsx) chuẩn cho bảng điểm bài kiểm tra:
 * - Có đầy đủ cột STT, Họ tên, Mã đề, Bắt đầu làm, Nộp bài, Thời gian, Trắc nghiệm, Tự luận, Điểm tổng kết
 * - Có hàng thống kê Sĩ số, Điểm trung bình, Cao nhất, Thấp nhất
 */
export function exportGradebookExcel(
  students: Array<{ id: string; displayName?: string; email?: string }>,
  submissions: Array<any>,
  assignment: any,
  teacherName: string = 'Giáo viên'
): void {
  const { rows, info } = prepareGradebookData(students, submissions, assignment, teacherName);

  const aoaData: any[][] = [];

  // Tiêu đề & Thông tin đầu file
  aoaData.push(['BẢNG ĐIỂM BÀI KIỂM TRA TRỰC TUYẾN']);
  aoaData.push([`Bài kiểm tra: ${info.testTitle}`, '', `Lớp: ${info.className}`, '', `Giáo viên: ${info.teacherName}`]);
  aoaData.push([`Ngày giao: ${info.assignedDate}`, '', `Hạn nộp: ${info.dueDate}`, '', `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`]);
  aoaData.push([]); // Dòng trống

  // Header bảng
  const headers = [
    'STT',
    'Mã học sinh',
    'Họ và Tên',
    'Mã đề',
    'Bắt đầu làm',
    'Nộp bài',
    'Thời gian làm',
    'Điểm trắc nghiệm',
    'Điểm tự luận',
    'Tổng điểm',
    'Trạng thái'
  ];
  aoaData.push(headers);

  // Dữ liệu từng học sinh
  rows.forEach(r => {
    aoaData.push([
      r.stt,
      r.studentId,
      r.displayName,
      r.variantCode || '',
      r.startTimeStr,
      r.submitTimeStr,
      r.durationStr,
      r.mcqStr,
      r.essayStr,
      r.numericScore !== null ? r.numericScore : r.scoreStr,
      r.statusStr
    ]);
  });

  // Hàng trống và Khối Thống kê ở cuối
  aoaData.push([]);
  aoaData.push(['THỐNG KÊ KẾT QUẢ']);
  aoaData.push(['Tổng sĩ số:', info.totalStudents]);
  aoaData.push(['Đã nộp bài:', info.submittedCount]);
  aoaData.push(['Chưa nộp bài:', info.totalStudents - info.submittedCount]);
  aoaData.push(['Điểm trung bình:', info.avgScore]);
  aoaData.push(['Điểm cao nhất:', info.highestScore]);
  aoaData.push(['Điểm thấp nhất:', info.lowestScore]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Đặt độ rộng các cột tối ưu
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Mã HS
    { wch: 26 }, // Họ tên
    { wch: 10 }, // Mã đề
    { wch: 20 }, // Bắt đầu làm
    { wch: 20 }, // Nộp bài
    { wch: 15 }, // Thời gian làm
    { wch: 16 }, // Trắc nghiệm
    { wch: 14 }, // Tự luận
    { wch: 12 }, // Tổng điểm
    { wch: 14 }  // Trạng thái
  ];

  const safeClassName = (info.className || 'Lop').replace(/[\s\/\\:*?"<>|]+/g, '_');
  const safeTitle = (info.testTitle || 'KiemTra').replace(/[\s\/\\:*?"<>|]+/g, '_');
  
  XLSX.utils.book_append_sheet(wb, ws, 'Bang_Diem');
  const fileName = `Bang_diem_${safeClassName}_${safeTitle}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Xuất file PDF Tổng hợp kết quả học tập (A4 Portrait/Landscape, chia trang không cắt dòng)
 */
export async function exportPeriodSummaryPdf(
  students: Array<{ id: string; displayName?: string }>,
  getStudentStats: (studentId: string) => { avg: string; count: number },
  className: string,
  timeFilterText: string,
  teacherName: string = 'Giáo viên',
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Đang chuẩn bị dữ liệu tổng hợp...');

  const rows = students.map((s, idx) => {
    const stats = getStudentStats(s.id);
    return {
      stt: idx + 1,
      name: s.displayName || 'Không tên',
      count: stats.count,
      avg: stats.avg
    };
  });

  // Chia 20 học sinh mỗi trang cho trang Portrait
  const pageSize = 20;
  const pageChunks: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += pageSize) {
    pageChunks.push(rows.slice(i, i + pageSize));
  }
  if (pageChunks.length === 0) pageChunks.push([]);

  const mountContainer = document.createElement('div');
  mountContainer.style.position = 'fixed';
  mountContainer.style.left = '-9999px';
  mountContainer.style.top = '0';
  mountContainer.style.width = '800px';
  mountContainer.style.zIndex = '-1000';
  mountContainer.style.background = '#ffffff';
  document.body.appendChild(mountContainer);

  try {
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 10;
    const printableWidthMm = pageWidthMm - marginMm * 2;
    const printableHeightMm = pageHeightMm - marginMm * 2;

    for (let pageIdx = 0; pageIdx < pageChunks.length; pageIdx++) {
      onProgress?.(`Đang tạo trang ${pageIdx + 1}/${pageChunks.length}...`);
      const isFirst = pageIdx === 0;
      const isLast = pageIdx === pageChunks.length - 1;
      const curRows = pageChunks[pageIdx];

      const pageEl = document.createElement('div');
      pageEl.style.width = '800px';
      pageEl.style.minHeight = '1120px';
      pageEl.style.maxHeight = '1120px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.padding = '32px 36px';
      pageEl.style.fontFamily = 'Arial, sans-serif';
      pageEl.style.color = '#1f2937';
      pageEl.style.background = '#ffffff';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';

      let html = '<div>';
      if (isFirst) {
        html += `
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e40af; text-transform: uppercase;">
              TỔNG HỢP KẾT QUẢ HỌC TẬP
            </h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Hệ thống Quản lý và Học tập Trực tuyến</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 18px; margin-bottom: 16px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div><span style="color: #64748b;">Thời gian:</span> <strong>${timeFilterText}</strong></div>
            <div><span style="color: #64748b;">Lớp học:</span> <strong style="color: #2563eb;">${className}</strong></div>
            <div><span style="color: #64748b;">Giáo viên:</span> <strong>${teacherName}</strong></div>
            <div><span style="color: #64748b;">Tổng số học sinh:</span> <strong>${students.length}</strong></div>
          </div>
        `;
      } else {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 8px;">
            <div style="font-size: 15px; font-weight: bold; color: #1e40af;">
              TỔNG HỢP KẾT QUẢ HỌC TẬP (Tiếp theo) - Lớp ${className}
            </div>
            <div style="font-size: 12px; color: #64748b;">Trang ${pageIdx + 1}/${pageChunks.length}</div>
          </div>
        `;
      }

      html += `
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #1e293b; font-weight: bold;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; width: 60px; text-align: center;">STT</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px 14px; text-align: left;">Họ và Tên</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; width: 140px; text-align: center;">Số bài đã làm</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; width: 150px; text-align: center; color: #1e40af;">Điểm trung bình</th>
            </tr>
          </thead>
          <tbody>
      `;

      curRows.forEach((r, rIdx) => {
        const rowBg = rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
        html += `
          <tr style="background-color: ${rowBg};">
            <td style="border: 1px solid #cbd5e1; padding: 7px; text-align: center; color: #64748b;">${r.stt}</td>
            <td style="border: 1px solid #cbd5e1; padding: 7px 14px; font-weight: 500; color: #0f172a;">${r.name}</td>
            <td style="border: 1px solid #cbd5e1; padding: 7px; text-align: center;">${r.count}</td>
            <td style="border: 1px solid #cbd5e1; padding: 7px; text-align: center; font-weight: bold; color: #2563eb;">${r.avg}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        </div>
      `;

      // Footer
      html += `
        <div style="margin-top: 14px;">
          ${isLast ? `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; font-size: 12px;">
              <div style="text-align: center; width: 220px;">
                <div><em>Ngày ..... tháng ..... năm 20...</em></div>
                <div style="font-weight: bold; margin-top: 4px;">GIÁO VIÊN BỘ MÔN</div>
                <div style="height: 44px;"></div>
                <div style="font-weight: 500;">${teacherName}</div>
              </div>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 11px; color: #94a3b8;">
            <div>Xuất ngày: ${new Date().toLocaleString('vi-VN')}</div>
            <div>Trang ${pageIdx + 1} / ${pageChunks.length}</div>
          </div>
        </div>
      `;

      pageEl.innerHTML = html;
      mountContainer.innerHTML = '';
      mountContainer.appendChild(pageEl);

      await new Promise(res => setTimeout(res, 80));

      const canvas = await html2canvasPro(pageEl, { scale: 2, backgroundColor: '#ffffff' });
      if (pageIdx > 0) pdf.addPage();
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, printableHeightMm);
    }

    const safeClass = (className || 'Lop').replace(/[\s\/\\:*?"<>|]+/g, '_');
    pdf.save(`Tong_hop_ket_qua_${safeClass}_${Date.now()}.pdf`);
  } finally {
    if (document.body.contains(mountContainer)) {
      document.body.removeChild(mountContainer);
    }
  }
}

/**
 * Xuất file Excel (.xlsx) Tổng hợp kết quả học tập
 */
export function exportPeriodSummaryExcel(
  students: Array<{ id: string; displayName?: string }>,
  getStudentStats: (studentId: string) => { avg: string; count: number },
  className: string,
  timeFilterText: string,
  teacherName: string = 'Giáo viên'
): void {
  const aoaData: any[][] = [];

  aoaData.push(['TỔNG HỢP KẾT QUẢ HỌC TẬP']);
  aoaData.push([`Lớp: ${className}`, '', `Thời gian: ${timeFilterText}`, '', `Giáo viên: ${teacherName}`]);
  aoaData.push([`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`]);
  aoaData.push([]);

  aoaData.push(['STT', 'Mã học sinh', 'Họ và Tên', 'Số bài đã làm', 'Điểm trung bình']);

  let totalAvg = 0;
  let validAvgCount = 0;

  students.forEach((s, idx) => {
    const stats = getStudentStats(s.id);
    const numAvg = parseFloat(stats.avg);
    if (!isNaN(numAvg)) {
      totalAvg += numAvg;
      validAvgCount++;
    }

    aoaData.push([
      idx + 1,
      s.id,
      s.displayName || 'Không tên',
      stats.count,
      stats.avg
    ]);
  });

  aoaData.push([]);
  aoaData.push(['THỐNG KÊ LỚP HỌC']);
  aoaData.push(['Tổng số học sinh:', students.length]);
  aoaData.push(['Điểm trung bình toàn lớp:', validAvgCount > 0 ? (totalAvg / validAvgCount).toFixed(2) : '-']);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 18 }
  ];

  const safeClass = (className || 'Lop').replace(/[\s\/\\:*?"<>|]+/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, 'Tong_Hop');
  XLSX.writeFile(wb, `Tong_hop_ket_qua_${safeClass}_${Date.now()}.xlsx`);
}

