export const topicsData = [
  {
    id: 'topic-1',
    grade: 9,
    name: 'Chương 1: Phương trình và Hệ phương trình',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-2',
    grade: 9,
    name: 'Chương 2: Căn bậc hai và Căn bậc ba',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-3',
    grade: 9,
    name: 'Chương 3: Hàm số y = ax^2 và Phương trình bậc hai',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-4',
    grade: 9,
    name: 'Chương 4: Bất đẳng thức và Bất phương trình',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-5',
    grade: 9,
    name: 'Chương 5: Tỉ số lượng giác và Hệ thức lượng',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-6',
    grade: 9,
    name: 'Chương 6: Đường tròn và Góc với đường tròn',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-7',
    grade: 9,
    name: 'Chương 7: Hình học không gian (Nón, Trụ, Cầu)',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-8',
    grade: 9,
    name: 'Chương 8: Thống kê và Xác suất',
    isSpecial: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'topic-9',
    grade: 9,
    name: 'Chuyên đề Ôn thi vào 10: Giải bài toán bằng cách lập PT, HPT',
    isSpecial: true,
    createdAt: new Date().toISOString()
  }
];

export const lessonsData = [
  {
    id: 'lesson-1-1',
    topicId: 'topic-1',
    title: 'Phương trình quy về phương trình bậc nhất một ẩn',
    knowledge: '1. Định nghĩa: ax + b = 0 (a != 0)\n2. Phương trình tích (ax+b)(cx+d)=0\n3. Phương trình chứa ẩn ở mẫu: Tìm ĐKXĐ, quy đồng, khử mẫu.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-2-1',
    topicId: 'topic-2',
    title: 'Căn bậc hai và Căn thức bậc hai',
    knowledge: '1. Căn bậc hai số học của a >= 0 là x >= 0 sao cho x^2 = a.\n2. Căn thức bậc hai √A xác định khi A >= 0.\n3. Hằng đẳng thức √(A^2) = |A|.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-3-1',
    topicId: 'topic-3',
    title: 'Hàm số y = ax^2 (a != 0)',
    knowledge: '1. Đồ thị là parabol đi qua gốc tọa độ O.\n2. Nếu a > 0 đồ thị nằm trên trục hoành, O là điểm thấp nhất.\n3. Nếu a < 0 đồ thị nằm dưới trục hoành, O là điểm cao nhất.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-3-2',
    topicId: 'topic-3',
    title: 'Phương trình bậc hai một ẩn và Định lí Viète',
    knowledge: '1. Phương trình ax^2 + bx + c = 0 (a != 0).\n2. Biệt thức Delta = b^2 - 4ac.\n3. Định lí Viète: x1 + x2 = -b/a; x1.x2 = c/a.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-6-1',
    topicId: 'topic-6',
    title: 'Góc nội tiếp và Tứ giác nội tiếp',
    knowledge: '1. Góc nội tiếp có số đo bằng nửa số đo cung bị chắn.\n2. Tứ giác nội tiếp có tổng hai góc đối bằng 180 độ.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-8-1',
    topicId: 'topic-8',
    title: 'Tần số, Tần số tương đối và Xác suất',
    knowledge: '1. Tần số: Số lần xuất hiện của một giá trị.\n2. Không gian mẫu: Tập hợp tất cả các kết quả có thể xảy ra của phép thử.',
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    createdAt: new Date().toISOString()
  }
];

export const testsData = [
  {
    id: 'test-1-mcq',
    title: 'Đề kiểm tra: Căn bậc hai (Trắc nghiệm)',
    type: 'mcq',
    lessonId: 'lesson-2-1',
    topicId: 'topic-2',
    durationMinutes: 45,
    createdAt: new Date().toISOString(),
    questionsData: JSON.stringify([
      {
        question: 'Căn bậc hai số học của 144 là',
        options: ['13', '-12', '12 và -12', '12'],
        correctAnswer: 3,
        level: 'nhan_biet'
      },
      {
        question: 'Điều kiện để biểu thức √(4-2x) xác định là',
        options: ['x <= 2', 'x > 2', 'x != 2', 'x >= 2'],
        correctAnswer: 0,
        level: 'thong_hieu'
      },
      {
        question: 'Kết quả của phép tính √( (2-√5)^2 ) - √5 là',
        options: ['2√5 - 2', '-2', '2', '2 - 2√5'],
        correctAnswer: 1,
        level: 'van_dung'
      }
    ]),
    fileUrl: '',
    rubricUrl: ''
  },
  {
    id: 'test-2-mcq',
    title: 'Đề kiểm tra: Hàm số y=ax^2 và PT bậc hai',
    type: 'mcq',
    lessonId: 'lesson-3-2',
    topicId: 'topic-3',
    durationMinutes: 45,
    createdAt: new Date().toISOString(),
    questionsData: JSON.stringify([
      {
        question: 'Trong các phương trình sau, phương trình nào là phương trình bậc hai một ẩn?',
        options: ['3x^2 - 2√x + 1 = 0', '2x^2 - 2022 = 0', '3x + 1/x - 5 = 0', '4x - 1 = 0'],
        correctAnswer: 1,
        level: 'nhan_biet'
      },
      {
        question: 'Nghiệm của phương trình x^2 - 3x - 6 = 0 có tổng x1 + x2 bằng',
        options: ['3', '-3', '6', '-6'],
        correctAnswer: 0,
        level: 'thong_hieu'
      },
      {
        question: 'Tìm m để phương trình x^2 + x + m + 1 = 0 có hai nghiệm thỏa mãn x1^2 + x2^2 = 5.',
        options: ['m = -3', 'm = 1', 'm = 2', 'm = 0'],
        correctAnswer: 0,
        level: 'van_dung'
      }
    ]),
    fileUrl: '',
    rubricUrl: ''
  },
  {
    id: 'test-3-essay',
    title: 'Kiểm tra Tự luận: Giải bài toán bằng cách lập PT',
    type: 'essay',
    topicId: 'topic-9',
    durationMinutes: 60,
    createdAt: new Date().toISOString(),
    questionsData: '[]',
    fileUrl: '',
    rubricUrl: 'Đặt ẩn và điều kiện đúng (2đ), Biểu diễn các đại lượng (3đ), Lập được PT/HPT (2đ), Giải đúng (2đ), Kết luận (1đ).',
    essayPrompt: 'Một xe tải đi từ tỉnh A đến tỉnh B cách nhau 100km. Lúc về xe đi nhanh hơn lúc đi 10km/h. Tổng thời gian cả đi và về là 4h30p. Tính vận tốc lúc đi.'
  }
];
