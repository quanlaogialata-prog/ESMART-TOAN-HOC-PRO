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
  ]
};

// Fallback generator thông minh đáp ứng chính xác số lượng câu hỏi và định dạng đề thi
export function generateCurriculumFallbackQuestions(params: {
  grade?: number;
  title?: string;
  formatType?: string;
  mcqCount?: number;
  part1Count?: number;
  part2Count?: number;
  part3Count?: number;
  essayCount?: number;
  customPartsConfig?: any;
}): CurriculumQuestion[] {
  const grade = params.grade || 12;
  const bank = CURRICULUM_BANK[grade] || CURRICULUM_BANK[12];

  const p1Pool = bank.filter(q => q.type === 'mcq');
  const p2Pool = bank.filter(q => q.type === 'tf');
  const p3Pool = bank.filter(q => q.type === 'short');
  const essayPool = bank.filter(q => q.type === 'essay');

  const format = params.formatType || 'mcq_3part';
  const result: CurriculumQuestion[] = [];

  const getSubArray = (pool: CurriculumQuestion[], count: number, prefix: string) => {
    if (count <= 0) return [];
    const items: CurriculumQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      items.push({
        ...template,
        id: `${prefix}_${i + 1}`,
        // Đổi số thứ tự câu nếu cần
        question: template.question
      });
    }
    return items;
  };

  if (format === 'mcq_3part') {
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
    const cEssay = Number(params.essayCount) || 3;
    result.push(...getSubArray(essayPool.length > 0 ? essayPool : p3Pool, cEssay, 'essay'));
  } else if (format === 'mixed') {
    const cMcq = Number(params.mcqCount) || 12;
    const cEssay = Number(params.essayCount) || 2;
    result.push(...getSubArray(p1Pool, cMcq, 'mixed_mcq'));
    result.push(...getSubArray(p3Pool, cEssay, 'mixed_essay'));
  } else {
    const totalMcq = Number(params.mcqCount) || 10;
    result.push(...getSubArray(p1Pool, totalMcq, 'q'));
  }

  return result;
}
