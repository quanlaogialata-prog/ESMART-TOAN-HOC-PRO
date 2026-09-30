/**
 * Tiện ích quản lý và phân loại năm học (Academic / School Year)
 * Áp dụng chuẩn hệ thống giáo dục Việt Nam (Bắt đầu từ tháng 8 - tháng 9 hàng năm)
 */

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Nếu tháng >= 8 (bắt đầu năm học mới từ tháng 8/9): năm học là YYYY - (YYYY+1)
  // Nếu tháng < 8 (vẫn trong học kỳ 2): năm học là (YYYY-1) - YYYY
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function normalizeSchoolYear(sy?: string | null): string {
  if (!sy) return '';
  return sy.toString().replace(/\s+/g, '').trim();
}

export function formatSchoolYear(sy?: string | null): string {
  if (!sy) return formatSchoolYear(getCurrentSchoolYear());
  const norm = normalizeSchoolYear(sy);
  const parts = norm.split('-');
  if (parts.length === 2) {
    return `${parts[0]} - ${parts[1]}`;
  }
  return sy.toString().trim();
}

/**
 * Danh sách các năm học tiêu chuẩn xung quanh năm học hiện tại
 */
export function getStandardSchoolYears(extraYears?: string[]): string[] {
  const current = getCurrentSchoolYear();
  const startYear = parseInt(current.split('-')[0], 10);
  
  const yearsSet = new Set<string>();
  // Thêm 1 năm tới và 4 năm trước
  yearsSet.add(`${startYear + 1}-${startYear + 2}`);
  yearsSet.add(current);
  yearsSet.add(`${startYear - 1}-${startYear}`);
  yearsSet.add(`${startYear - 2}-${startYear - 1}`);
  yearsSet.add(`${startYear - 3}-${startYear - 2}`);

  if (extraYears) {
    extraYears.forEach(y => {
      if (y) {
        const norm = normalizeSchoolYear(y);
        if (norm) yearsSet.add(norm);
      }
    });
  }

  // Sắp xếp giảm dần (năm mới nhất ở trên đầu)
  return Array.from(yearsSet).sort((a, b) => {
    const startA = parseInt(a.split('-')[0] || '0', 10);
    const startB = parseInt(b.split('-')[0] || '0', 10);
    return startB - startA;
  });
}

/**
 * Kiểm tra xem một đối tượng có khớp với bộ lọc năm học hay không
 * @param itemYear Năm học của bản ghi (có thể là chuỗi hoặc mảng chuỗi)
 * @param filterYear Năm học đang được chọn trên bộ lọc UI ('all' hoặc '2026-2027'...)
 */
export function matchesSchoolYear(itemYear?: string | string[] | null, filterYear?: string | null): boolean {
  if (!filterYear || filterYear === 'all') {
    return true;
  }

  const normFilter = normalizeSchoolYear(filterYear);

  // Nếu bản ghi chưa có trường năm học (dữ liệu cũ trong hệ thống),
  // mặc định xếp vào năm học hiện tại để không bị ẩn/mất dữ liệu khi xem năm học hiện tại
  if (!itemYear) {
    return normFilter === normalizeSchoolYear(getCurrentSchoolYear());
  }

  if (Array.isArray(itemYear)) {
    if (itemYear.length === 0) {
      return normFilter === normalizeSchoolYear(getCurrentSchoolYear());
    }
    return itemYear.some(y => normalizeSchoolYear(y) === normFilter);
  }

  return normalizeSchoolYear(itemYear) === normFilter;
}

/**
 * So sánh 2 năm học để sắp xếp
 */
export function compareSchoolYears(a?: string | null, b?: string | null, order: 'desc' | 'asc' = 'desc'): number {
  const current = getCurrentSchoolYear();
  const yearA = a ? normalizeSchoolYear(a) : current;
  const yearB = b ? normalizeSchoolYear(b) : current;
  
  const startA = parseInt(yearA.split('-')[0] || '0', 10);
  const startB = parseInt(yearB.split('-')[0] || '0', 10);

  if (order === 'desc') {
    return startB - startA;
  }
  return startA - startB;
}
