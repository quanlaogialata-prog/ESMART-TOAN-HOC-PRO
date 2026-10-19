export interface CurriculumQuestion {
  id: string;
  type: 'mcq' | 'tf' | 'short' | 'essay';
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation: string;
  reference?: {
    topic: string;
    curriculumLesson: string;
    cognitiveLevel: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
    competency: string;
    coreKnowledge: string;
    variationGuide: string;
  };
  figureType?: 'svg' | 'table' | 'none';
  figureSvg?: string;
  figureTable?: string;
  figureDescription?: string;
}

// Ngân hàng câu hỏi chuẩn GDPT phân theo khối lớp và dạng bài
export const CURRICULUM_BANK: Record<number, CurriculumQuestion[]> = {
  12: [
    // --- PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (MCQ) ---
    {
      id: "q12_p1_1",
      type: "mcq",
      question: "Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = x(x - 1)(x + 2)^2$ với mọi $x \\in \\mathbb{R}$. Số điểm cực trị của hàm số đã cho là",
      options: [
        "A. $1$",
        "B. $2$",
        "C. $3$",
        "D. $4$"
      ],
      correctAnswer: "B",
      points: 0.25,
      explanation: "Ta có $f'(x) = 0 \\Leftrightarrow x = 0,\\ x = 1,\\ x = -2$.\n- Nghiệm $x = -2$ là nghiệm bội chẵn nên đạo hàm $f'(x)$ không đổi dấu khi qua $x = -2$.\n- Nghiệm $x = 0$ và $x = 1$ là các nghiệm đơn (bội lẻ) nên đạo hàm $f'(x)$ đổi dấu khi qua các điểm này.\nDo đó hàm số có đúng 2 điểm cực trị.\nChọn B.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Cực trị của hàm số",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Điểm cực trị là điểm mà tại đó đạo hàm đổi dấu (nghiệm bội lẻ)",
        variationGuide: "Đổi các thừa số của f'(x) thành các đa thức bậc khác"
      }
    },
    {
      id: "q12_p1_2",
      type: "mcq",
      question: "Đường tiệm cận đứng của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$ có phương trình là",
      options: [
        "A. $x = 2$",
        "B. $x = -1$",
        "C. $y = 2$",
        "D. $y = -1$"
      ],
      correctAnswer: "B",
      points: 0.25,
      explanation: "Tập xác định: $D = \\mathbb{R} \\setminus \\{-1\\}$.\nTa có $\\lim_{x \\to (-1)^+} \\frac{2x - 1}{x + 1} = -\\infty$ và $\\lim_{x \\to (-1)^-} \\frac{2x - 1}{x + 1} = +\\infty$.\nDo đó, đường tiệm cận đứng của đồ thị hàm số là $x = -1$.\nChọn B.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Đường tiệm cận của đồ thị hàm số",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tiệm cận đứng của phân thức ax+b/cx+d là x = -d/c",
        variationGuide: "Thay đổi hệ số tử và mẫu số"
      }
    },
    {
      id: "q12_p1_3",
      type: "mcq",
      question: "Giá trị lớn nhất của hàm số $f(x) = x^3 - 3x + 2$ trên đoạn $[0; 2]$ bằng",
      options: [
        "A. $4$",
        "B. $2$",
        "C. $0$",
        "D. $1$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Xét hàm số $f(x) = x^3 - 3x + 2$ trên $[0; 2]$.\nĐạo hàm: $f'(x) = 3x^2 - 3 = 3(x^2 - 1)$.\nCho $f'(x) = 0 \\Leftrightarrow x = 1$ (nhận vì $1 \\in [0; 2]$) hoặc $x = -1$ (loại).\nTính các giá trị:\n- $f(0) = 2$\n- $f(1) = 1 - 3 + 2 = 0$\n- $f(2) = 2^3 - 3(2) + 2 = 8 - 6 + 2 = 4$\nSo sánh các giá trị, ta có giá trị lớn nhất là $\\max_{[0; 2]} f(x) = f(2) = 4$.\nChọn A.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Giá trị lớn nhất và nhỏ nhất của hàm số",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "GTLN, GTNN trên đoạn [a; b] tìm tại các nghiệm f'=0 và 2 đầu mút",
        variationGuide: "Thay đổi hàm số bậc ba hoặc đoạn khảo sát"
      }
    },
    {
      id: "q12_p1_4",
      type: "mcq",
      question: "Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - y + 3z - 5 = 0$. Một vectơ pháp tuyến của $(P)$ có tọa độ là",
      options: [
        "A. $\\vec{n}_1 = (2; -1; 3)$",
        "B. $\\vec{n}_2 = (2; 1; 3)$",
        "C. $\\vec{n}_3 = (2; -1; -5)$",
        "D. $\\vec{n}_4 = (3; -1; 2)$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Mặt phẳng có phương trình tổng quát $(P): Ax + By + Cz + D = 0$ nhận vectơ $\\vec{n} = (A; B; C)$ làm vectơ pháp tuyến.\nVới phương trình $2x - y + 3z - 5 = 0$, ta có $A = 2,\\ B = -1,\\ C = 3$.\nVậy một vectơ pháp tuyến của $(P)$ là $\\vec{n}_1 = (2; -1; 3)$.\nChọn A.",
      reference: {
        topic: "Phương pháp tọa độ trong không gian",
        curriculumLesson: "Toán 12 - Chương 2: Phương trình mặt phẳng",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Vectơ pháp tuyến của Ax+By+Cz+D=0 là (A; B; C)",
        variationGuide: "Thay đổi phương trình mặt phẳng"
      }
    },
    {
      id: "q12_p1_5",
      type: "mcq",
      question: "Tập xác định của hàm số $y = \\log_3(x - 2)$ là",
      options: [
        "A. $(2; +\\infty)$",
        "B. $[2; +\\infty)$",
        "C. $(-\\infty; 2)$",
        "D. $\\mathbb{R} \\setminus \\{2\\}$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Hàm số logarit $y = \\log_a(u(x))$ xác định khi và chỉ khi biểu thức dưới dấu logarit dương:\n$x - 2 > 0 \\Leftrightarrow x > 2$.\nVậy tập xác định của hàm số là $D = (2; +\\infty)$.\nChọn A.",
      reference: {
        topic: "Hàm số mũ và hàm số logarit",
        curriculumLesson: "Toán 12: Hàm số logarit",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Điều kiện xác định của log_a(u) là u > 0",
        variationGuide: "Đổi cơ số và biểu thức bậc nhất/bậc hai trong logarit"
      }
    },
    {
      id: "q12_p1_6",
      type: "mcq",
      question: "Họ nguyên hàm của hàm số $f(x) = e^{2x} + 2x$ là",
      options: [
        "A. $\\frac{1}{2}e^{2x} + x^2 + C$",
        "B. $2e^{2x} + 2 + C$",
        "C. $e^{2x} + x^2 + C$",
        "D. $\\frac{1}{2}e^{2x} + 2x^2 + C$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Ta có $\\int f(x)\\,dx = \\int (e^{2x} + 2x)\\,dx = \\frac{1}{2}e^{2x} + x^2 + C$.\nChọn A.",
      reference: {
        topic: "Nguyên hàm - Tích phân",
        curriculumLesson: "Toán 12 - Chương 4: Nguyên hàm",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Nguyên hàm của e^(ax+b) là (1/a)e^(ax+b) + C",
        variationGuide: "Đổi hàm số mũ và đa thức"
      }
    },
    {
      id: "q12_p1_7",
      type: "mcq",
      question: "Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ và có bảng xét dấu đạo hàm như sau:\n\n| $x$ | $-\\infty$ | | $-1$ | | $0$ | | $2$ | | $+\\infty$ |\n| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n| $f'(x)$ | | $+$ | $0$ | $-$ | $0$ | $+$ | $0$ | $-$ | |\n\nHàm số đã cho đồng biến trên khoảng nào dưới đây?",
      options: [
        "A. $(-\\infty; -1)$",
        "B. $(-1; 2)$",
        "C. $(0; +\\infty)$",
        "D. $(-1; 0)$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Từ bảng xét dấu của $f'(x)$, ta thấy $f'(x) > 0$ trên các khoảng $(-\\infty; -1)$ và $(0; 2)$.\nDo đó, hàm số đồng biến trên các khoảng $(-\\infty; -1)$ và $(0; 2)$.\nĐối chiếu với các đáp án, chọn A.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Tính đơn điệu của hàm số",
        cognitiveLevel: "Thông hiểu",
        competency: "Đọc hiểu bảng biến thiên",
        coreKnowledge: "Hàm số đồng biến khi f'(x) > 0",
        variationGuide: "Đổi bảng xét dấu đạo hàm"
      }
    },
    {
      id: "q12_p1_8",
      type: "mcq",
      question: "Trong không gian $Oxyz$, khoảng cách từ điểm $M(1; 2; -3)$ đến mặt phẳng $(P): 2x - 2y + z - 6 = 0$ bằng",
      options: [
        "A. $\\frac{11}{3}$",
        "B. $3$",
        "C. $\\frac{7}{3}$",
        "D. $5$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Khoảng cách từ điểm $M(x_0; y_0; z_0)$ đến mặt phẳng $(P): Ax + By + Cz + D = 0$ tính theo công thức:\n$$d(M, (P)) = \\frac{|A x_0 + B y_0 + C z_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}$$\nThay số: $d(M, (P)) = \\frac{|2(1) - 2(2) + 1(-3) - 6|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{|2 - 4 - 3 - 6|}{\\sqrt{4 + 4 + 1}} = \\frac{|-11|}{\\sqrt{9}} = \\frac{11}{3}$.\nChọn A.",
      reference: {
        topic: "Phương pháp tọa độ trong không gian",
        curriculumLesson: "Toán 12 - Chương 2: Khoảng cách trong không gian",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Công thức tính khoảng cách từ một điểm đến mặt phẳng",
        variationGuide: "Thay đổi tọa độ điểm M và phương trình mặt phẳng"
      }
    },
    {
      id: "q12_p1_9",
      type: "mcq",
      question: "Nếu $\\int_{1}^{2} f(x)\\,dx = 3$ và $\\int_{1}^{2} g(x)\\,dx = -2$ thì $\\int_{1}^{2} [2f(x) - 3g(x)]\\,dx$ bằng",
      options: [
        "A. $12$",
        "B. $0$",
        "C. $6$",
        "D. $7$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Theo tính chất tuyến tính của tích phân:\n$$\\int_{1}^{2} [2f(x) - 3g(x)]\\,dx = 2\\int_{1}^{2} f(x)\\,dx - 3\\int_{1}^{2} g(x)\\,dx = 2(3) - 3(-2) = 6 + 6 = 12.$$\nChọn A.",
      reference: {
        topic: "Nguyên hàm - Tích phân",
        curriculumLesson: "Toán 12 - Chương 4: Tính chất của tích phân",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tính chất tích phân: int(af + bg) = a*int(f) + b*int(g)",
        variationGuide: "Đổi các hệ số tuyến tính"
      }
    },
    {
      id: "q12_p1_10",
      type: "mcq",
      question: "Tọa độ tâm $I$ và bán kính $R$ của mặt cầu $(S): (x - 1)^2 + (y + 2)^2 + (z - 4)^2 = 16$ là",
      options: [
        "A. $I(1; -2; 4)$ và $R = 4$",
        "B. $I(-1; 2; -4)$ và $R = 4$",
        "C. $I(1; -2; 4)$ và $R = 16$",
        "D. $I(-1; 2; -4)$ và $R = 16$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Phương trình mặt cầu có dạng chuẩn: $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$.\nTừ phương trình đã cho ta có:\n- Tâm $I(a; b; c) = (1; -2; 4)$.\n- Bán kính $R = \\sqrt{16} = 4$.\nChọn A.",
      reference: {
        topic: "Phương pháp tọa độ trong không gian",
        curriculumLesson: "Toán 12 - Chương 2: Phương trình mặt cầu",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Phương trình mặt cầu tâm I(a; b; c) bán kính R",
        variationGuide: "Thay đổi tâm I và bán kính R"
      }
    },
    {
      id: "q12_p1_11",
      type: "mcq",
      question: "Cho hàm số $y = \\frac{x+2}{x-1}$. Mệnh đề nào sau đây đúng?",
      options: [
        "A. Hàm số nghịch biến trên từng khoảng xác định $(-\\infty; 1)$ và $(1; +\\infty)$",
        "B. Hàm số đồng biến trên từng khoảng xác định $(-\\infty; 1)$ và $(1; +\\infty)$",
        "C. Hàm số đồng biến trên $\\mathbb{R} \\setminus \\{1\\}$",
        "D. Hàm số nghịch biến trên $\\mathbb{R}$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Tập xác định: $D = \\mathbb{R} \\setminus \\{1\\}$.\nĐạo hàm: $y' = \\frac{1(-1) - 2(1)}{(x-1)^2} = \\frac{-3}{(x-1)^2} < 0,\\ \\forall x \\ne 1$.\nVì $y' < 0$ trên mỗi khoảng xác định nên hàm số nghịch biến trên từng khoảng $(-\\infty; 1)$ và $(1; +\\infty)$.\nChọn A.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Tính đơn điệu hàm số phân thức bậc nhất",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Đạo hàm của (ax+b)/(cx+d) là (ad-bc)/(cx+d)^2",
        variationGuide: "Đổi các hệ số a, b, c, d"
      }
    },
    {
      id: "q12_p1_12",
      type: "mcq",
      question: "Gieo đồng thời hai con xúc xắc cân đối và đồng chất. Xác suất để tổng số chấm xuất hiện trên hai mặt bằng $7$ là",
      options: [
        "A. $\\frac{1}{6}$",
        "B. $\\frac{7}{36}$",
        "C. $\\frac{5}{36}$",
        "D. $\\frac{1}{12}$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Số phần tử của không gian mẫu: $n(\\Omega) = 6 \\times 6 = 36$.\nGọi biến cố $A$: \"Tổng số chấm xuất hiện trên hai mặt bằng 7\".\nCác kết quả thuận lợi cho $A$ là: $(1; 6), (2; 5), (3; 4), (4; 3), (5; 2), (6; 1)$.\nSố kết quả thuận lợi: $n(A) = 6$.\nXác suất cần tìm: $P(A) = \\frac{n(A)}{n(\\Omega)} = \\frac{6}{36} = \\frac{1}{6}$.\nChọn A.",
      reference: {
        topic: "Xác suất",
        curriculumLesson: "Toán 12 - Chương 6: Xác suất cổ điển",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Công thức xác suất cổ điển P(A) = n(A) / n(Omega)",
        variationGuide: "Thay đổi tổng số chấm yêu cầu (ví dụ: tổng bằng 8, 9, 10)"
      }
    },

    // --- PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (TF) ---
    {
      id: "q12_p2_1",
      type: "tf",
      question: "Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các mệnh đề sau:",
      options: [
        "a) Đạo hàm của hàm số là $f'(x) = 3x^2 - 6x$",
        "b) Hàm số đồng biến trên khoảng $(0; 2)$",
        "c) Điểm cực tiểu của đồ thị hàm số có tọa độ là $(2; -2)$",
        "d) Giá trị cực đại của hàm số bằng $2$"
      ],
      correctAnswer: "a-Đ, b-S, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Xét hàm số $f(x) = x^3 - 3x^2 + 2$:\n- Ý a: $f'(x) = 3x^2 - 6x$. Mệnh đề đúng.\n- Ý b: $f'(x) = 0 \\Leftrightarrow 3x(x - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Trong khoảng $(0; 2)$, ta có $f'(x) < 0$ nên hàm số nghịch biến trên khoảng $(0; 2)$. Mệnh đề b sai.\n- Ý c: Bảng biến thiên cho thấy tại $x = 2$, hàm số đạt cực tiểu. $f(2) = 2^3 - 3(2^2) + 2 = 8 - 12 + 2 = -2$. Do đó điểm cực tiểu của đồ thị là $(2; -2)$. Mệnh đề đúng.\n- Ý d: Tại $x = 0$, hàm số đạt cực đại và giá trị cực đại là $f(0) = 2$. Mệnh đề đúng.\nKết luận: a-Đ, b-S, c-Đ, d-Đ.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Khảo sát sự biến thiên và vẽ đồ thị hàm số",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Khảo sát hàm số bậc ba: đạo hàm, tính đơn điệu, cực trị",
        variationGuide: "Thay đổi các hệ số của hàm số bậc ba"
      }
    },
    {
      id: "q12_p2_2",
      type: "tf",
      question: "Trong không gian với hệ tọa độ $Oxyz$, cho hai điểm $A(1; 2; 3)$ và $B(3; 0; -1)$. Xét tính đúng/sai của các khẳng định sau:",
      options: [
        "a) Tọa độ trung điểm $M$ của đoạn thẳng $AB$ là $M(2; 1; 1)$",
        "b) Vectơ $\\overrightarrow{AB} = (2; -2; -4)$",
        "c) Độ dài đoạn thẳng $AB = 2\\sqrt{6}$",
        "d) Mặt phẳng trung trực của đoạn thẳng $AB$ có phương trình là $x - y - 2z + 1 = 0$"
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Ta có $A(1; 2; 3)$ và $B(3; 0; -1)$:\n- Ý a: Tọa độ trung điểm $M$ của $AB$: $M\\left(\\frac{1+3}{2}; \\frac{2+0}{2}; \\frac{3-1}{2}\\right) = M(2; 1; 1)$. Mệnh đề đúng.\n- Ý b: $\\overrightarrow{AB} = (3-1; 0-2; -1-3) = (2; -2; -4)$. Mệnh đề đúng.\n- Ý c: $AB = |\\overrightarrow{AB}| = \\sqrt{2^2 + (-2)^2 + (-4)^2} = \\sqrt{4 + 4 + 16} = \\sqrt{24} = 2\\sqrt{6}$. Mệnh đề đúng.\n- Ý d: Mặt phẳng trung trực của $AB$ đi qua trung điểm $M(2; 1; 1)$ và nhận $\\vec{n} = \\frac{1}{2}\\overrightarrow{AB} = (1; -1; -2)$ làm VTPT.\nPhương trình: $1(x - 2) - 1(y - 1) - 2(z - 1) = 0 \\Leftrightarrow x - y - 2z - 2 + 1 + 2 = 0 \\Leftrightarrow x - y - 2z + 1 = 0$. Mệnh đề đúng.\nKết luận: a-Đ, b-Đ, c-Đ, d-Đ.",
      reference: {
        topic: "Phương pháp tọa độ trong không gian",
        curriculumLesson: "Toán 12 - Chương 2: Tọa độ điểm và vectơ",
        cognitiveLevel: "Vận dụng",
        competency: "Tư duy và giải quyết vấn đề toán học",
        coreKnowledge: "Trung điểm, độ dài vectơ, mặt phẳng trung trực",
        variationGuide: "Thay đổi tọa độ 2 điểm A và B"
      }
    },
    {
      id: "q12_p2_3",
      type: "tf",
      question: "Cho hàm số $f(x) = \\frac{2x - 1}{x + 1}$. Xét tính đúng/sai của các mệnh đề sau:",
      options: [
        "a) Đồ thị hàm số có tiệm cận ngang là đường thẳng $y = 2$",
        "b) Đồ thị hàm số có tiệm cận đứng là đường thẳng $x = 1$",
        "c) Hàm số đồng biến trên khoảng $(-\\infty; -1)$",
        "d) Giao điểm của hai đường tiệm cận là điểm $I(-1; 2)$"
      ],
      correctAnswer: "a-Đ, b-S, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Hàm số $f(x) = \\frac{2x - 1}{x + 1}$ ($x \\ne -1$):\n- Ý a: $\\lim_{x \\to \\pm\\infty} \\frac{2x - 1}{x + 1} = 2 \\Rightarrow$ tiệm cận ngang $y = 2$. Mệnh đề đúng.\n- Ý b: Tiệm cận đứng là $x = -1$ (không phải $x = 1$). Mệnh đề sai.\n- Ý c: $f'(x) = \\frac{2(1) - (-1)(1)}{(x+1)^2} = \\frac{3}{(x+1)^2} > 0,\\ \\forall x \\ne -1$. Do đó hàm số đồng biến trên khoảng $(-\\infty; -1)$. Mệnh đề đúng.\n- Ý d: Giao điểm hai đường tiệm cận là $I(-1; 2)$. Mệnh đề đúng.\nKết luận: a-Đ, b-S, c-Đ, d-Đ.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Đường tiệm cận của đồ thị hàm số",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tiệm cận đứng, ngang và giao điểm tiệm cận của hàm bậc nhất/bậc nhất",
        variationGuide: "Đổi phân thức bậc nhất"
      }
    },
    {
      id: "q12_p2_4",
      type: "tf",
      question: "Cho hình lăng trụ đứng $ABC.A'B'C'$ có đáy $ABC$ là tam giác vuông tại $B$, $AB = a$, $BC = a\\sqrt{3}$, cạnh bên $AA' = 2a$. Xét tính đúng/sai của các mệnh đề sau:",
      options: [
        "a) Thể tích khối lăng trụ $ABC.A'B'C'$ là $V = a^3\\sqrt{3}$",
        "b) Đường thẳng $B'C$ vuông góc với mặt phẳng $(ABB'A')$",
        "c) Khoảng cách giữa hai đường thẳng $AA'$ và $BC$ bằng $a$",
        "d) Góc giữa đường thẳng $A'C$ và mặt phẳng đáy $(ABC)$ bằng $45^\\circ$"
      ],
      correctAnswer: "a-Đ, b-S, c-Đ, d-Đ",
      points: 1.0,
      explanation: "- Ý a: Diện tích đáy: $S_{ABC} = \\frac{1}{2}AB \\cdot BC = \\frac{1}{2}a \\cdot a\\sqrt{3} = \\frac{a^2\\sqrt{3}}{2}$.\nThể tích: $V = S_{ABC} \\cdot AA' = \\frac{a^2\\sqrt{3}}{2} \\cdot 2a = a^3\\sqrt{3}$. Mệnh đề đúng.\n- Ý b: Ta có $BC \\perp AB$ và $BC \\perp AA'$ nên $BC \\perp (ABB'A')$. Đường thẳng $B'C$ không vuông góc với $(ABB'A')$. Mệnh đề sai.\n- Ý c: $AA' \\parallel BB' \\Rightarrow AA' \\parallel (BCC'B')$. Do đó $d(AA', BC) = d(AA', (BCC'B')) = d(A, (BCC'B')) = AB = a$. Mệnh đề đúng.\n- Ý d: Hình chiếu vuông góc của $A'C$ lên $(ABC)$ là $AC$.\nDo đó góc giữa $A'C$ và $(ABC)$ là $\\widehat{A'CA}$.\nTam giác $ABC$ vuông tại $B \\Rightarrow AC = \\sqrt{AB^2 + BC^2} = \\sqrt{a^2 + 3a^2} = 2a$.\nTam giác $A'AC$ vuông tại $A$ có $AA' = 2a,\\ AC = 2a \\Rightarrow \\tan\\widehat{A'CA} = \\frac{AA'}{AC} = 1 \\Rightarrow \\widehat{A'CA} = 45^\\circ$. Mệnh đề đúng.\nKết luận: a-Đ, b-S, c-Đ, d-Đ.",
      reference: {
        topic: "Khối đa diện và thể tích",
        curriculumLesson: "Toán 12 - Chương 2: Thể tích khối lăng trụ đứng",
        cognitiveLevel: "Vận dụng",
        competency: "Tư duy không gian và giải quyết vấn đề",
        coreKnowledge: "Thể tích lăng trụ đứng, khoảng cách và góc trong không gian",
        variationGuide: "Thay đổi kích thước các cạnh"
      }
    },

    // --- PHẦN III: TRẢ LỜI NGẮN (SHORT ANSWER) ---
    {
      id: "q12_p3_1",
      type: "short",
      question: "Tìm số điểm cực trị của hàm số $y = x^4 - 2x^2 + 3$.",
      options: [],
      correctAnswer: "3",
      points: 0.5,
      explanation: "Tập xác định: $D = \\mathbb{R}$.\nĐạo hàm: $y' = 4x^3 - 4x = 4x(x^2 - 1)$.\nCho $y' = 0 \\Leftrightarrow x = 0$ hoặc $x = 1$ hoặc $x = -1$.\nPhương trình $y' = 0$ có 3 nghiệm đơn phân biệt, do đó đạo hàm đổi dấu 3 lần.\nVậy hàm số có đúng 3 điểm cực trị.\nĐáp số: 3.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Cực trị hàm số trùng phương",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Số cực trị hàm số trùng phương: ab < 0 có 3 cực trị, ab >= 0 có 1 cực trị",
        variationGuide: "Thay đổi hệ số a và b"
      }
    },
    {
      id: "q12_p3_2",
      type: "short",
      question: "Tính tích phân $I = \\int_{0}^{1} (3x^2 + 2x)\\,dx$.",
      options: [],
      correctAnswer: "2",
      points: 0.5,
      explanation: "Ta có $I = \\int_{0}^{1} (3x^2 + 2x)\\,dx = \\left[ x^3 + x^2 \\right]_{0}^{1} = (1^3 + 1^2) - (0^3 + 0^2) = 2$.\nĐáp số: 2.",
      reference: {
        topic: "Nguyên hàm - Tích phân",
        curriculumLesson: "Toán 12 - Chương 4: Tính tích phân hàm đa thức",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Công thức Newton-Leibniz",
        variationGuide: "Đổi cận và bậc của đa thức"
      }
    },
    {
      id: "q12_p3_3",
      type: "short",
      question: "Trong không gian $Oxyz$, cho mặt cầu $(S): x^2 + y^2 + z^2 - 2x + 4y - 6z - 11 = 0$. Tính bán kính $R$ của mặt cầu $(S)$.",
      options: [],
      correctAnswer: "5",
      points: 0.5,
      explanation: "Phương trình mặt cầu có dạng $x^2 + y^2 + z^2 - 2ax - 2by - 2cz + d = 0$.\nTa có: $a = 1,\\ b = -2,\\ c = 3,\\ d = -11$.\nBán kính mặt cầu là: $R = \\sqrt{a^2 + b^2 + c^2 - d} = \\sqrt{1^2 + (-2)^2 + 3^2 - (-11)} = \\sqrt{1 + 4 + 9 + 11} = \\sqrt{25} = 5$.\nĐáp số: 5.",
      reference: {
        topic: "Phương pháp tọa độ trong không gian",
        curriculumLesson: "Toán 12 - Chương 2: Phương trình mặt cầu",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Công thức tính bán kính mặt cầu dạng khai triển",
        variationGuide: "Thay đổi các hệ số của mặt cầu"
      }
    },
    {
      id: "q12_p3_4",
      type: "short",
      question: "Có bao nhiêu giá trị nguyên của tham số $m \\in [-10; 10]$ để hàm số $y = \\frac{x - 2}{x - m}$ đồng biến trên khoảng $(2; +\\infty)$?",
      options: [],
      correctAnswer: "12",
      points: 0.5,
      explanation: "Tập xác định: $D = \\mathbb{R} \\setminus \\{m\\}$.\nĐạo hàm: $y' = \\frac{-m + 2}{(x - m)^2}$.\nĐể hàm số đồng biến trên khoảng $(2; +\\infty)$ thì:\n1) $y' > 0 \\Leftrightarrow -m + 2 > 0 \\Leftrightarrow m < 2$.\n2) Điểm gián đoạn $x = m \\notin (2; +\\infty) \\Leftrightarrow m \\le 2$.\nKết hợp các điều kiện: $\\begin{cases} m < 2 \\\\ m \\le 2 \\end{cases}$ suy ra $m < 2$.\nVì $m \\in [-10; 10]$ và $m \\in \\mathbb{Z}$ nên $m \\in \\{-10, -9, -8, \\dots, 0, 1\\}$.\nSố giá trị nguyên của $m$ thỏa mãn là: $1 - (-10) + 1 = 12$ giá trị.\nĐáp số: 12.",
      reference: {
        topic: "Ứng dụng đạo hàm để khảo sát hàm số",
        curriculumLesson: "Toán 12 - Chương 1: Tìm m để hàm số đơn điệu",
        cognitiveLevel: "Vận dụng",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Hàm phân thức bậc nhất đồng biến khi ad-bc > 0",
        variationGuide: "Thay đổi đoạn của tham số m"
      }
    },
    {
      id: "q12_p3_5",
      type: "short",
      question: "Một hộp chứa $5$ quả cầu đỏ và $7$ quả cầu xanh có kích thước như nhau. Lấy ngẫu nhiên đồng thời $3$ quả cầu. Tính xác suất để lấy được đúng $2$ quả cầu đỏ (kết quả làm tròn dưới dạng phân số tối giản $a/b$, ví dụ 7/44).",
      options: [],
      correctAnswer: "7/22",
      points: 0.5,
      explanation: "Tổng số quả cầu trong hộp là $5 + 7 = 12$ quả.\nSố cách chọn ngẫu nhiên 3 quả từ 12 quả: $n(\\Omega) = C_{12}^3 = \\frac{12 \\times 11 \\times 10}{6} = 220$.\nSố cách chọn đúng 2 quả đỏ và 1 quả xanh là:\n$n(A) = C_5^2 \\times C_7^1 = 10 \\times 7 = 70$.\nXác suất cần tìm: $P(A) = \\frac{70}{220} = \\frac{7}{22}$.\nĐáp số: 7/22.",
      reference: {
        topic: "Xác suất",
        curriculumLesson: "Toán 12 - Chương 6: Quy tắc cộng và nhân xác suất",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tổ hợp và xác suất lấy mẫu không hoàn lại",
        variationGuide: "Thay đổi số lượng quả cầu các màu"
      }
    },
    {
      id: "q12_p3_6",
      type: "short",
      question: "Số nghiệm của phương trình $\\cos 2x - 3\\cos x + 2 = 0$ trên đoạn $[0; 2\\pi]$ là bao nhiêu?",
      options: [],
      correctAnswer: "4",
      points: 0.5,
      explanation: "Biến đổi phương trình về $\\cos x$:\n$$\\cos 2x - 3\\cos x + 2 = 0 \\Leftrightarrow (2\\cos^2 x - 1) - 3\\cos x + 2 = 0 \\Leftrightarrow 2\\cos^2 x - 3\\cos x + 1 = 0.$$\nGiải phương trình bậc hai theo $\\cos x$:\n- $\\cos x = 1 \\Rightarrow x = k2\\pi$. Trên đoạn $[0; 2\\pi]$, ta có 2 nghiệm: $x = 0$ và $x = 2\\pi$.\n- $\\cos x = \\frac{1}{2} \\Rightarrow x = \\pm \\frac{\\pi}{3} + k2\\pi$. Trên đoạn $[0; 2\\pi]$, ta có 2 nghiệm: $x = \\frac{\\pi}{3}$ và $x = \\frac{5\\pi}{3}$.\nNhư vậy có tất cả 4 nghiệm phân biệt trên $[0; 2\\pi]$ gồm: $\\{0; \\frac{\\pi}{3}; \\frac{5\\pi}{3}; 2\\pi\\}$.\nĐáp số: 4.",
      reference: {
        topic: "Lượng giác",
        curriculumLesson: "Toán 11 & 12: Phương trình lượng giác cơ bản",
        cognitiveLevel: "Vận dụng",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Giải phương trình bậc hai đối với một hàm số lượng giác",
        variationGuide: "Thay đổi khoảng/đoạn xét nghiệm"
      }
    }
  ],
  8: [
    // ==========================================
    // KHỐI 8: TOÁN LỚP 8 (SGK KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
    // ĐẦY ĐỦ 10 CHƯƠNG VỚI CÁC PHẦN MCQ, TF, SHORT, ESSAY
    // ==========================================

    // --- CHƯƠNG 1: ĐA THỨC NHIỀU BIẾN VÀ CÁC PHÉP TOÁN ---
    {
      id: "q8_ch1_mcq1",
      type: "mcq",
      question: "Bậc của đa thức $A = 4x^3y^2 - 5x^2y^4 + 7xy - 1$ là",
      options: ["A. $5$", "B. $6$", "C. $7$", "D. $4$"],
      correctAnswer: "B",
      points: 0.25,
      explanation: "Đa thức đã cho có các hạng tử với bậc lần lượt là $5$, $6$, $2$, $0$. Bậc của đa thức là bậc cao nhất trong dạng thu gọn, tức là $6$.\nChọn B.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Đa thức nhiều biến",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Bậc của đa thức là bậc của hạng tử có bậc cao nhất",
        variationGuide: "Thay đổi số mũ của các biến"
      }
    },
    {
      id: "q8_ch1_mcq2",
      type: "mcq",
      question: "Thu gọn đa thức $P = 2x^2y + 3xy^2 - 5x^2y + xy^2$ ta được",
      options: ["A. $-3x^2y + 4xy^2$", "B. $3x^2y + 4xy^2$", "C. $-3x^2y + 2xy^2$", "D. $-7x^2y + 4xy^2$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Nhóm các đơn thức đồng dạng: $P = (2 - 5)x^2y + (3 + 1)xy^2 = -3x^2y + 4xy^2$.\nChọn A.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Cộng trừ đa thức nhiều biến",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Cộng trừ các đơn thức đồng dạng để thu gọn đa thức",
        variationGuide: "Đổi hệ số các hạng tử"
      }
    },
    {
      id: "q8_ch1_tf1",
      type: "tf",
      question: "Cho hai đa thức $A = 3x^2y - 2xy^2 + 5$ và $B = x^2y + 2xy^2 - 1$. Xét tính đúng sai của các khẳng định sau:",
      options: [
        "a) Bậc của đa thức $A$ là $3$.",
        "b) Tổng $A + B = 4x^2y + 4$.",
        "c) Hiệu $A - B = 2x^2y - 4xy^2 + 6$.",
        "d) Tại $x = 1, y = 2$, giá trị của đa thức $A$ bằng $3$."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Kiểm tra từng ý:\n- Ý a: Các hạng tử của $A$ có bậc cao nhất là $2+1=3$. -> Đúng.\n- Ý b: $A + B = (3+1)x^2y + (-2+2)xy^2 + (5-1) = 4x^2y + 4$. -> Đúng.\n- Ý c: $A - B = (3-1)x^2y + (-2-2)xy^2 + (5-(-1)) = 2x^2y - 4xy^2 + 6$. -> Đúng.\n- Ý d: $A(1,2) = 3(1)^2(2) - 2(1)(2)^2 + 5 = 6 - 8 + 5 = 3$. -> Đúng.\nKết luận: a-Đ, b-Đ, c-Đ, d-Đ.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Các phép toán trên đa thức nhiều biến",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Cộng, trừ và tính giá trị đa thức nhiều biến",
        variationGuide: "Thay đổi biểu thức A, B"
      }
    },
    {
      id: "q8_ch1_short1",
      type: "short",
      question: "Tính giá trị của đa thức $M = 2x^2y - 3xy + 4$ tại $x = 2$ và $y = -1$.",
      options: [],
      correctAnswer: "2",
      points: 0.5,
      explanation: "Thay $x = 2, y = -1$ vào $M$:\n$M = 2(2)^2(-1) - 3(2)(-1) + 4 = 2(4)(-1) + 6 + 4 = -8 + 10 = 2$.\nĐáp số: 2.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Giá trị của đa thức",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tính giá trị biểu thức đại số tại điểm",
        variationGuide: "Đổi giá trị x, y"
      }
    },
    {
      id: "q8_ch1_essay1",
      type: "essay",
      question: "Cho hai đa thức $P = 5x^2y - 3xy^2 + 2x - 1$ và $Q = -2x^2y + 3xy^2 - 5x + 7$.\na) Tính tổng $P + Q$ và tìm bậc của đa thức tổng.\nb) Tính giá trị của $P + Q$ tại $x = 1, y = 3$.",
      options: [],
      correctAnswer: "a) 3x^2y - 3x + 6, bậc 3; b) 12",
      points: 2.0,
      explanation: "a) Ta có: $P + Q = (5 - 2)x^2y + (-3 + 3)xy^2 + (2 - 5)x + (-1 + 7) = 3x^2y - 3x + 6$.\nBậc của đa thức tổng là bậc của $3x^2y$, tức là $2 + 1 = 3$.\nb) Tại $x = 1, y = 3$: $(P + Q) = 3(1)^2(3) - 3(1) + 6 = 9 - 3 + 6 = 12$.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Cộng trừ đa thức",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Cộng trừ đa thức và tính giá trị",
        variationGuide: "Thay đổi biểu thức P và Q"
      }
    },
    {
      id: "q8_ch1_essay2",
      type: "essay",
      question: "Cho đa thức $A = 2x^2y - 4xy + 3x^2y - xy + 5$ và đa thức $B = x^2y + 5xy - 3$.\na) Thu gọn đa thức $A$ và xác định bậc của đa thức $A$.\nb) Tìm đa thức $C = A - B$.\nc) Tính giá trị của đa thức $C$ tại $x = -1$ và $y = 2$.",
      options: [],
      correctAnswer: "a) A = 5x^2y - 5xy + 5 (bậc 3); b) C = 4x^2y - 10xy + 8; c) 36",
      points: 2.0,
      explanation: "a) Thu gọn $A$: $A = (2 + 3)x^2y + (-4 - 1)xy + 5 = 5x^2y - 5xy + 5$. Hạng tử có bậc cao nhất là $5x^2y$ có bậc là $2 + 1 = 3$.\nb) $C = A - B = (5x^2y - 5xy + 5) - (x^2y + 5xy - 3) = 4x^2y - 10xy + 8$.\nc) Thay $x = -1, y = 2$ vào $C$:\n$C = 4(-1)^2(2) - 10(-1)(2) + 8 = 4(1)(2) + 20 + 8 = 8 + 20 + 8 = 36$.",
      reference: {
        topic: "Chương 1: Đa thức nhiều biến và các phép toán",
        curriculumLesson: "Toán 8 - Chương 1: Thu gọn và tính giá trị đa thức",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Thu gọn, trừ đa thức và tính giá trị biểu thức",
        variationGuide: "Đổi các hệ số số học và giá trị biến"
      }
    },

    // --- CHƯƠNG 2: HẰNG ĐẲNG THỨC ĐÁNG NHỚ VÀ PHÂN TÍCH ĐA THỨC THÀNH NHÂN TỬ ---
    {
      id: "q8_ch2_mcq1",
      type: "mcq",
      question: "Khai triển của hằng đẳng thức $(2x - 3y)^2$ là",
      options: [
        "A. $4x^2 - 12xy + 9y^2$",
        "B. $4x^2 - 6xy + 9y^2$",
        "C. $4x^2 + 12xy + 9y^2$",
        "D. $2x^2 - 12xy + 3y^2$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Áp dụng $(a - b)^2 = a^2 - 2ab + b^2$ với $a = 2x, b = 3y$: $(2x - 3y)^2 = 4x^2 - 12xy + 9y^2$.\nChọn A.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Bảy hằng đẳng thức đáng nhớ",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "(a - b)^2 = a^2 - 2ab + b^2",
        variationGuide: "Thay đổi hệ số"
      }
    },
    {
      id: "q8_ch2_mcq2",
      type: "mcq",
      question: "Phân tích đa thức $x^2 - 16y^2$ thành nhân tử ta được",
      options: [
        "A. $(x - 4y)(x + 4y)$",
        "B. $(x - 16y)(x + 16y)$",
        "C. $(x - 4y)^2$",
        "D. $(x + 4y)^2$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Áp dụng hằng đẳng thức hiệu hai bình phương $a^2 - b^2 = (a - b)(a + b)$ với $a = x, b = 4y$.\nChọn A.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Phân tích đa thức thành nhân tử",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "a^2 - b^2 = (a - b)(a + b)",
        variationGuide: "Đổi 16y^2 thành 25y^2"
      }
    },
    {
      id: "q8_ch2_tf1",
      type: "tf",
      question: "Cho các biểu thức liên quan đến hằng đẳng thức đáng nhớ lớp 8. Xét tính đúng sai:",
      options: [
        "a) $(x + y)^2 = x^2 + 2xy + y^2$ đúng với mọi số thực $x, y$.",
        "b) $(x - 2y)^2 = x^2 - 4xy + 4y^2$.",
        "c) $a^3 - b^3 = (a - b)(a^2 - ab + b^2)$.",
        "d) Giá trị của biểu thức $P = x^2 - 6x + 9$ tại $x = 13$ bằng $100$."
      ],
      correctAnswer: "a-Đ, b-Đ, c-S, d-Đ",
      points: 1.0,
      explanation: "Ý a đúng; Ý b đúng; Ý c sai vì đúng phải là $+ab$; Ý d: $P = (x-3)^2 = (13-3)^2 = 100$, đúng.\nKết luận: a-Đ, b-Đ, c-S, d-Đ.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Bảy hằng đẳng thức đáng nhớ",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Nhận dạng và vận dụng 7 hằng đẳng thức",
        variationGuide: "Đổi biểu thức P"
      }
    },
    {
      id: "q8_ch2_short1",
      type: "short",
      question: "Tìm giá trị của $x$ biết: $(x + 2)^2 - x(x - 3) = 18$.",
      options: [],
      correctAnswer: "2",
      points: 0.5,
      explanation: "Khai triển: $x^2 + 4x + 4 - x^2 + 3x = 18 \\Leftrightarrow 7x + 4 = 18 \\Leftrightarrow 7x = 14 \\Leftrightarrow x = 2$.\nĐáp số: 2.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Vận dụng hằng đẳng thức tìm x",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Khai triển hằng đẳng thức để giải phương trình",
        variationGuide: "Đổi các hệ số"
      }
    },
    {
      id: "q8_ch2_essay1",
      type: "essay",
      question: "a) Rút gọn biểu thức: $A = (2x + 1)^2 - (2x - 1)^2 - 8x$.\nb) Phân tích đa thức sau thành nhân tử: $B = x^3 - 4x^2 + 4x$.\nc) Tìm giá trị của $x$ để đa thức $B = 0$.",
      options: [],
      correctAnswer: "a) 0; b) x(x - 2)^2; c) x = 0 hoặc x = 2",
      points: 2.0,
      explanation: "a) Áp dụng hằng đẳng thức hiệu hai bình phương:\n$A = [(2x + 1) - (2x - 1)][(2x + 1) + (2x - 1)] - 8x = (2)(4x) - 8x = 8x - 8x = 0$.\nb) Đặt nhân tử chung $x$: $B = x(x^2 - 4x + 4) = x(x - 2)^2$.\nc) $B = 0 \\Leftrightarrow x(x - 2)^2 = 0 \\Leftrightarrow x = 0$ hoặc $x - 2 = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Rút gọn biểu thức và phân tích đa thức",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Hằng đẳng thức đáng nhớ, phân tích đa thức thành nhân tử",
        variationGuide: "Đổi các hệ số hằng đẳng thức"
      }
    },
    {
      id: "q8_ch2_essay2",
      type: "essay",
      question: "Cho biểu thức: $P = (x + 3)(x^2 - 3x + 9) - (x - 2)(x^2 + 2x + 4)$.\na) Rút gọn biểu thức $P$.\nb) Chứng minh rằng giá trị của biểu thức $P$ không phụ thuộc vào giá trị của biến $x$.",
      options: [],
      correctAnswer: "a) P = 35; b) P = 35 là hằng số",
      points: 1.5,
      explanation: "a) Áp dụng hằng đẳng thức tổng hai lập phương và hiệu hai lập phương:\n$(x + 3)(x^2 - 3x + 9) = x^3 + 3^3 = x^3 + 27$.\n$(x - 2)(x^2 + 2x + 4) = x^3 - 2^3 = x^3 - 8$.\nDo đó: $P = (x^3 + 27) - (x^3 - 8) = x^3 + 27 - x^3 + 8 = 35$.\nb) Vì kết quả $P = 35$ là một hằng số không chứa biến $x$, nên giá trị của biểu thức $P$ luôn bằng $35$ với mọi giá trị của $x$, tức là không phụ thuộc vào giá trị của biến $x$.",
      reference: {
        topic: "Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử",
        curriculumLesson: "Toán 8 - Chương 2: Hằng đẳng thức lập phương",
        cognitiveLevel: "Vận dụng cao",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tổng và hiệu hai lập phương",
        variationGuide: "Đổi các hằng số 2 và 3"
      }
    },

    // --- CHƯƠNG 3: TỨ GIÁC ---
    {
      id: "q8_ch3_mcq1",
      type: "mcq",
      question: "Tứ giác có hai đường chéo cắt nhau tại trung điểm của mỗi đường là hình gì?",
      options: [
        "A. Hình bình hành",
        "B. Hình thang cân",
        "C. Hình thang vuông",
        "D. Tứ giác thường"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Theo dấu hiệu nhận biết hình bình hành: Tứ giác có hai đường chéo cắt nhau tại trung điểm mỗi đường là hình bình hành.\nChọn A.",
      reference: {
        topic: "Chương 3: Tứ giác",
        curriculumLesson: "Toán 8 - Chương 3: Hình bình hành",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Dấu hiệu nhận biết hình bình hành qua đường chéo",
        variationGuide: "Hỏi về hình thoi hoặc hình chữ nhật"
      }
    },
    {
      id: "q8_ch3_mcq2",
      type: "mcq",
      question: "Tổng các góc của một tứ giác lồi bằng",
      options: ["A. $360^\\circ$", "B. $180^\\circ$", "C. $270^\\circ$", "D. $540^\\circ$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Định lý: Tổng bốn góc của một tứ giác lồi luôn bằng $360^\\circ$.\nChọn A.",
      reference: {
        topic: "Chương 3: Tứ giác",
        curriculumLesson: "Toán 8 - Chương 3: Định lý tổng các góc của tứ giác",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tổng bốn góc của tứ giác bằng 360 độ",
        variationGuide: "Cho 3 góc tính góc còn lại"
      }
    },
    {
      id: "q8_ch3_tf1",
      type: "tf",
      question: "Cho hình bình hành $ABCD$ có hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Xét tính đúng sai của các khẳng định sau:",
      options: [
        "a) $AB = CD$ và $AD = BC$.",
        "b) Điểm $O$ là trung điểm của cả $AC$ và $BD$.",
        "c) Nếu $AC = BD$ thì $ABCD$ trở thành hình thoi.",
        "d) Nếu $AC \\perp BD$ thì $ABCD$ là hình thoi."
      ],
      correctAnswer: "a-Đ, b-Đ, c-S, d-Đ",
      points: 1.0,
      explanation: "Phân tích:\n- Ý a: Các cạnh đối của hình bình hành bằng nhau. -> Đúng.\n- Ý b: Hai đường chéo cắt nhau tại trung điểm. -> Đúng.\n- Ý c: Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật, không phải hình thoi. -> Sai.\n- Ý d: Hình bình hành có hai đường chéo vuông góc là hình thoi. -> Đúng.\nKết luận: a-Đ, b-Đ, c-S, d-Đ.",
      reference: {
        topic: "Chương 3: Tứ giác",
        curriculumLesson: "Toán 8 - Chương 3: Hình bình hành và hình thoi",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Dấu hiệu nhận biết hình bình hành, hình chữ nhật, hình thoi",
        variationGuide: "Đổi sang hình chữ nhật"
      }
    },
    {
      id: "q8_ch3_short1",
      type: "short",
      question: "Cho tứ giác $ABCD$ có $\\widehat{A} = 70^\\circ, \\widehat{B} = 80^\\circ, \\widehat{C} = 100^\\circ$. Tính số đo góc $D$ (độ).",
      options: [],
      correctAnswer: "110",
      points: 0.5,
      explanation: "Tổng 4 góc tứ giác: $\\widehat{A} + \\widehat{B} + \\widehat{C} + \\widehat{D} = 360^\\circ \\Rightarrow \\widehat{D} = 360^\\circ - (70^\\circ + 80^\\circ + 100^\\circ) = 110^\\circ$.\nĐáp số: 110.",
      reference: {
        topic: "Chương 3: Tứ giác",
        curriculumLesson: "Toán 8 - Chương 3: Tính góc trong tứ giác",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tổng các góc trong tứ giác bằng 360 độ",
        variationGuide: "Đổi số đo 3 góc"
      }
    },
    {
      id: "q8_ch3_essay1",
      type: "essay",
      question: "Cho tam giác $ABC$ cân tại $A$. Gọi $M, N$ lần lượt là trung điểm của các cạnh $AB, AC$.\na) Chứng minh tứ giác $BMNC$ là hình thang cân.\nb) Biết $BC = 10\\text{ cm}$, tính độ dài đoạn thẳng $MN$.",
      options: [],
      correctAnswer: "a) BMNC là hình thang cân; b) MN = 5 cm",
      points: 2.0,
      explanation: "a) Vì $M, N$ là trung điểm $AB, AC$ nên $MN$ là đường trung bình của tam giác $ABC$. Do đó $MN // BC \\Rightarrow BMNC$ là hình thang. Mặt khác tam giác $ABC$ cân tại $A$ nên $\\widehat{B} = \\widehat{C}$. Hình thang có hai góc kề một đáy bằng nhau là hình thang cân.\nb) Đường trung bình $MN = \\frac{1}{2} BC = \\frac{10}{2} = 5\\text{ cm}$.",
      reference: {
        topic: "Chương 3: Tứ giác",
        curriculumLesson: "Toán 8 - Chương 3: Hình thang cân",
        cognitiveLevel: "Vận dụng",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Đường trung bình và chứng minh hình thang cân",
        variationGuide: "Đổi độ dài BC"
      }
    },

    // --- CHƯƠNG 4: ĐỊNH LÝ THALÈS TRONG TAM GIÁC ---
    {
      id: "q8_ch4_mcq1",
      type: "mcq",
      question: "Cho tam giác $ABC$, đường thẳng $d // BC$ cắt $AB, AC$ lần lượt tại $M, N$. Theo định lý Thalès, khẳng định nào đúng?",
      options: [
        "A. $\\frac{AM}{AB} = \\frac{AN}{AC}$",
        "B. $\\frac{AM}{MB} = \\frac{AC}{AN}$",
        "C. $\\frac{AM}{AN} = \\frac{AB}{MN}$",
        "D. $\\frac{MB}{AB} = \\frac{AN}{AC}$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Theo định lý Thalès: Đường thẳng song song với một cạnh của tam giác định ra trên hai cạnh còn lại các đoạn thẳng tương ứng tỉ lệ: $\\frac{AM}{AB} = \\frac{AN}{AC}$.\nChọn A.",
      reference: {
        topic: "Chương 4: Định lý Thalès trong tam giác",
        curriculumLesson: "Toán 8 - Chương 4: Định lý Thalès",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Định lý Thalès: MN // BC => AM/AB = AN/AC",
        variationGuide: "Đổi tên đỉnh"
      }
    },
    {
      id: "q8_ch4_mcq2",
      type: "mcq",
      question: "Cho tam giác $ABC$ có độ dài cạnh $BC = 12\\text{ cm}$. Đoạn thẳng nối trung điểm của hai cạnh $AB$ và $AC$ có độ dài bằng",
      options: ["A. $6\\text{ cm}$", "B. $24\\text{ cm}$", "C. $4\\text{ cm}$", "D. $8\\text{ cm}$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Đoạn thẳng nối trung điểm hai cạnh là đường trung bình của tam giác. Đường trung bình song song và bằng một nửa cạnh đáy: $MN = \\frac{1}{2} BC = 6\\text{ cm}$.\nChọn A.",
      reference: {
        topic: "Chương 4: Định lý Thalès trong tam giác",
        curriculumLesson: "Toán 8 - Chương 4: Đường trung bình của tam giác",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Độ dài đường trung bình bằng nửa cạnh đáy",
        variationGuide: "Đổi độ dài BC"
      }
    },
    {
      id: "q8_ch4_tf1",
      type: "tf",
      question: "Cho tam giác $ABC$ có $AB = 6\\text{ cm}, AC = 9\\text{ cm}$. Trên $AB$ lấy điểm $M$ sao cho $AM = 2\\text{ cm}$. Kẻ $MN // BC$ ($N \\in AC$). Xét tính đúng sai:",
      options: [
        "a) Tỉ số $\\frac{AM}{AB} = \\frac{1}{3}$.",
        "b) Theo định lý Thalès, $\\frac{AN}{AC} = \\frac{AM}{AB} = \\frac{1}{3}$.",
        "c) Độ dài đoạn thẳng $AN = 3\\text{ cm}$.",
        "d) Độ dài đoạn thẳng $NC = 6\\text{ cm}$."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Phân tích:\n- Ý a: $AM/AB = 2/6 = 1/3$. -> Đúng.\n- Ý b: Định lý Thalès $AN/AC = AM/AB = 1/3$. -> Đúng.\n- Ý c: $AN = \\frac{1}{3} AC = \\frac{1}{3} \\cdot 9 = 3\\text{ cm}$. -> Đúng.\n- Ý d: $NC = AC - AN = 9 - 3 = 6\\text{ cm}$. -> Đúng.\nKết luận: a-Đ, b-Đ, c-Đ, d-Đ.",
      reference: {
        topic: "Chương 4: Định lý Thalès trong tam giác",
        curriculumLesson: "Toán 8 - Chương 4: Vận dụng định lý Thalès",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Vận dụng định lý Thalès tính độ dài đoạn thẳng",
        variationGuide: "Đổi kích thước các đoạn thẳng"
      }
    },
    {
      id: "q8_ch4_short1",
      type: "short",
      question: "Cho tam giác $ABC$ có $AB = 10\\text{ cm}$. Lấy $M \\in AB$ sao cho $AM = 4\\text{ cm}$. Kẻ $MN // BC$ ($N \\in AC$). Biết $BC = 15\\text{ cm}$, tính độ dài $MN$ (cm).",
      options: [],
      correctAnswer: "6",
      points: 0.5,
      explanation: "Theo hệ quả định lý Thalès: $\\frac{MN}{BC} = \\frac{AM}{AB} = \\frac{4}{10} = \\frac{2}{5} \\Rightarrow MN = \\frac{2}{5} \\cdot 15 = 6\\text{ cm}$.\nĐáp số: 6.",
      reference: {
        topic: "Chương 4: Định lý Thalès trong tam giác",
        curriculumLesson: "Toán 8 - Chương 4: Hệ quả định lý Thalès",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Hệ quả định lý Thalès MN/BC = AM/AB",
        variationGuide: "Thay đổi số liệu"
      }
    },

    // --- CHƯƠNG 5: DỮ LIỆU VÀ BIỂU ĐỒ ---
    {
      id: "q8_ch5_mcq1",
      type: "mcq",
      question: "Biểu đồ thích hợp nhất để biểu diễn tỉ lệ phần trăm các thành phần trong một tổng thể là",
      options: [
        "A. Biểu đồ hình quạt tròn",
        "B. Biểu đồ đoạn thẳng",
        "C. Biểu đồ cột kép",
        "D. Biểu đồ tranh"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Biểu đồ hình quạt tròn biểu diễn tỉ lệ phần trăm của từng phần so với tổng thể 100%.\nChọn A.",
      reference: {
        topic: "Chương 5: Dữ liệu và biểu đồ",
        curriculumLesson: "Toán 8 - Chương 5: Biểu đồ hình quạt tròn",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Biểu đồ hình quạt tròn thể hiện cơ cấu phần trăm",
        variationGuide: "Hỏi về biểu đồ đoạn thẳng (thể hiện xu hướng theo thời gian)"
      }
    },
    {
      id: "q8_ch5_mcq2",
      type: "mcq",
      question: "Dữ liệu nào sau đây là dữ liệu định lượng?",
      options: [
        "A. Chiều cao của các bạn học sinh trong lớp (cm)",
        "B. Màu sắc yêu thích của các bạn học sinh",
        "C. Tên các môn học yêu thích",
        "D. Xếp loại hạnh kiểm học sinh (Tốt, Khá, Đạt)"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Dữ liệu định lượng là dữ liệu nhận giá trị bằng số (như chiều cao, cân nặng, điểm số).\nChọn A.",
      reference: {
        topic: "Chương 5: Dữ liệu và biểu đồ",
        curriculumLesson: "Toán 8 - Chương 5: Thu thập và phân loại dữ liệu",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Phân biệt dữ liệu định tính và định lượng",
        variationGuide: "Đổi các ví dụ dữ liệu"
      }
    },
    {
      id: "q8_ch5_tf1",
      type: "tf",
      question: "Một cuộc khảo sát 200 học sinh khối 8 về phương tiện đến trường cho kết quả: Xe đạp 50%, Đi bộ 30%, Xe buýt 15%, Xe máy điện 5%. Xét tính đúng sai:",
      options: [
        "a) Số học sinh đi xe đạp là 100 học sinh.",
        "b) Số học sinh đi bộ là 60 học sinh.",
        "c) Biểu đồ thích hợp nhất để biểu diễn kết quả này là biểu đồ hình quạt tròn.",
        "d) Số học sinh đi xe buýt nhiều hơn số học sinh đi xe máy điện là 15 học sinh."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-S",
      points: 1.0,
      explanation: "Tính toán:\n- Xe đạp: 50% * 200 = 100. -> Đúng.\n- Đi bộ: 30% * 200 = 60. -> Đúng.\n- Dạng tỉ lệ cơ cấu dùng biểu đồ quạt tròn. -> Đúng.\n- Xe buýt: 15% * 200 = 30; Xe máy điện: 5% * 200 = 10. Chênh lệch là 30 - 10 = 20 học sinh, không phải 15. -> Sai.\nKết luận: a-Đ, b-Đ, c-Đ, d-S.",
      reference: {
        topic: "Chương 5: Dữ liệu và biểu đồ",
        curriculumLesson: "Toán 8 - Chương 5: Phân tích số liệu thống kê",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tính số lượng từ tỉ lệ phần trăm trên biểu đồ",
        variationGuide: "Đổi số học sinh khảo sát"
      }
    },
    {
      id: "q8_ch5_short1",
      type: "short",
      question: "Một cuộc khảo sát gồm 300 học sinh lớp 8 có 40% học sinh yêu thích môn Toán. Tính số học sinh yêu thích môn Toán.",
      options: [],
      correctAnswer: "120",
      points: 0.5,
      explanation: "Số học sinh yêu thích môn Toán: $300 \\times 40\\% = 300 \\times 0.4 = 120$ học sinh.\nĐáp số: 120.",
      reference: {
        topic: "Chương 5: Dữ liệu và biểu đồ",
        curriculumLesson: "Toán 8 - Chương 5: Tính toán từ số liệu thống kê",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tính giá trị phần trăm của một tập dữ liệu",
        variationGuide: "Đổi số học sinh và phần trăm"
      }
    },

    // --- CHƯƠNG 6: PHÂN THỨC ĐẠI SỐ VÀ CÁC PHÉP TÍNH ---
    {
      id: "q8_ch6_mcq1",
      type: "mcq",
      question: "Điều kiện xác định của phân thức đại số $\\frac{2x - 1}{x - 3}$ là",
      options: ["A. $x \\neq 3$", "B. $x \\neq -3$", "C. $x \\neq \\frac{1}{2}$", "D. $x \\in \\mathbb{R}$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Phân thức đại số xác định khi mẫu thức khác 0: $x - 3 \\neq 0 \\Leftrightarrow x \\neq 3$.\nChọn A.",
      reference: {
        topic: "Chương 6: Phân thức đại số và các phép tính",
        curriculumLesson: "Toán 8 - Chương 6: Điều kiện xác định của phân thức đại số",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Điều kiện xác định của phân thức đại số là mẫu khác 0",
        variationGuide: "Đổi mẫu thức thành x + a"
      }
    },
    {
      id: "q8_ch6_mcq2",
      type: "mcq",
      question: "Rút gọn phân thức $\\frac{x^2 - 9}{x - 3}$ (với $x \\neq 3$) ta được",
      options: ["A. $x + 3$", "B. $x - 3$", "C. $x + 9$", "D. $3$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Phân tích tử thức thành nhân tử: $\\frac{(x - 3)(x + 3)}{x - 3} = x + 3$.\nChọn A.",
      reference: {
        topic: "Chương 6: Phân thức đại số và các phép tính",
        curriculumLesson: "Toán 8 - Chương 6: Rút gọn phân thức đại số",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Rút gọn phân thức bằng cách chia cả tử và mẫu cho nhân tử chung",
        variationGuide: "Thay 9 thành 16 hoặc 25"
      }
    },
    {
      id: "q8_ch6_tf1",
      type: "tf",
      question: "Cho biểu thức $A = \\frac{x^2 - 4}{x + 2}$. Xét tính đúng sai của các khẳng định sau:",
      options: [
        "a) Điều kiện xác định của biểu thức $A$ là $x \\neq -2$.",
        "b) Với $x \\neq -2$, rút gọn biểu thức $A$ ta được $A = x - 2$.",
        "c) Tại $x = 10$, giá trị của biểu thức $A$ bằng $8$.",
        "d) Với mọi số thực $x$, biểu thức $A$ luôn nhận giá trị dương."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-S",
      points: 1.0,
      explanation: "Ý a: $x+2 \\neq 0 \\Leftrightarrow x \\neq -2$. Đúng;\nÝ b: $A = (x-2)(x+2)/(x+2) = x - 2$. Đúng;\nÝ c: $A(10) = 10 - 2 = 8$. Đúng;\nÝ d: Khi $x = 0 \\Rightarrow A = -2 < 0$, khẳng định luôn dương là sai.\nKết luận: a-Đ, b-Đ, c-Đ, d-S.",
      reference: {
        topic: "Chương 6: Phân thức đại số và các phép tính",
        curriculumLesson: "Toán 8 - Chương 6: Rút gọn và tính giá trị phân thức",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Điều kiện và rút gọn phân thức",
        variationGuide: "Thay đổi biểu thức A"
      }
    },
    {
      id: "q8_ch6_short1",
      type: "short",
      question: "Tính giá trị của phân thức $P = \\frac{x^2 - 16}{x - 4}$ tại $x = 24$.",
      options: [],
      correctAnswer: "28",
      points: 0.5,
      explanation: "Rút gọn $P = x + 4$. Thay $x = 24$: $P = 24 + 4 = 28$.\nĐáp số: 28.",
      reference: {
        topic: "Chương 6: Phân thức đại số và các phép tính",
        curriculumLesson: "Toán 8 - Chương 6: Rút gọn và tính giá trị phân thức",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Rút gọn trước khi thay số",
        variationGuide: "Đổi 16 thành 25 và x = 35"
      }
    },

    // --- CHƯƠNG 7: PHƯƠNG TRÌNH BẬC NHẤT MỘT ẨN VÀ HÀM SỐ BẬC NHẤT ---
    {
      id: "q8_ch7_mcq1",
      type: "mcq",
      question: "Hệ số góc của đường thẳng $y = -3x + 5$ là",
      options: ["A. $-3$", "B. $5$", "C. $3$", "D. $-5$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Hàm số bậc nhất $y = ax + b$ có hệ số góc là $a = -3$.\nChọn A.",
      reference: {
        topic: "Chương 7: Phương trình bậc nhất một ẩn và Hàm số bậc nhất",
        curriculumLesson: "Toán 8 - Chương 7: Hàm số bậc nhất y = ax + b",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Hệ số góc của đường thẳng y = ax + b là a",
        variationGuide: "Đổi hệ số a và b"
      }
    },
    {
      id: "q8_ch7_mcq2",
      type: "mcq",
      question: "Nghiệm của phương trình bậc nhất $2x - 8 = 0$ là",
      options: ["A. $x = 4$", "B. $x = -4$", "C. $x = 8$", "D. $x = 2$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Ta có $2x = 8 \\Leftrightarrow x = 4$.\nChọn A.",
      reference: {
        topic: "Chương 7: Phương trình bậc nhất một ẩn và Hàm số bậc nhất",
        curriculumLesson: "Toán 8 - Chương 7: Phương trình bậc nhất một ẩn",
        cognitiveLevel: "Nhận biết",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Giải phương trình bậc nhất ax + b = 0",
        variationGuide: "Đổi hệ số phương trình"
      }
    },
    {
      id: "q8_ch7_tf1",
      type: "tf",
      question: "Cho hàm số bậc nhất $y = f(x) = 2x - 4$. Xét tính đúng sai của các khẳng định sau:",
      options: [
        "a) Hàm số $y = 2x - 4$ có hệ số góc $a = 2 > 0$ nên đồng biến trên $\\mathbb{R}$.",
        "b) Đồ thị hàm số cắt trục hoành tại điểm $A(2; 0)$.",
        "c) Đồ thị hàm số cắt trục tung tại điểm $B(0; -4)$.",
        "d) Điểm $M(3; 5)$ thuộc đồ thị hàm số đã cho."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-S",
      points: 1.0,
      explanation: "Ý a: $a=2>0$ đồng biến. Đúng;\nÝ b: $y=0 \\Rightarrow 2x=4 \\Rightarrow x=2$. Đúng;\nÝ c: $x=0 \\Rightarrow y=-4$. Đúng;\nÝ d: $f(3) = 2(3) - 4 = 2 \\neq 5$. Sai.\nKết luận: a-Đ, b-Đ, c-Đ, d-S.",
      reference: {
        topic: "Chương 7: Phương trình bậc nhất một ẩn và Hàm số bậc nhất",
        curriculumLesson: "Toán 8 - Chương 7: Đồ thị hàm số bậc nhất",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tính đồng biến và tọa độ giao điểm của hàm số bậc nhất",
        variationGuide: "Đổi hàm số"
      }
    },
    {
      id: "q8_ch7_short1",
      type: "short",
      question: "Một người đi xe máy từ A đến B với vận tốc $40\\text{ km/h}$. Khi về người đó đi với vận tốc $30\\text{ km/h}$ nên thời gian về nhiều hơn thời gian đi là $45$ phút ($0.75$ giờ). Tính quãng đường AB (km).",
      options: [],
      correctAnswer: "90",
      points: 0.5,
      explanation: "Phương trình: $\\frac{x}{30} - \\frac{x}{40} = \\frac{3}{4} \\Leftrightarrow \\frac{x}{120} = \\frac{3}{4} \\Leftrightarrow x = 90\\text{ km}$.\nĐáp số: 90.",
      reference: {
        topic: "Chương 7: Phương trình bậc nhất một ẩn và Hàm số bậc nhất",
        curriculumLesson: "Toán 8 - Chương 7: Giải bài toán bằng cách lập phương trình",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Lập phương trình chuyển động",
        variationGuide: "Đổi vận tốc và thời gian"
      }
    },

    // --- CHƯƠNG 8: MỞ ĐẦU VỀ TÍNH XÁC SUẤT CỦA BIẾN CỐ ---
    {
      id: "q8_ch8_mcq1",
      type: "mcq",
      question: "Gieo một con xúc xắc 6 mặt cân đối một lần. Biến cố nào sau đây là biến cố chắc chắn?",
      options: [
        "A. Số chấm xuất hiện nhỏ hơn 7",
        "B. Số chấm xuất hiện là số chẵn",
        "C. Số chấm xuất hiện là số lẻ",
        "D. Số chấm xuất hiện bằng 6"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Con xúc xắc 6 mặt có các mặt $\{1, 2, 3, 4, 5, 6\}$, mọi số chấm đều nhỏ hơn 7 nên biến cố 'Số chấm nhỏ hơn 7' luôn xảy ra (biến cố chắc chắn).\nChọn A.",
      reference: {
        topic: "Chương 8: Mở đầu về tính xác suất của biến cố",
        curriculumLesson: "Toán 8 - Chương 8: Biến cố chắc chắn, không thể, ngẫu nhiên",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Định nghĩa biến cố chắc chắn",
        variationGuide: "Hỏi về biến cố không thể"
      }
    },
    {
      id: "q8_ch8_mcq2",
      type: "mcq",
      question: "Gieo một con xúc xắc 6 mặt cân đối một lần. Xác suất để xuất hiện mặt có số chấm là số chẵn bằng",
      options: ["A. $\\frac{1}{2}$", "B. $\\frac{1}{3}$", "C. $\\frac{1}{6}$", "D. $\\frac{2}{3}$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Các kết quả có thể là $\{1, 2, 3, 4, 5, 6\}$ (6 kết quả). Các kết quả thuận lợi cho mặt chẵn là $\{2, 4, 6\}$ (3 kết quả). Xác suất: $P = \\frac{3}{6} = \\frac{1}{2}$.\nChọn A.",
      reference: {
        topic: "Chương 8: Mở đầu về tính xác suất của biến cố",
        curriculumLesson: "Toán 8 - Chương 8: Xác suất của biến cố ngẫu nhiên",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Xác suất cổ điển P = số kết quả thuận lợi / tổng số kết quả",
        variationGuide: "Hỏi về số chấm là số nguyên tố"
      }
    },
    {
      id: "q8_ch8_tf1",
      type: "tf",
      question: "Một hộp chứa 10 tấm thẻ cùng loại được đánh số từ 1 đến 10. Rút ngẫu nhiên một tấm thẻ. Xét tính đúng sai:",
      options: [
        "a) Số kết quả có thể xảy ra của phép thử là 10.",
        "b) Biến cố 'Rút được thẻ ghi số 11' là biến cố không thể.",
        "c) Xác suất rút được tấm thẻ ghi số nguyên tố bằng $\\frac{2}{5}$.",
        "d) Xác suất rút được tấm thẻ ghi số chia hết cho 3 bằng $\\frac{3}{10}$."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-Đ",
      points: 1.0,
      explanation: "Phân tích:\n- Ý a: Có 10 tấm thẻ nên có 10 kết quả đồng khả năng. -> Đúng.\n- Ý b: Thẻ chỉ từ 1 đến 10 nên không thể rút được số 11. -> Đúng.\n- Ý c: Các số nguyên tố là $\{2, 3, 5, 7\}$ (4 số). Xác suất $P = 4/10 = 2/5$. -> Đúng.\n- Ý d: Các số chia hết cho 3 là $\{3, 6, 9\}$ (3 số). Xác suất $P = 3/10$. -> Đúng.\nKết luận: a-Đ, b-Đ, c-Đ, d-Đ.",
      reference: {
        topic: "Chương 8: Mở đầu về tính xác suất của biến cố",
        curriculumLesson: "Toán 8 - Chương 8: Xác suất của biến cố ngẫu nhiên trong trò chơi đơn giản",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Xác định số kết quả thuận lợi và tính xác suất",
        variationGuide: "Đổi số lượng thẻ"
      }
    },
    {
      id: "q8_ch8_short1",
      type: "short",
      question: "Một hộp có 5 viên bi xanh, 3 viên bi đỏ và 2 viên bi vàng có kích thước như nhau. Lấy ngẫu nhiên một viên bi. Tính xác suất lấy được viên bi màu xanh (viết dưới dạng số thập phân, ví dụ: 0.5).",
      options: [],
      correctAnswer: "0.5",
      points: 0.5,
      explanation: "Tổng số viên bi: $5 + 3 + 2 = 10$ viên bi. Số viên bi xanh là 5. Xác suất lấy được viên bi màu xanh: $P = \\frac{5}{10} = 0.5$.\nĐáp số: 0.5.",
      reference: {
        topic: "Chương 8: Mở đầu về tính xác suất của biến cố",
        curriculumLesson: "Toán 8 - Chương 8: Xác suất thực nghiệm và cổ điển",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tính xác suất biến cố lấy vật ngẫu nhiên",
        variationGuide: "Đổi số lượng các viên bi"
      }
    },

    // --- CHƯƠNG 9: TAM GIÁC ĐỒNG DẠNG VÀ ĐỊNH LÝ PYTHAGORE ĐẢO ---
    {
      id: "q8_ch9_mcq1",
      type: "mcq",
      question: "Cho tam giác $ABC$ đồng dạng với tam giác $DEF$ theo tỉ số đồng dạng $k = 2$. Tỉ số diện tích $\\frac{S_{\\Delta ABC}}{S_{\\Delta DEF}}$ bằng",
      options: ["A. $4$", "B. $2$", "C. $\\frac{1}{2}$", "D. $\\frac{1}{4}$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Tỉ số diện tích hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: $k^2 = 2^2 = 4$.\nChọn A.",
      reference: {
        topic: "Chương 9: Tam giác đồng dạng và Định lý Pythagore đảo",
        curriculumLesson: "Toán 8 - Chương 9: Định lý về hai tam giác đồng dạng",
        cognitiveLevel: "Thông hiểu",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Tỉ số diện tích bằng bình phương tỉ số đồng dạng",
        variationGuide: "Thay đổi k"
      }
    },
    {
      id: "q8_ch9_mcq2",
      type: "mcq",
      question: "Tam giác có độ dài ba cạnh nào sau đây là tam giác vuông (theo định lý Pythagore đảo)?",
      options: [
        "A. $3\\text{ cm}, 4\\text{ cm}, 5\\text{ cm}$",
        "B. $2\\text{ cm}, 3\\text{ cm}, 4\\text{ cm}$",
        "C. $4\\text{ cm}, 5\\text{ cm}, 6\\text{ cm}$",
        "D. $5\\text{ cm}, 6\\text{ cm}, 7\\text{ cm}$"
      ],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Kiểm tra $3^2 + 4^2 = 9 + 16 = 25 = 5^2$. Theo định lý Pythagore đảo, đây là tam giác vuông.\nChọn A.",
      reference: {
        topic: "Chương 9: Tam giác đồng dạng và Định lý Pythagore đảo",
        curriculumLesson: "Toán 8 - Chương 9: Định lý Pythagore đảo",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Định lý Pythagore đảo: a^2 + b^2 = c^2 thì tam giác vuông",
        variationGuide: "Đổi bộ ba số Pythagore: 6, 8, 10 hoặc 5, 12, 13"
      }
    },
    {
      id: "q8_ch9_tf1",
      type: "tf",
      question: "Cho tam giác $ABC$ có $AB = 4\\text{ cm}, AC = 6\\text{ cm}, BC = 8\\text{ cm}$ và tam giác $A'B'C'$ đồng dạng với $\\Delta ABC$ theo tỉ số $k = 2$. Xét tính đúng sai:",
      options: [
        "a) Độ dài cạnh $A'B' = 8\\text{ cm}$.",
        "b) Chu vi của tam giác $ABC$ bằng $18\\text{ cm}$.",
        "c) Chu vi của tam giác $A'B'C'$ bằng $36\\text{ cm}$.",
        "d) Tỉ số chu vi của hai tam giác bằng $4$."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-S",
      points: 1.0,
      explanation: "Phân tích:\n- Ý a: $A'B' = k \\cdot AB = 2 \\cdot 4 = 8\\text{ cm}$. -> Đúng.\n- Ý b: $P_{ABC} = 4 + 6 + 8 = 18\\text{ cm}$. -> Đúng.\n- Ý c: Tỉ số chu vi bằng tỉ số đồng dạng $k = 2 \\Rightarrow P_{A'B'C'} = 2 \\cdot 18 = 36\\text{ cm}$. -> Đúng.\n- Ý d: Tỉ số chu vi bằng $k = 2$, không phải 4 (tỉ số diện tích mới bằng 4). -> Sai.\nKết luận: a-Đ, b-Đ, c-Đ, d-S.",
      reference: {
        topic: "Chương 9: Tam giác đồng dạng và Định lý Pythagore đảo",
        curriculumLesson: "Toán 8 - Chương 9: Tính chất của hai tam giác đồng dạng",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Tỉ số chu vi bằng tỉ số đồng dạng k",
        variationGuide: "Đổi tỉ số k"
      }
    },
    {
      id: "q8_ch9_short1",
      type: "short",
      question: "Một chiếc cọc cắm thẳng đứng trên mặt đất có chiều cao $2\\text{ m}$ và bóng trên mặt đất dài $1.5\\text{ m}$. Cùng thời điểm đó, bóng của một cột cờ trên mặt đất dài $12\\text{ m}$. Tính chiều cao của cột cờ (m).",
      options: [],
      correctAnswer: "16",
      points: 0.5,
      explanation: "Hai tam giác tạo bởi vật và bóng đồng dạng với nhau: $\\frac{h_{\\text{cột cờ}}}{h_{\\text{cọc}}} = \\frac{\\text{bóng cột cờ}}{\\text{bóng cọc}} \\Rightarrow \\frac{h}{2} = \\frac{12}{1.5} = 8 \\Rightarrow h = 16\\text{ m}$.\nĐáp số: 16.",
      reference: {
        topic: "Chương 9: Tam giác đồng dạng và Định lý Pythagore đảo",
        curriculumLesson: "Toán 8 - Chương 9: Ứng dụng thực tế của tam giác đồng dạng",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Ứng dụng tam giác đồng dạng đo khoảng cách chiều cao thực địa",
        variationGuide: "Đổi số đo cọc và bóng"
      }
    },

    // --- CHƯƠNG 10: MỘT SỐ HÌNH KHỐI TRONG THỰC TIỄN (HÌNH CHÓP TAM GIÁC ĐỀU VÀ HÌNH CHÓP TỨ GIÁC ĐỀU) ---
    {
      id: "q8_ch10_mcq1",
      type: "mcq",
      question: "Đáy của hình chóp tứ giác đều là hình gì?",
      options: ["A. Hình vuông", "B. Hình chữ nhật", "C. Hình thoi", "D. Hình bình hành"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Theo định nghĩa: Hình chóp tứ giác đều có đáy là một đa giác đều (hình vuông) và các mặt bên là tam giác cân bằng nhau.\nChọn A.",
      reference: {
        topic: "Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều và Hình chóp tứ giác đều)",
        curriculumLesson: "Toán 8 - Chương 10: Hình chóp tứ giác đều",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "Đáy của hình chóp tứ giác đều là hình vuông",
        variationGuide: "Hỏi về hình chóp tam giác đều (đáy là tam giác đều)"
      }
    },
    {
      id: "q8_ch10_mcq2",
      type: "mcq",
      question: "Thể tích của hình chóp có diện tích đáy $S$ và chiều cao $h$ được tính theo công thức nào?",
      options: ["A. $V = \\frac{1}{3} S \\cdot h$", "B. $V = S \\cdot h$", "C. $V = \\frac{1}{2} S \\cdot h$", "D. $V = 3 S \\cdot h$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Công thức tính thể tích hình chóp: $V = \\frac{1}{3} S \\cdot h$.\nChọn A.",
      reference: {
        topic: "Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều và Hình chóp tứ giác đều)",
        curriculumLesson: "Toán 8 - Chương 10: Thể tích hình chóp đều",
        cognitiveLevel: "Nhận biết",
        competency: "Tư duy và lập luận toán học",
        coreKnowledge: "V = 1/3 * S_đáy * h",
        variationGuide: "Hỏi về diện tích xung quanh"
      }
    },
    {
      id: "q8_ch10_tf1",
      type: "tf",
      question: "Một chiếc lều có dạng hình chóp tứ giác đều, đáy là hình vuông cạnh $a = 4\\text{ m}$, chiều cao của hình chóp là $h = 3\\text{ m}$. Xét tính đúng sai:",
      options: [
        "a) Diện tích đáy của lều là $S_{\\text{đáy}} = 16\\text{ m}^2$.",
        "b) Thể tích không gian bên trong lều là $V = 16\\text{ m}^3$.",
        "c) Các mặt bên của chiếc lều là các tam giác cân bằng nhau.",
        "d) Nếu tăng cạnh đáy lên gấp đôi và giữ nguyên chiều cao thì thể tích tăng gấp đôi."
      ],
      correctAnswer: "a-Đ, b-Đ, c-Đ, d-S",
      points: 1.0,
      explanation: "Ý a: $S = 4^2 = 16$. Đúng;\nÝ b: $V = \\frac{1}{3} \\cdot 16 \\cdot 3 = 16\\text{ m}^3$. Đúng;\nÝ c: Mặt bên hình chóp đều là tam giác cân bằng nhau. Đúng;\nÝ d: Cạnh đáy tăng 2 lần thì diện tích đáy tăng 4 lần nên thể tích tăng 4 lần. Sai.\nKết luận: a-Đ, b-Đ, c-Đ, d-S.",
      reference: {
        topic: "Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều và Hình chóp tứ giác đều)",
        curriculumLesson: "Toán 8 - Chương 10: Thể tích hình chóp tứ giác đều",
        cognitiveLevel: "Vận dụng",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "Thể tích hình chóp tứ giác đều và sự thay đổi tỉ lệ",
        variationGuide: "Đổi kích thước lều"
      }
    },
    {
      id: "q8_ch10_short1",
      type: "short",
      question: "Một khối rubik hình chóp tam giác đều có diện tích đáy bằng $18\\sqrt{3}\\text{ cm}^2$ và chiều cao bằng $4\\text{ cm}$. Tính thể tích của khối rubik đó theo đơn vị $\\text{cm}^3$ (kết quả có dạng $a\\sqrt{3}$, điền số nguyên $a$).",
      options: [],
      correctAnswer: "24",
      points: 0.5,
      explanation: "Thể tích $V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\cdot 18\\sqrt{3} \\cdot 4 = 24\\sqrt{3}\\text{ cm}^3$. Số nguyên $a = 24$.\nĐáp số: 24.",
      reference: {
        topic: "Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều và Hình chóp tứ giác đều)",
        curriculumLesson: "Toán 8 - Chương 10: Thể tích hình chóp tam giác đều",
        cognitiveLevel: "Thông hiểu",
        competency: "Giải quyết vấn đề toán học",
        coreKnowledge: "V = 1/3 * S_đáy * h",
        variationGuide: "Đổi diện tích đáy và chiều cao"
      }
    }
  ],
  9: [
    // Khối 9: Căn thức, Hàm số bậc nhất, Hệ phương trình, Hệ thức lượng, Đường tròn
    {
      id: "q9_p1_1",
      type: "mcq",
      question: "Căn bậc hai số học của $25$ là",
      options: ["A. $5$", "B. $-5$", "C. $\\pm 5$", "D. $625$"],
      correctAnswer: "A",
      points: 0.25,
      explanation: "Căn bậc hai số học của số dương a là số dương x sao cho x^2 = a. Với a = 25 thì căn bậc hai số học là 5.\nChọn A.",
      reference: { topic: "Căn bậc hai", curriculumLesson: "Toán 9: Căn bậc hai và căn bậc ba", cognitiveLevel: "Nhận biết", competency: "Tư duy và lập luận toán học", coreKnowledge: "Căn bậc hai số học là số không âm", variationGuide: "Thay đổi số 25" }
    }
  ]
};

// Hàm xác định số thứ tự chương (1-10) của Toán 8 từ chuỗi chuyên đề hoặc nội dung câu hỏi
export function getGrade8ChapterNumber(text: string): number | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const chMatch = t.match(/chương\s*(\d+)/i);
  if (chMatch) {
    const num = parseInt(chMatch[1], 10);
    if (num >= 1 && num <= 10) return num;
  }
  // Kiểm tra Chương 6 Phân thức trước để phân thức không bao giờ bị nhận nhầm thành đa thức
  if (/\b(phân thức|mẫu thức|quy đồng mẫu|rút gọn phân thức|điều kiện xác định của phân thức)\b/i.test(t)) return 6;
  // Chương 2: Hằng đẳng thức đáng nhớ & Phân tích đa thức thành nhân tử
  if (/\b(hằng đẳng thức|phân tích đa thức thành nhân tử|nhân tử chung|hiệu hai bình phương|bình phương một tổng|bình phương một hiệu)\b/i.test(t)) return 2;
  // Chương 1: Đa thức nhiều biến (bao gồm đơn thức, đa thức, bậc của đa thức, thu gọn đa thức, phép tính đa thức)
  if (/\b(đa thức|đơn thức|đơn thức đồng dạng|bậc của đa thức|thu gọn đa thức|bậc của đơn thức)\b/i.test(t)) return 1;
  if (/\b(tứ giác|hình bình hành|hình thoi|hình chữ nhật|hình vuông|hình thang cân|tổng các góc của một tứ giác)\b/i.test(t) && !/\bchóp\b/i.test(t)) return 3;
  if (/\b(thalès|thales|đường trung bình của tam giác|đoạn thẳng tỉ lệ|tính chất đường phân giác)\b/i.test(t) && !/\bđồng dạng\b/i.test(t)) return 4;
  if (/\b(biểu đồ hình quạt|biểu đồ đoạn thẳng|dữ liệu định tính|dữ liệu định lượng|thu thập và tổ chức dữ liệu|biểu đồ cột kép)\b/i.test(t)) return 5;
  if (/\b(hàm số bậc nhất|hệ số góc|phương trình bậc nhất một ẩn|giải bài toán bằng cách lập phương trình)\b/i.test(t) || /y\s*=\s*-?\d*x\s*[+-]\s*\d+/.test(t)) return 7;
  if (/\b(xác suất|biến cố ngẫu nhiên|biến cố chắc chắn|biến cố không thể|kết quả thuận lợi|không gian mẫu)\b/i.test(t)) return 8;
  if (/\b(tam giác đồng dạng|tỉ số đồng dạng|đồng dạng|pythagore đảo)\b/i.test(t) && !/\bthalès\b/i.test(t)) return 9;
  if (/\b(hình chóp|chóp tam giác đều|chóp tứ giác đều|trung đoạn|thể tích hình chóp)\b/i.test(t)) return 10;
  return null;
}

// Fallback generator thông minh đáp ứng chính xác số lượng câu hỏi và định dạng đề thi
export function generateCurriculumFallbackQuestions(params: {
  grade?: number | string;
  title?: string;
  formatType?: string;
  mcqCount?: number;
  part1Count?: number;
  part2Count?: number;
  part3Count?: number;
  essayCount?: number;
  customPartsConfig?: any;
  referenceNotes?: string;
  referenceKnowledge?: string;
  topicTitle?: string;
  selectedTopicTitles?: string[];
  customEssayItems?: any[];
  autoGenType?: string;
}): CurriculumQuestion[] {
  // Tự động phân tích khối lớp từ tham số grade hoặc trích xuất từ tiêu đề, ghi chú
  let grade = Number(params.grade);
  if (!grade || isNaN(grade) || grade < 6 || grade > 12) {
    const textToSearch = `${params.title || ''} ${params.referenceNotes || ''} ${params.topicTitle || ''} ${params.referenceKnowledge || ''}`;
    const match = textToSearch.match(/(?:lớp|khối|toán)\s*([6-9]|1[0-2])\b/i);
    if (match && match[1]) {
      grade = parseInt(match[1], 10);
    } else {
      grade = 8;
    }
  }

  // Trích xuất danh sách các chuyên đề mục tiêu
  let targetTopics: string[] = [];
  if (Array.isArray(params.selectedTopicTitles) && params.selectedTopicTitles.length > 0) {
    targetTopics = params.selectedTopicTitles.map(s => String(s).trim()).filter(Boolean);
  } else if (params.referenceNotes) {
    const multiMatch = params.referenceNotes.match(/\[(?:Các chuyên đề(?:\s*\(\d+\))?|Chuyên đề):\s*([^\]]+)\]/i);
    if (multiMatch && multiMatch[1]) {
      targetTopics = multiMatch[1].split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
    } else {
      const topicM = params.referenceNotes.match(/(?:Chuyên đề trọng tâm|Chuyên đề|Các chuyên đề|Phạm vi kiến thức)[:\s]*([^\n\r<]+)/i);
      if (topicM && topicM[1]) {
        targetTopics = topicM[1].split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
      }
    }
  } else if (params.topicTitle) {
    targetTopics = params.topicTitle.split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
  }

  // Quét toàn bộ nguồn phạm vi để xác định chính xác ý định chuyên đề của giáo viên
  const allScopeSources = `${params.title || ''} ${params.referenceNotes || ''} ${params.referenceKnowledge || ''} ${params.topicTitle || ''} ${(params.selectedTopicTitles || []).join(' ')}`;
  const hasNegativeRational = /\b(không\s+(?:có\s+|ra\s+)?phân\s*thức|chưa\s*học\s*phân\s*thức|loại\s*bỏ\s*phân\s*thức|chỉ\s*đa\s*thức|không\s*phải\s*phân\s*thức)\b/i.test(allScopeSources);
  const userExplicitlySelectedPoly = targetTopics.some(t => /\b(đa thức|đơn thức)\b/i.test(t)) || /\b(đa thức|đơn thức)\b/i.test(allScopeSources);
  const userExplicitlySelectedRational = !hasNegativeRational && targetTopics.some(t => /\b(phân thức|mẫu thức)\b/i.test(t) && !/\b(không|chưa|loại|trừ)\b/i.test(t));

  const isRatInScope = userExplicitlySelectedRational;
  const isPolyInScope = (userExplicitlySelectedPoly || hasNegativeRational) && !isRatInScope;

  if (isPolyInScope && !isRatInScope) {
    targetTopics = targetTopics.filter(t => !/\b(phân thức|mẫu thức)\b/i.test(t));
    if (targetTopics.length === 0 || !targetTopics.some(t => /\b(đa thức|đơn thức)\b/i.test(t))) {
      targetTopics.unshift('Chương 1: Đa thức nhiều biến và các phép toán');
    }
  }

  // Chọn ngân hàng câu hỏi phù hợp nhất với khối lớp
  const bank = CURRICULUM_BANK[grade] || (grade <= 9 ? CURRICULUM_BANK[8] : CURRICULUM_BANK[12]);

  // Bộ lọc chuyên đề chính xác theo chương toán học
  const selectedChapters8 = grade === 8 && targetTopics.length > 0
    ? Array.from(new Set(targetTopics.map(t => getGrade8ChapterNumber(t)).filter((n): n is number => n !== null)))
    : [];

  // Kiểm tra đặc biệt: Nếu giáo viên CHỌN ĐA THỨC và KHÔNG CHỌN PHÂN THỨC
  const userWantsRational = isRatInScope;
  const userWantsPolynomial = isPolyInScope;

  const matchesTargetTopics = (q: CurriculumQuestion): boolean => {
    if (targetTopics.length === 0) return true;
    const qScopeText = `${q.reference?.curriculumLesson || ''} ${q.reference?.topic || ''} ${q.question || ''}`;
    const lowerQ = qScopeText.toLowerCase();

    // TUYỆT ĐỐI LOẠI BỎ CÂU HỎI PHÂN THỨC KHI GIÁO VIÊN CHỈ CHỌN ĐA THỨC
    if (userWantsPolynomial && !userWantsRational) {
      if (/\b(phân thức|mẫu thức|quy đồng mẫu|rút gọn phân thức|điều kiện xác định của phân thức)\b/i.test(lowerQ)) {
        return false;
      }
    }

    if (grade === 8 && selectedChapters8.length > 0) {
      const qCh = getGrade8ChapterNumber(qScopeText);
      if (qCh !== null) {
        return selectedChapters8.includes(qCh);
      }
    }

    return targetTopics.some(t => {
      const lowerT = t.toLowerCase();
      const chMatch = lowerT.match(/chương\s*(\d+)/i);
      if (chMatch && lowerQ.includes(`chương ${chMatch[1]}`)) return true;
      if (lowerT.includes('đa thức') && lowerQ.includes('đa thức') && !lowerQ.includes('phân thức')) return true;
      if (lowerT.includes('hằng đẳng thức') && lowerQ.includes('hằng đẳng thức')) return true;
      if (lowerT.includes('phân thức') && lowerQ.includes('phân thức')) return true;
      const cleaned = lowerT.replace(/^(chương\s*\d+:?|bài\s*\d+:?)/i, '').replace(/[.,;!?()]/g, ' ').trim();
      const words = cleaned.split(/\s+/).filter(w => w.length >= 4 && !['toán', 'trong', 'các', 'phép', 'phần', 'thức'].includes(w));
      return words.length > 0 && words.every(w => lowerQ.includes(w));
    });
  };

  const filteredBank = targetTopics.length > 0 ? bank.filter(matchesTargetTopics) : bank;
  let activeBank = (filteredBank.length > 0 ? filteredBank : bank).filter(q => {
    // Nếu giáo viên chỉ chọn đa thức, ngay cả khi fallback không tìm thấy thì TUYỆT ĐỐI không lấy phân thức
    if (userWantsPolynomial && !userWantsRational) {
      const qScopeText = `${q.reference?.curriculumLesson || ''} ${q.reference?.topic || ''} ${q.question || ''} ${q.explanation || ''}`.toLowerCase();
      if (/\b(phân thức|mẫu thức|quy đồng mẫu|rút gọn phân thức|điều kiện xác định của phân thức)\b/i.test(qScopeText) ||
          /\\frac\{[^\}]+\}\{[^0-9\\\}\s]*[a-zA-Z][^\}]*\}/.test(q.question)) {
        return false;
      }
    }
    return true;
  });

  let p1Pool = activeBank.filter(q => q.type === 'mcq');
  let p2Pool = activeBank.filter(q => q.type === 'tf');
  let p3Pool = activeBank.filter(q => q.type === 'short');
  let essayPool = activeBank.filter(q => q.type === 'essay');

  // Đảm bảo không bao giờ lấy từ chuyên đề chưa chọn
  if (p1Pool.length === 0) p1Pool = activeBank;
  if (p2Pool.length === 0) p2Pool = activeBank.filter(q => q.type === 'tf').length > 0 ? activeBank.filter(q => q.type === 'tf') : activeBank;
  if (p3Pool.length === 0) p3Pool = activeBank.filter(q => q.type === 'short').length > 0 ? activeBank.filter(q => q.type === 'short') : activeBank;
  if (essayPool.length === 0) essayPool = activeBank.filter(q => q.type === 'essay').length > 0 ? activeBank.filter(q => q.type === 'essay') : p3Pool;

  const format = params.formatType || 'mcq_3part';
  const result: CurriculumQuestion[] = [];

  const getSubArray = (pool: CurriculumQuestion[], count: number, prefix: string) => {
    if (count <= 0 || pool.length === 0) return [];
    const items: CurriculumQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      const assignedTopic = targetTopics.length > 0
        ? targetTopics[i % targetTopics.length]
        : (template.reference?.topic || `Chuyên đề Toán ${grade}`);

      items.push({
        ...template,
        id: `${prefix}_${i + 1}`,
        question: template.question,
        reference: {
          topic: assignedTopic,
          curriculumLesson: template.reference?.curriculumLesson || `SGK Toán ${grade} - Kết nối tri thức`,
          cognitiveLevel: template.reference?.cognitiveLevel || (i < count / 2 ? 'Nhận biết' : 'Thông hiểu'),
          competency: template.reference?.competency || 'Tư duy và lập luận toán học',
          coreKnowledge: template.reference?.coreKnowledge || 'Chuẩn kiến thức SGK GDPT',
          variationGuide: template.reference?.variationGuide || 'Đổi các hệ số số học tương đương'
        }
      });
    }
    return items;
  };

  if (format === 'description') {
    const cfg = params.customPartsConfig || {};
    const notesText = `${params.referenceNotes || ''} ${params.title || ''} ${params.referenceKnowledge || ''}`;
    const isPureEssayInNotes = 
      /(?:cấu\s*trúc|hình\s*thức|kiểu\s*đề|dạng\s*đề|phương\s*thức|hình\s*thức\s*kiểm\s*tra|định\s*dạng)[:\s]*(?:đề\s*)?(?:100%?\s*)?tự\s*luận/i.test(notesText) ||
      /(?:cấu\s*trúc\s*tự\s*luận|hình\s*thức\s*tự\s*luận|100%?\s*tự\s*luận|đề\s*(?:thi|kiểm\s*tra)\s*(?:chuyên\s*đề\s*)?tự\s*luận|đề\s*tự\s*luận|bài\s*toán\s*tự\s*luận|toàn\s*bộ\s*tự\s*luận|chỉ\s*tự\s*luận|thi\s*tự\s*luận)/i.test(notesText) ||
      (!/(?:trắc\s*nghiệm\s*4\s*lựa\s*chọn|4\s*lựa\s*chọn|đúng\s*[\/\-]\s*sai|trả\s*lời\s*ngắn|điền\s*số)/i.test(notesText) && /(?:tự\s*luận|bài\s*toán\s*tự\s*luận)/i.test(notesText)) ||
      (!/(?:đúng\s*[\/\-]\s*sai\s*:\s*[1-9]|4\s*lựa\s*chọn\s*:\s*[1-9]|trả\s*lời\s*ngắn\s*:\s*[1-9])/i.test(notesText) && /(?:tự\s*luận\s*:\s*[1-9]|\b\d+\s*câu\s*tự\s*luận|\b\d+\s*bài\s*tự\s*luận)/i.test(notesText)) ||
      params.autoGenType === 'essay' || params.formatType === 'essay';

    const hasExplicitTF = /(?:đúng\s*[\/\-]\s*sai|trắc\s*nghiệm\s*đúng\s*sai)/i.test(notesText) &&
      !/\b(?:không\s+(?:có\s+|ra\s+)?đúng\s*[\/\-]\s*sai|đúng\s*[\/\-]\s*sai\s*[:=]\s*0\b)/i.test(notesText) &&
      !isPureEssayInNotes;

    const p1Cnt = Number(params.part1Count || cfg.part1Count) || 0;
    const hasP1 = !isPureEssayInNotes && (cfg.enablePart1 === true || (cfg.enablePart1 !== false && p1Cnt > 0));

    const p2Cnt = Number(params.part2Count || cfg.part2Count) || 0;
    // QUAN TRỌNG: Chỉ bật Phần II Đúng/Sai nếu form mô tả có yêu cầu Đúng/Sai rõ ràng và không phải đề tự luận
    const hasP2 = !isPureEssayInNotes && hasExplicitTF && (cfg.enablePart2 === true && p2Cnt > 0);

    const p3Cnt = Number(params.part3Count || cfg.part3Count) || 0;
    const hasP3 = !isPureEssayInNotes && (cfg.enablePart3 === true && p3Cnt > 0);

    if (hasP1 && p1Cnt > 0) {
      result.push(...getSubArray(p1Pool, p1Cnt, 'p1'));
    }
    if (hasP2 && p2Cnt > 0) {
      result.push(...getSubArray(p2Pool, p2Cnt, 'p2'));
    }
    if (hasP3 && p3Cnt > 0) {
      result.push(...getSubArray(p3Pool, p3Cnt, 'p3'));
    }

    let activeEssayItems = (params.customEssayItems && Array.isArray(params.customEssayItems) && params.customEssayItems.length > 0)
      ? params.customEssayItems
      : undefined;

    if (!activeEssayItems && params.referenceNotes) {
      const parsedEssays: any[] = [];
      const essayRegex = /(?:^|\n|<li[^>]*>|<p[^>]*>|[•\-\*])[ \t]*(?:Câu|Bài)\s*(\d+)[\s\(\):.]*([^:\n\r<]+)?[:\-.]\s*([^\n\r<]+)/gi;
      let m;
      while ((m = essayRegex.exec(params.referenceNotes)) !== null) {
        const num = parseInt(m[1], 10);
        const rawMeta = m[2] || '';
        let desc = m[3].trim();
        if (!desc || desc.length < 5) continue;
        if (userWantsPolynomial && !userWantsRational) {
          desc = desc.replace(/đa thức\/phân thức/gi, 'đa thức').replace(/phân thức/gi, 'đa thức');
        }
        const ptMatch = (rawMeta + ' ' + desc).match(/(\d+(?:[.,]\d+)?)\s*(?:điểm|đ\b)/i);
        const points = ptMatch ? parseFloat(ptMatch[1].replace(',', '.')) : 1.0;
        let level = 'VD';
        if (/nhận\s*biết|NB\b/i.test(rawMeta + ' ' + desc)) level = 'NB';
        else if (/thông\s*hiểu|TH\b/i.test(rawMeta + ' ' + desc)) level = 'TH';
        else if (/vận\s*dụng\s*cao|VDC\b/i.test(rawMeta + ' ' + desc)) level = 'VDC';
        parsedEssays.push({
          id: `essay_${num}`,
          order: num,
          title: `Bài toán tự luận ${num}${ptMatch ? ` (${points.toFixed(1)} điểm)` : ''}`,
          topicScope: targetTopics[0] || (userWantsPolynomial ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Toán lớp ${grade}`),
          description: desc,
          points: points,
          level: level
        });
      }
      if (parsedEssays.length > 0) {
        activeEssayItems = parsedEssays;
      }
    }

    if (activeEssayItems && activeEssayItems.length > 0) {
      activeEssayItems.forEach((item: any, idx: number) => {
        result.push({
          id: `essay_${idx + 1}`,
          type: "essay",
          question: `Bài ${idx + 1} (${item.points || 1.0} điểm): ${item.title || 'Bài toán tự luận'}.\n${item.description || 'Thực hiện yêu cầu bài toán.'}`,
          options: [],
          correctAnswer: `Đáp số và hướng dẫn giải cho bài toán: ${item.title || ''}`,
          points: Number(item.points) || 1.0,
          explanation: `Lời giải chi tiết từng bước cho ${item.title || 'bài toán'}:\n- Áp dụng các định lý, công thức thuộc phạm vi: ${item.topicScope || 'Kiến thức trọng tâm'}.\n- Trình bày lời giải mạch lạc, chặt chẽ, kết luận đáp số đúng chuẩn.`,
          reference: {
            topic: item.topicScope || (targetTopics[0] || (userWantsPolynomial ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Toán lớp ${grade}`)),
            curriculumLesson: `SGK Toán ${grade} - Kết nối tri thức`,
            cognitiveLevel: item.level === 'VDC' ? 'Vận dụng cao' : (item.level === 'VD' ? 'Vận dụng' : 'Thông hiểu'),
            competency: 'Giải quyết vấn đề toán học',
            coreKnowledge: item.topicScope || 'Kiến thức tự luận',
            variationGuide: 'Thay đổi các tham số số học'
          }
        });
      });
    } else if (params.essayCount && Number(params.essayCount) > 0) {
      const eCnt = Number(params.essayCount);
      for (let i = 0; i < eCnt; i++) {
        result.push({
          id: `essay_${i + 1}`,
          type: "essay",
          question: `Bài ${i + 1} (${(10 / eCnt).toFixed(1)} điểm): Bài toán tự luận môn Toán lớp ${grade}.\nCho bài toán bám sát chuyên đề ${targetTopics[0] || 'Kiến thức SGK Kết nối tri thức'}. Học sinh trình bày lời giải chi tiết.`,
          options: [],
          correctAnswer: `Đáp số bài toán ${i + 1}`,
          points: Number((10 / eCnt).toFixed(1)),
          explanation: `Hướng dẫn giải chi tiết từng bước cho bài toán ${i + 1}.`,
          reference: {
            topic: targetTopics[0] || (userWantsPolynomial ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Toán lớp ${grade}`),
            curriculumLesson: `SGK Toán ${grade} - Kết nối tri thức`,
            cognitiveLevel: i === 0 ? 'Thông hiểu' : 'Vận dụng',
            competency: 'Giải quyết vấn đề toán học',
            coreKnowledge: 'Kiến thức tự luận chuẩn SGK',
            variationGuide: 'Đổi số liệu đề bài'
          }
        });
      }
    }
  } else if (format === 'mcq_3part') {
    const c1 = Number(params.part1Count) || 12;
    const c2 = Number(params.part2Count) || 4;
    const c3 = Number(params.part3Count) || 6;

    result.push(...getSubArray(p1Pool, c1, 'p1'));
    result.push(...getSubArray(p2Pool, c2, 'p2'));
    result.push(...getSubArray(p3Pool, c3, 'p3'));
  } else if (format === 'mcq_custom') {
    const cfg = params.customPartsConfig || {};
    if (cfg.enablePart1) {
      result.push(...getSubArray(p1Pool, Number(cfg.part1Count) || 10, 'cp1'));
    }
    if (cfg.enablePart2) {
      result.push(...getSubArray(p2Pool, Number(cfg.part2Count) || 4, 'cp2'));
    }
    if (cfg.enablePart3) {
      result.push(...getSubArray(p3Pool, Number(cfg.part3Count) || 4, 'cp3'));
    }
    if (result.length === 0) {
      result.push(...getSubArray(p1Pool, 10, 'cp1'));
    }
  } else if (format === 'essay') {
    let activeEssayItems = (params.customEssayItems && Array.isArray(params.customEssayItems) && params.customEssayItems.length > 0)
      ? params.customEssayItems
      : undefined;

    if (activeEssayItems && activeEssayItems.length > 0) {
      activeEssayItems.forEach((item: any, idx: number) => {
        result.push({
          id: `essay_${idx + 1}`,
          type: "essay",
          question: `Bài ${idx + 1} (${item.points || 1.0} điểm): ${item.title || 'Bài toán tự luận'}.\n${item.description || 'Thực hiện yêu cầu bài toán.'}`,
          options: [],
          correctAnswer: `Đáp số và hướng dẫn giải cho bài toán: ${item.title || ''}`,
          points: Number(item.points) || 1.0,
          explanation: `Lời giải chi tiết từng bước cho ${item.title || 'bài toán'}:\n- Áp dụng các định lý, công thức thuộc phạm vi: ${item.topicScope || 'Kiến thức trọng tâm'}.\n- Trình bày lời giải mạch lạc, chặt chẽ, kết luận đáp số đúng chuẩn.`,
          reference: {
            topic: item.topicScope || (targetTopics[0] || (userWantsPolynomial ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Toán lớp ${grade}`)),
            curriculumLesson: `SGK Toán ${grade} - Kết nối tri thức`,
            cognitiveLevel: item.level === 'VDC' ? 'Vận dụng cao' : (item.level === 'VD' ? 'Vận dụng' : 'Thông hiểu'),
            competency: 'Giải quyết vấn đề toán học',
            coreKnowledge: item.topicScope || 'Kiến thức tự luận',
            variationGuide: 'Thay đổi các tham số số học'
          }
        });
      });
    } else {
      const cEssay = Number(params.essayCount) || 3;
      const validEssayPool = essayPool.length > 0 ? essayPool : activeBank.filter(q => q.type === 'essay');
      for (let i = 0; i < cEssay; i++) {
        const template = validEssayPool.length > 0 ? validEssayPool[i % validEssayPool.length] : null;
        const assignedTopic = targetTopics.length > 0 ? targetTopics[i % targetTopics.length] : (template?.reference?.topic || (userWantsPolynomial ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Chuyên đề Toán ${grade}`));
        result.push({
          id: `essay_${i + 1}`,
          type: "essay",
          question: template ? template.question : `Bài ${i + 1} (${(10 / cEssay).toFixed(1)} điểm): Bài toán tự luận môn Toán lớp ${grade}.\nCho bài toán bám sát chuyên đề ${assignedTopic}. Học sinh trình bày lời giải chi tiết.`,
          options: [],
          correctAnswer: template ? template.correctAnswer : `Đáp số bài toán ${i + 1}`,
          points: Number((10 / cEssay).toFixed(1)),
          explanation: template ? template.explanation : `Hướng dẫn giải chi tiết từng bước cho bài toán ${i + 1}.`,
          reference: {
            topic: assignedTopic,
            curriculumLesson: template?.reference?.curriculumLesson || `SGK Toán ${grade} - Kết nối tri thức`,
            cognitiveLevel: i === 0 ? 'Thông hiểu' : (i === cEssay - 1 ? 'Vận dụng cao' : 'Vận dụng'),
            competency: 'Giải quyết vấn đề toán học',
            coreKnowledge: 'Kiến thức tự luận chuẩn SGK',
            variationGuide: 'Đổi số liệu đề bài'
          }
        });
      }
    }
  } else if (format === 'mixed') {
    const cMcq = Number(params.mcqCount) || 12;
    const cEssay = Number(params.essayCount) || 2;
    result.push(...getSubArray(p1Pool, cMcq, 'mixed_mcq'));
    const validEssayPool = essayPool.length > 0 ? essayPool : activeBank.filter(q => q.type === 'essay');
    for (let i = 0; i < cEssay; i++) {
      const template = validEssayPool.length > 0 ? validEssayPool[i % validEssayPool.length] : null;
      const assignedTopic = targetTopics.length > 0 ? targetTopics[i % targetTopics.length] : (template?.reference?.topic || `Toán lớp ${grade}`);
      result.push({
        id: `mixed_essay_${i + 1}`,
        type: "essay",
        question: template ? template.question : `Bài ${i + 1} (1.5 điểm): Bài toán tự luận chuyên đề ${assignedTopic}. Trình bày lời giải chi tiết.`,
        options: [],
        correctAnswer: template ? template.correctAnswer : `Đáp số bài ${i + 1}`,
        points: 1.5,
        explanation: template ? template.explanation : `Lời giải chi tiết cho bài ${i + 1}.`,
        reference: {
          topic: assignedTopic,
          curriculumLesson: `SGK Toán ${grade} - Kết nối tri thức`,
          cognitiveLevel: 'Vận dụng',
          competency: 'Giải quyết vấn đề toán học',
          coreKnowledge: 'Kiến thức tự luận chuẩn SGK',
          variationGuide: 'Đổi số liệu'
        }
      });
    }
  } else {
    const totalMcq = Number(params.mcqCount) || 10;
    result.push(...getSubArray(p1Pool, totalMcq, 'q'));
  }

  return result;
}
