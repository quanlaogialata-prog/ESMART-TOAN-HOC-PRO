export interface CurriculumTopic {
  id: string;
  grade: number;
  chapterNumber?: number;
  term: 'Học kỳ 1' | 'Học kỳ 2' | 'Chuyên đề ôn tập';
  title: string;
  shortTitle?: string;
  description?: string;
  defaultFocus: string;
}

export const CURRICULUM_TOPICS_BY_GRADE: Record<number, CurriculumTopic[]> = {
  // ==========================================
  // KHỐI 6: TOÁN LỚP 6 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  6: [
    {
      id: 'g6-ch1',
      grade: 6,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Tập hợp các số tự nhiên, phép tính và lũy thừa',
      shortTitle: 'Tập hợp số tự nhiên và lũy thừa',
      description: 'Tập hợp N, các phép tính cộng, trừ, nhân, chia, lũy thừa với số mũ tự nhiên, thứ tự thực hiện phép tính.',
      defaultFocus: '- Nhận biết: Tập hợp các số tự nhiên, phần tử thuộc tập hợp, số La Mã, viết gọn tích bằng lũy thừa\n- Thông hiểu: Thực hiện đúng thứ tự các phép tính, quy tắc nhân chia hai lũy thừa cùng cơ số\n- Vận dụng: Bài toán tìm số tự nhiên x, bài toán thực tế tính tổng chi phí, mua sắm'
    },
    {
      id: 'g6-ch2',
      grade: 6,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Tính chia hết trong tập hợp các số tự nhiên',
      shortTitle: 'Tính chia hết, ước và bội',
      description: 'Quan hệ chia hết, dấu hiệu chia hết cho 2, 3, 5, 9, số nguyên tố, hợp số, ƯCLN và BCNN.',
      defaultFocus: '- Nhận biết: Dấu hiệu chia hết cho 2, 3, 5, 9; Nhận diện số nguyên tố và hợp số nhỏ hơn 100\n- Thông hiểu: Phân tích một số ra thừa số nguyên tố; Tìm tập hợp ước và bội của một số\n- Vận dụng: Tìm ƯCLN và BCNN để giải bài toán thực tế (chia nhóm học sinh, xếp hàng, lịch lặp lại)'
    },
    {
      id: 'g6-ch3',
      grade: 6,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Số nguyên và các phép tính trong tập hợp số nguyên',
      shortTitle: 'Số nguyên và quy tắc dấu',
      description: 'Tập hợp số nguyên Z, biểu diễn trên trục số, cộng trừ nhân chia số nguyên, quy tắc dấu ngoặc.',
      defaultFocus: '- Nhận biết: Số nguyên âm, số đối, thứ tự trong Z, biểu diễn số nguyên trên trục số\n- Thông hiểu: Quy tắc cộng hai số nguyên cùng dấu và khác dấu; Quy tắc nhân hai số nguyên; Quy tắc dấu ngoặc\n- Vận dụng: Bài toán tìm số nguyên x; Tính nhanh tổng đại số; Ứng dụng thực tế tính nhiệt độ âm, độ sâu dưới mực nước biển'
    },
    {
      id: 'g6-ch4',
      grade: 6,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Một số hình phẳng trong thực tiễn',
      shortTitle: 'Hình phẳng trong thực tiễn',
      description: 'Tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân.',
      defaultFocus: '- Nhận biết: Đặc điểm các cạnh, các góc của tam giác đều, hình vuông, lục giác đều, hình thoi, hình bình hành, hình thang cân\n- Thông hiểu: Nhận dạng hình vẽ thực tế; Vẽ hình bằng thước và compa\n- Vận dụng: Tính chu vi và diện tích các hình phẳng trong bài toán thực tế (lát gạch nền nhà, làm hàng rào, trồng hoa)'
    },
    {
      id: 'g6-ch5',
      grade: 6,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Tính đối xứng của hình phẳng trong tự nhiên',
      shortTitle: 'Trục đối xứng và Tâm đối xứng',
      description: 'Hình có trục đối xứng, hình có tâm đối xứng, ứng dụng trong tự nhiên và nghệ thuật.',
      defaultFocus: '- Nhận biết: Hình có trục đối xứng, hình có tâm đối xứng trong tự nhiên, biểu trưng, logo\n- Thông hiểu: Xác định số trục đối xứng hoặc tâm đối xứng của các hình học cơ bản\n- Vận dụng: Hoàn thiện hình đối xứng, bài toán ứng dụng thẩm mỹ và thiết kế hoa văn'
    },
    {
      id: 'g6-ch6',
      grade: 6,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Phân số và các phép tính với phân số',
      shortTitle: 'Phân số và các phép tính',
      description: 'Khái niệm phân số, phân số bằng nhau, rút gọn, so sánh, các phép tính cộng trừ nhân chia phân số, hỗn số.',
      defaultFocus: '- Nhận biết: Khái niệm phân số a/b (b khác 0), phân số bằng nhau, số nghịch đảo\n- Thông hiểu: Rút gọn về phân số tối giản, quy đồng mẫu số, so sánh hai phân số, cộng trừ nhân chia phân số\n- Vận dụng: Tìm một giá trị phân số của một số cho trước; Tìm một số biết giá trị phân số của nó trong bài toán thực tế'
    },
    {
      id: 'g6-ch7',
      grade: 6,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Số thập phân và tỉ số phần trăm',
      shortTitle: 'Số thập phân và Tỉ số phần trăm',
      description: 'Số thập phân, các phép tính với số thập phân, làm tròn số, ước lượng, tỉ số và tỉ số phần trăm.',
      defaultFocus: '- Nhận biết: Số thập phân âm, dương; Hàng thập phân; Ký hiệu phần trăm %\n- Thông hiểu: Cộng, trừ, nhân, chia số thập phân; Làm tròn số theo độ chính xác cho trước\n- Vận dụng: Bài toán tính phần trăm giảm giá hàng hóa, thuế VAT, lãi suất tiết kiệm đơn giản'
    },
    {
      id: 'g6-ch8',
      grade: 6,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Những hình hình học cơ bản (Điểm, Đường thẳng, Đoạn thẳng, Góc)',
      shortTitle: 'Hình hình học cơ bản',
      description: 'Điểm, đường thẳng, tia, đoạn thẳng, độ dài đoạn thẳng, trung điểm của đoạn thẳng, góc và số đo góc.',
      defaultFocus: '- Nhận biết: Điểm thuộc đường thẳng, ba điểm thẳng hàng, hai đường thẳng cắt nhau, song song; Điểm nằm giữa hai điểm\n- Thông hiểu: Tính độ dài đoạn thẳng, nhận biết trung điểm của đoạn thẳng; Đo góc, phân loại góc nhọn, vuông, tù, bẹt\n- Vận dụng: Bài toán tính độ dài đoạn thẳng và số đo góc kết hợp lập luận hình học cơ bản'
    },
    {
      id: 'g6-ch9',
      grade: 6,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Dữ liệu và xác suất thực nghiệm',
      shortTitle: 'Dữ liệu và Xác suất thực nghiệm',
      description: 'Thu thập, phân loại, biểu diễn dữ liệu bằng biểu đồ tranh, biểu đồ cột, biểu đồ cột kép; xác suất thực nghiệm.',
      defaultFocus: '- Nhận biết: Dữ liệu là số liệu hay không là số liệu; Bảng thống kê, biểu đồ tranh, biểu đồ cột, cột kép\n- Thông hiểu: Đọc và rút ra thông tin từ biểu đồ; Lập bảng thống kê tương ứng\n- Vận dụng: Tính xác suất thực nghiệm của một sự kiện qua các lần lặp lại thí nghiệm (gieo xúc xắc, tung đồng xu)'
    }
  ],

  // ==========================================
  // KHỐI 7: TOÁN LỚP 7 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  7: [
    {
      id: 'g7-ch1',
      grade: 7,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Số hữu tỉ và các phép tính trong tập hợp số hữu tỉ',
      shortTitle: 'Số hữu tỉ và các phép tính',
      description: 'Tập hợp số hữu tỉ Q, thứ tự, cộng trừ nhân chia, lũy thừa với số mũ tự nhiên của số hữu tỉ, quy tắc dấu ngoặc.',
      defaultFocus: '- Nhận biết: Khái niệm số hữu tỉ, số đối của số hữu tỉ, biểu diễn số hữu tỉ trên trục số\n- Thông hiểu: Thực hiện thành thạo bốn phép tính và lũy thừa trong Q; Quy tắc dấu ngoặc và chuyển vế\n- Vận dụng: Tìm x trong phương trình chứa lũy thừa hoặc giá trị tuyệt đối; Tính giá trị biểu thức hợp lý'
    },
    {
      id: 'g7-ch2',
      grade: 7,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Số thực và căn bậc hai số học',
      shortTitle: 'Số thực và Căn bậc hai',
      description: 'Số vô tỉ, căn bậc hai số học, tập hợp số thực R, giá trị tuyệt đối của số thực, làm tròn và ước lượng.',
      defaultFocus: '- Nhận biết: Khái niệm số vô tỉ, số thập phân vô hạn không tuần hoàn, căn bậc hai số học của một số không âm\n- Thông hiểu: Định nghĩa và tính chất của giá trị tuyệt đối |x|; Làm tròn số theo độ chính xác d\n- Vận dụng: Tính giá trị biểu thức chứa căn bậc hai số học; Tìm x có chứa dấu giá trị tuyệt đối'
    },
    {
      id: 'g7-ch3',
      grade: 7,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Góc và hai đường thẳng song song',
      shortTitle: 'Góc và Hai đường thẳng song song',
      description: 'Hai góc đối đỉnh, kề bù, tia phân giác của góc, hai đường thẳng song song, tiên đề Euclid, định lý và chứng minh.',
      defaultFocus: '- Nhận biết: Hai góc đối đỉnh, hai góc so le trong, đồng vị, trong cùng phía; Tia phân giác của góc\n- Thông hiểu: Dấu hiệu nhận biết hai đường thẳng song song; Tính chất hai đường thẳng song song\n- Vận dụng: Tính số đo góc dựa vào quan hệ song song; Lập luận chứng minh hai đường thẳng song song hoặc vuông góc'
    },
    {
      id: 'g7-ch4',
      grade: 7,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Tam giác bằng nhau và Định lý Pythagore',
      shortTitle: 'Tam giác bằng nhau',
      description: 'Tổng ba góc trong tam giác, các trường hợp bằng nhau của tam giác (c-c-c, c-g-c, g-c-g), tam giác cân, định lý Pythagore.',
      defaultFocus: '- Nhận biết: Tổng ba góc trong tam giác bằng 180 độ; Định nghĩa và tính chất tam giác cân, tam giác đều\n- Thông hiểu: Chứng minh hai tam giác bằng nhau theo 3 trường hợp; Các trường hợp bằng nhau của tam giác vuông\n- Vận dụng: Vận dụng chứng minh hai đoạn thẳng bằng nhau, hai góc bằng nhau; Áp dụng định lý Pythagore tính cạnh tam giác vuông'
    },
    {
      id: 'g7-ch5',
      grade: 7,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Thu thập và biểu diễn dữ liệu',
      shortTitle: 'Thu thập và Biểu diễn dữ liệu',
      description: 'Thu thập, phân loại dữ liệu, biểu đồ hình quạt tròn, biểu đồ đoạn thẳng, đọc và phân tích số liệu.',
      defaultFocus: '- Nhận biết: Dữ liệu định tính và dữ liệu định lượng; Cấu tạo biểu đồ hình quạt tròn và biểu đồ đoạn thẳng\n- Thông hiểu: Đọc số liệu trên biểu đồ quạt tròn và biểu đồ đoạn thẳng; Chuyển đổi biểu diễn giữa bảng và biểu đồ\n- Vận dụng: Rút ra nhận xét, xu hướng và đưa ra kết luận hoặc dự đoán từ dữ liệu thống kê'
    },
    {
      id: 'g7-ch6',
      grade: 7,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Tỉ lệ thức và đại lượng tỉ lệ',
      shortTitle: 'Tỉ lệ thức và Đại lượng tỉ lệ',
      description: 'Tỉ lệ thức, tính chất dãy tỉ số bằng nhau, đại lượng tỉ lệ thuận, đại lượng tỉ lệ nghịch.',
      defaultFocus: '- Nhận biết: Định nghĩa tỉ lệ thức a/b = c/d; Định nghĩa đại lượng tỉ lệ thuận y = kx, tỉ lệ nghịch y = a/x\n- Thông hiểu: Tính chất của tỉ lệ thức; Tính chất của dãy tỉ số bằng nhau (a/b = c/d = (a+c)/(b+d))\n- Vận dụng: Giải bài toán chia phần tỉ lệ (chia số tiền thưởng, ba lớp đóng góp, phân chia nguyên vật liệu)'
    },
    {
      id: 'g7-ch7',
      grade: 7,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Biểu thức đại số và đa thức một biến',
      shortTitle: 'Biểu thức đại số và Đa thức một biến',
      description: 'Đơn thức, đa thức một biến, cộng trừ đa thức một biến, nhân chia đa thức một biến, nghiệm của đa thức.',
      defaultFocus: '- Nhận biết: Biểu thức đại số, biến số; Đơn thức một biến, bậc của đa thức một biến, hệ số cao nhất, hệ số tự do\n- Thông hiểu: Thu gọn, sắp xếp đa thức một biến theo lũy thừa giảm dần; Cộng trừ đa thức một biến; Kiểm tra nghiệm của đa thức\n- Vận dụng: Nhân chia đa thức một biến; Tìm nghiệm của đa thức một biến; Chứng minh đa thức không có nghiệm'
    },
    {
      id: 'g7-ch8',
      grade: 7,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Làm quen với biến cố và xác suất của biến cố',
      shortTitle: 'Biến cố và Xác suất biến cố',
      description: 'Biến cố chắc chắn, biến cố không thể, biến cố ngẫu nhiên, xác suất của biến cố trong trò chơi đơn giản.',
      defaultFocus: '- Nhận biết: Phân biệt biến cố chắc chắn, không thể và biến cố ngẫu nhiên\n- Thông hiểu: Xác định số kết quả thuận lợi cho biến cố trong các phép thử đơn giản (gieo xúc xắc, rút thẻ số)\n- Vận dụng: Tính xác suất lý thuyết của biến cố ngẫu nhiên có các kết quả đồng khả năng'
    },
    {
      id: 'g7-ch9',
      grade: 7,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Quan hệ giữa các yếu tố trong một tam giác',
      shortTitle: 'Quan hệ giữa các yếu tố trong tam giác',
      description: 'Quan hệ giữa góc và cạnh đối diện, đường vuông góc và đường xiên, bất đẳng thức tam giác, các đường đồng quy.',
      defaultFocus: '- Nhận biết: Góc đối diện với cạnh lớn hơn thì lớn hơn; Quan hệ giữa đường vuông góc và đường xiên\n- Thông hiểu: Bất đẳng thức tam giác (|b-c| < a < b+c); Định nghĩa trọng tâm, trực tâm, tâm đường tròn nội tiếp, ngoại tiếp\n- Vận dụng: Chứng minh ba điểm thẳng hàng, ba đường thẳng đồng quy; Bài toán so sánh độ dài đoạn thẳng'
    },
    {
      id: 'g7-ch10',
      grade: 7,
      chapterNumber: 10,
      term: 'Học kỳ 2',
      title: 'Chương 10: Một số hình khối trong thực tiễn (Hình hộp chữ nhật, Hình lập phương, Hình lăng trụ đứng)',
      shortTitle: 'Hình lăng trụ đứng trong thực tiễn',
      description: 'Hình hộp chữ nhật, hình lập phương, hình lăng trụ đứng tam giác và tứ giác, diện tích xung quanh, thể tích.',
      defaultFocus: '- Nhận biết: Các đỉnh, cạnh, mặt đáy, mặt bên của hình lăng trụ đứng tam giác, hình lăng trụ đứng tứ giác\n- Thông hiểu: Công thức tính diện tích xung quanh Sxq = Cđáy * h và thể tích V = Sđáy * h\n- Vận dụng: Bài toán thực tế tính chi phí sơn tường, xây bể nước, thể tích khối bê tông'
    }
  ],

  // ==========================================
  // KHỐI 8: TOÁN LỚP 8 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  8: [
    {
      id: 'g8-ch1',
      grade: 8,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Đa thức nhiều biến và các phép toán',
      shortTitle: 'Đa thức nhiều biến',
      description: 'Đơn thức nhiều biến, đơn thức đồng dạng, đa thức nhiều biến, cộng trừ đa thức, nhân đơn thức với đa thức, chia đơn thức.',
      defaultFocus: '- Nhận biết: Bậc của đơn thức nhiều biến, đơn thức đồng dạng, bậc của đa thức nhiều biến\n- Thông hiểu: Thu gọn đa thức; Tính giá trị đa thức tại các giá trị cho trước của biến; Cộng, trừ các đa thức\n- Vận dụng: Nhân đa thức với đa thức; Chia đa thức cho đơn thức; Bài toán rút gọn và tìm giá trị biểu thức'
    },
    {
      id: 'g8-ch2',
      grade: 8,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Hằng đẳng thức đáng nhớ và Phân tích đa thức thành nhân tử',
      shortTitle: 'Hằng đẳng thức & Phân tích đa thức',
      description: 'Bảy hằng đẳng thức đáng nhớ, phương pháp phân tích đa thức thành nhân tử, ứng dụng giải phương trình và tính nhanh.',
      defaultFocus: '- Nhận biết: Bảy hằng đẳng thức đáng nhớ (bình phương một tổng/hiệu, hiệu hai bình phương, lập phương tổng/hiệu, tổng/hiệu hai lập phương)\n- Thông hiểu: Áp dụng hằng đẳng thức tính nhanh; Phân tích đa thức thành nhân tử bằng đặt nhân tử chung, dùng hằng đẳng thức, nhóm hạng tử\n- Vận dụng: Vận dụng phân tích đa thức tìm x, tính giá trị biểu thức đối xứng, chứng minh chia hết hoặc bất đẳng thức'
    },
    {
      id: 'g8-ch3',
      grade: 8,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Tứ giác và các hình thang cân, hình thoi, hình chữ nhật, hình vuông',
      shortTitle: 'Tứ giác và các hình đặc biệt',
      description: 'Tổng các góc trong tứ giác, hình thang cân, hình bình hành, hình chữ nhật, hình thoi, hình vuông.',
      defaultFocus: '- Nhận biết: Định lý tổng các góc trong một tứ giác bằng 360 độ; Định nghĩa và tính chất của hình thang cân, hình bình hành, chữ nhật, thoi, vuông\n- Thông hiểu: Các dấu hiệu nhận biết từng loại tứ giác đặc biệt; Tính số đo góc và độ dài các cạnh, đường chéo\n- Vận dụng: Chứng minh một tứ giác là hình bình hành, hình chữ nhật, hình thoi, hình vuông; Bài toán cực trị hình học'
    },
    {
      id: 'g8-ch4',
      grade: 8,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Định lý Thalès trong tam giác',
      shortTitle: 'Định lý Thalès trong tam giác',
      description: 'Định lý Thalès thuận và đảo, hệ quả của định lý Thalès, đường trung bình của tam giác, tính chất đường phân giác.',
      defaultFocus: '- Nhận biết: Tỉ số của hai đoạn thẳng, đoạn thẳng tỉ lệ; Phát biểu định lý Thalès thuận, đảo và hệ quả\n- Thông hiểu: Định lý về đường trung bình của tam giác; Tính chất đường phân giác trong tam giác (DB/DC = AB/AC)\n- Vận dụng: Tính độ dài đoạn thẳng chưa biết; Chứng minh hai đường thẳng song song; Bài toán đo khoảng cách thực địa'
    },
    {
      id: 'g8-ch5',
      grade: 8,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Dữ liệu và biểu đồ',
      shortTitle: 'Dữ liệu và Biểu đồ',
      description: 'Thu thập, tổ chức và phân loại dữ liệu, lựa chọn biểu đồ thích hợp để biểu diễn dữ liệu thống kê.',
      defaultFocus: '- Nhận biết: Dữ liệu liên tục, rời rạc; Các loại biểu đồ (cột kép, hình quạt tròn, đoạn thẳng)\n- Thông hiểu: Lựa chọn biểu đồ thích hợp nhất để biểu diễn tập dữ liệu cụ thể; Phân tích xu hướng\n- Vận dụng: Nhận diện biểu đồ biểu diễn sai hoặc gây hiểu lầm; Đưa ra nhận xét và khuyến nghị từ số liệu'
    },
    {
      id: 'g8-ch6',
      grade: 8,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Phân thức đại số và các phép tính',
      shortTitle: 'Phân thức đại số',
      description: 'Định nghĩa phân thức, điều kiện xác định, tính chất cơ bản, rút gọn phân thức, cộng trừ nhân chia phân thức đại số.',
      defaultFocus: '- Nhận biết: Khái niệm phân thức đại số A/B (B khác 0); Tìm điều kiện xác định của phân thức\n- Thông hiểu: Rút gọn phân thức về tối giản; Quy đồng mẫu thức; Cộng, trừ, nhân, chia các phân thức đại số\n- Vận dụng: Rút gọn biểu thức chứa phân thức đại số; Tìm giá trị nguyên của x để phân thức nhận giá trị nguyên'
    },
    {
      id: 'g8-ch7',
      grade: 8,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Phương trình bậc nhất một ẩn và Hàm số bậc nhất',
      shortTitle: 'Phương trình & Hàm số bậc nhất',
      description: 'Phương trình bậc nhất ax + b = 0, giải bài toán bằng cách lập phương trình, khái niệm hàm số và đồ thị y = ax + b.',
      defaultFocus: '- Nhận biết: Phương trình bậc nhất một ẩn; Định nghĩa hàm số, đồ thị hàm số bậc nhất y = ax + b (a khác 0)\n- Thông hiểu: Giải phương trình bậc nhất một ẩn; Vẽ đồ thị hàm số bậc nhất; Ý nghĩa của hệ số góc a\n- Vận dụng: Giải bài toán bằng cách lập phương trình (toán chuyển động, toán năng suất, toán phần trăm); Tìm tọa độ giao điểm của hai đường thẳng'
    },
    {
      id: 'g8-ch8',
      grade: 8,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Mở đầu về tính xác suất của biến cố',
      shortTitle: 'Xác suất của biến cố',
      description: 'Biến cố ngẫu nhiên, không gian mẫu, xác suất của biến cố trong các mô hình xác suất đơn giản.',
      defaultFocus: '- Nhận biết: Phép thử ngẫu nhiên, kết quả có thể và kết quả thuận lợi cho một biến cố\n- Thông hiểu: Công thức tính xác suất cổ điển P(A) = n(A)/n(Omega) trong các trường hợp đồng khả năng\n- Vận dụng: Tính xác suất xuất hiện biến cố trong trò chơi chọn ngẫu nhiên, bốc thăm, tung súc sắc'
    },
    {
      id: 'g8-ch9',
      grade: 8,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Tam giác đồng dạng và Định lý Pythagore đảo',
      shortTitle: 'Tam giác đồng dạng',
      description: 'Khái niệm hai tam giác đồng dạng, các trường hợp đồng dạng (c-c-c, c-g-c, g-g), trường hợp đồng dạng của tam giác vuông.',
      defaultFocus: '- Nhận biết: Định nghĩa hai tam giác đồng dạng, tỉ số đồng dạng k; Tỉ số diện tích bằng k bình phương\n- Thông hiểu: Ba trường hợp đồng dạng của hai tam giác thường và hai tam giác vuông\n- Vận dụng: Chứng minh hệ thức hình học (AB^2 = BH.BC); Tính chiều cao của cây, tháp bằng bóng nắng hoặc gương phẳng'
    },
    {
      id: 'g8-ch10',
      grade: 8,
      chapterNumber: 10,
      term: 'Học kỳ 2',
      title: 'Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều và Hình chóp tứ giác đều)',
      shortTitle: 'Hình chóp tam giác đều & tứ giác đều',
      description: 'Đặc điểm hình chóp tam giác đều, hình chóp tứ giác đều, diện tích xung quanh, thể tích và bài toán thực tế.',
      defaultFocus: '- Nhận biết: Đỉnh, cạnh bên, mặt đáy, chiều cao, trung đoạn của hình chóp tam giác đều và tứ giác đều\n- Thông hiểu: Công thức tính diện tích xung quanh Sxq = 1/2 * Cđáy * d và thể tích V = 1/3 * Sđáy * h\n- Vận dụng: Bài toán thực tế tính diện tích bạt dựng lều chữ A, thể tích kim tự tháp, chi phí làm mái ngói hình chóp'
    }
  ],

  // ==========================================
  // KHỐI 9: TOÁN LỚP 9 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  9: [
    {
      id: 'g9-ch1',
      grade: 9,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Phương trình và Hệ hai phương trình bậc nhất hai ẩn',
      shortTitle: 'Hệ phương trình bậc nhất hai ẩn',
      description: 'Phương trình bậc nhất hai ẩn, hệ hai phương trình bậc nhất hai ẩn, phương pháp giải thế, cộng đại số, giải toán lập hệ.',
      defaultFocus: '- Nhận biết: Dạng tổng quát ax + by = c; Nghiệm của phương trình và hệ phương trình bậc nhất hai ẩn\n- Thông hiểu: Giải hệ bằng phương pháp thế và phương pháp cộng đại số; Biện luận số nghiệm theo hệ số\n- Vận dụng: Giải bài toán bằng cách lập hệ phương trình (chuyển động, năng suất, làm chung làm riêng, số học)'
    },
    {
      id: 'g9-ch2',
      grade: 9,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Phương trình bậc nhất một ẩn và Bất phương trình bậc nhất một ẩn',
      shortTitle: 'Bất phương trình bậc nhất một ẩn',
      description: 'Phương trình tích, phương trình chứa ẩn ở mẫu, bất đẳng thức, bất phương trình bậc nhất một ẩn.',
      defaultFocus: '- Nhận biết: Bất đẳng thức và các tính chất cơ bản liên hệ giữa thứ tự và phép cộng, nhân\n- Thông hiểu: Giải phương trình tích, phương trình chứa ẩn ở mẫu quy về bậc nhất; Giải bất phương trình bậc nhất ax + b > 0\n- Vận dụng: Biểu diễn tập nghiệm trên trục số; Tìm x nguyên thỏa mãn bất phương trình'
    },
    {
      id: 'g9-ch3',
      grade: 9,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Căn bậc hai và Căn bậc ba',
      shortTitle: 'Căn bậc hai và Căn bậc ba',
      description: 'Căn bậc hai số học, hằng đẳng thức căn(A^2) = |A|, khai căn tích, thương, trục căn thức, rút gọn biểu thức chứa căn.',
      defaultFocus: '- Nhận biết: Điều kiện xác định của căn bậc hai; Các công thức khai căn bậc hai của tích, thương\n- Thông hiểu: Khử mẫu biểu thức lấy căn, trục căn thức ở mẫu; Đưa thừa số ra ngoài/vào trong dấu căn\n- Vận dụng: Rút gọn biểu thức chứa căn và các câu hỏi phụ (tính giá trị, tìm x để P < a, so sánh với 1, tìm GTLN/GTNN)'
    },
    {
      id: 'g9-ch4',
      grade: 9,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Hệ thức lượng trong tam giác vuông',
      shortTitle: 'Hệ thức lượng trong tam giác vuông',
      description: 'Hệ thức về cạnh và đường cao trong tam giác vuông, tỉ số lượng giác góc nhọn, giải tam giác vuông.',
      defaultFocus: '- Nhận biết: Tỉ số lượng giác sin, cos, tan, cot của góc nhọn; Các hệ thức về cạnh và đường cao\n- Thông hiểu: Tính các cạnh và góc của tam giác vuông khi biết hai yếu tố; Bảng lượng giác các góc đặc biệt\n- Vận dụng: Bài toán thực tế đo chiều cao tháp, đo khoảng cách hai bờ sông, góc nâng và góc hạ'
    },
    {
      id: 'g9-ch5',
      grade: 9,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Đường tròn và các yếu tố liên quan',
      shortTitle: 'Đường tròn và Tiếp tuyến',
      description: 'Sự xác định đường tròn, tính chất đối xứng, vị trí tương đối của đường thẳng và đường tròn, tiếp tuyến của đường tròn.',
      defaultFocus: '- Nhận biết: Định nghĩa đường tròn, đường kính là dây lớn nhất; Vị trí tương đối của điểm, đường thẳng với đường tròn\n- Thông hiểu: Dấu hiệu nhận biết tiếp tuyến của đường tròn; Tính chất của hai tiếp tuyến cắt nhau\n- Vận dụng: Chứng minh đường thẳng là tiếp tuyến của đường tròn; Tính độ dài đoạn thẳng, số đo góc'
    },
    {
      id: 'g9-ch6',
      grade: 9,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Hàm số y = ax^2 (a khác 0) và Phương trình bậc hai một ẩn',
      shortTitle: 'Hàm số bậc hai & Định lý Vi-ét',
      description: 'Tính chất và đồ thị hàm số y = ax^2, phương trình bậc hai một ẩn, công thức nghiệm, định lý Viète và ứng dụng.',
      defaultFocus: '- Nhận biết: Đồ thị Parabol y = ax^2; Công thức nghiệm và công thức nghiệm thu gọn của phương trình bậc hai\n- Thông hiểu: Định lý Vi-ét (x1 + x2 = -b/a, x1.x2 = c/a); Tính giá trị biểu thức đối xứng giữa hai nghiệm\n- Vận dụng: Tìm tham số m để phương trình có 2 nghiệm thỏa mãn điều kiện; Tương giao giữa Parabol và đường thẳng d'
    },
    {
      id: 'g9-ch7',
      grade: 9,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Tần số và Tần số tương đối',
      shortTitle: 'Tần số và Tần số tương đối',
      description: 'Bảng tần số và tần số tương đối, biểu đồ tần số, biểu đồ tần số tương đối (đoạn thẳng, quạt tròn).',
      defaultFocus: '- Nhận biết: Khái niệm tần số, tần số tương đối, công thức fi = ni/N * 100%\n- Thông hiểu: Lập bảng tần số và bảng tần số tương đối; Vẽ biểu đồ tương ứng\n- Vận dụng: Phân tích cơ cấu và so sánh dữ liệu qua bảng phân bố tần số tương đối'
    },
    {
      id: 'g9-ch8',
      grade: 9,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Xác suất của biến cố trong một số mô hình xác suất đơn giản',
      shortTitle: 'Xác suất biến cố Toán 9',
      description: 'Mô hình xác suất cổ điển, tính xác suất của biến cố bằng tỉ số kết quả thuận lợi trên không gian mẫu.',
      defaultFocus: '- Nhận biết: Không gian mẫu của phép thử ngẫu nhiên hai giai đoạn\n- Thông hiểu: Liệt kê các kết quả thuận lợi bằng sơ đồ cây hoặc bảng hai chiều\n- Vận dụng: Tính xác suất xuất hiện biến cố trong bài toán chọn học sinh, rút thẻ bài, tung súc sắc hai lần'
    },
    {
      id: 'g9-ch9',
      grade: 9,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Đường tròn ngoại tiếp và Đường tròn nội tiếp',
      shortTitle: 'Tứ giác nội tiếp & Đa giác đều',
      description: 'Đường tròn ngoại tiếp và nội tiếp tam giác, tứ giác nội tiếp và các dấu hiệu nhận biết, đa giác đều.',
      defaultFocus: '- Nhận biết: Định nghĩa tứ giác nội tiếp; Định lý tổng hai góc đối diện bằng 180 độ\n- Thông hiểu: Bốn dấu hiệu nhận biết tứ giác nội tiếp (tổng 2 góc đối, 2 đỉnh kề nhìn 1 cạnh, góc ngoài bằng góc đối trong...)\n- Vận dụng: Chứng minh 4 điểm cùng thuộc một đường tròn; Chứng minh nhiều điểm đồng viên, đường thẳng vuông góc/song song'
    },
    {
      id: 'g9-ch10',
      grade: 9,
      chapterNumber: 10,
      term: 'Học kỳ 2',
      title: 'Chương 10: Một số hình khối trong thực tiễn (Hình trụ, Hình nón, Hình cầu)',
      shortTitle: 'Hình trụ, Hình nón, Hình cầu',
      description: 'Hình trụ, hình nón, hình cầu, công thức diện tích xung quanh, thể tích và các bài toán thực tế.',
      defaultFocus: '- Nhận biết: Bán kính đáy, chiều cao, đường sinh của hình trụ, hình nón, hình cầu\n- Thông hiểu: Công thức tính diện tích xung quanh, diện tích toàn phần và thể tích của trụ, nón, cầu\n- Vận dụng: Bài toán thực tế tính chi phí sản xuất vỏ lon, téc nước, nón lá, quả bóng, bồn chứa xăng dầu'
    },
    {
      id: 'g9-on10',
      grade: 9,
      term: 'Chuyên đề ôn tập',
      title: 'Chuyên đề Ôn thi Tuyển sinh vào lớp 10 THPT (Đại số & Hình học tổng hợp)',
      shortTitle: 'Ôn thi vào Lớp 10 THPT',
      description: 'Tổng hợp các dạng bài thi tuyển sinh vào 10: Rút gọn biểu thức chứa căn, Parabol & Đường thẳng, Hệ phương trình, Vi-ét, Tứ giác nội tiếp, Bất đẳng thức cực trị.',
      defaultFocus: '- Dạng 1: Rút gọn biểu thức chứa căn và bài toán phụ (tính giá trị, bất phương trình, tìm x nguyên)\n- Dạng 2: Giải toán bằng cách lập PT, HPT (chuyển động, năng suất, làm chung làm riêng)\n- Dạng 3: Tương giao Parabol và đường thẳng; Định lý Vi-ét tìm tham số m thỏa mãn biểu thức\n- Dạng 4: Hình học phẳng tổng hợp (chứng minh tứ giác nội tiếp, tiếp tuyến, hệ thức hình học, ba điểm thẳng hàng)\n- Dạng 5: Bất đẳng thức Cauchy và tìm giá trị lớn nhất, nhỏ nhất (câu phân loại 0.5 - 1.0 điểm)'
    }
  ],

  // ==========================================
  // KHỐI 10: TOÁN LỚP 10 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  10: [
    {
      id: 'g10-ch1',
      grade: 10,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Mệnh đề và Tập hợp',
      shortTitle: 'Mệnh đề và Tập hợp',
      description: 'Mệnh đề, mệnh đề phủ định, mệnh đề kéo theo, tập hợp, các phép toán trên tập hợp (giao, hợp, hiệu).',
      defaultFocus: '- Nhận biết: Mệnh đề toán học, mệnh đề chứa biến, ký hiệu với mọi và tồn tại\n- Thông hiểu: Mệnh đề phủ định, mệnh đề kéo theo; Các phép toán giao, hợp, hiệu của tập hợp số (khoảng, đoạn, nửa khoảng)\n- Vận dụng: Tìm tham số m để giao của hai tập hợp bằng rỗng hoặc khác rỗng; Bài toán logic thực tế'
    },
    {
      id: 'g10-ch2',
      grade: 10,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Bất phương trình và Hệ bất phương trình bậc nhất hai ẩn',
      shortTitle: 'Bất phương trình bậc nhất hai ẩn',
      description: 'Bất phương trình bậc nhất hai ẩn, biểu diễn miền nghiệm, hệ bất phương trình bậc nhất hai ẩn, bài toán tối ưu.',
      defaultFocus: '- Nhận biết: Dạng bất phương trình và hệ bất phương trình bậc nhất hai ẩn\n- Thông hiểu: Biểu diễn miền nghiệm của bất phương trình và hệ bất phương trình trên mặt phẳng Oxy\n- Vận dụng: Giải bài toán quy hoạch tuyến tính tìm giá trị lớn nhất, nhỏ nhất của biểu thức F(x, y) trong bài toán kinh tế'
    },
    {
      id: 'g10-ch3',
      grade: 10,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Hệ thức lượng trong tam giác',
      shortTitle: 'Hệ thức lượng trong tam giác',
      description: 'Giá trị lượng giác của góc từ 0 đến 180 độ, định lý côsin, định lý sin, công thức tính diện tích tam giác, giải tam giác.',
      defaultFocus: '- Nhận biết: Giá trị lượng giác của các góc đặc biệt; Định lý côsin a^2 = b^2 + c^2 - 2bc.cosA và định lý sin a/sinA = 2R\n- Thông hiểu: Các công thức tính diện tích tam giác (Heron, S = 1/2.ab.sinC, S = pr, S = abc/4R)\n- Vận dụng: Giải tam giác và các bài toán đo khoảng cách, chiều cao trong thực tế hàng hải, trắc địa'
    },
    {
      id: 'g10-ch4',
      grade: 10,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Vectơ và các phép toán vectơ',
      shortTitle: 'Vectơ và các phép toán',
      description: 'Khái niệm vectơ, tổng và hiệu của hai vectơ, tích của một số với vectơ, tích vô hướng của hai vectơ.',
      defaultFocus: '- Nhận biết: Hai vectơ cùng phương, cùng hướng, bằng nhau, vectơ-không; Tích vô hướng a.b = |a|.|b|.cos(a, b)\n- Thông hiểu: Quy tắc 3 điểm, quy tắc hình bình hành; Biểu diễn một vectơ theo hai vectơ không cùng phương\n- Vận dụng: Chứng minh ba điểm thẳng hàng; Tính góc giữa hai vectơ và chứng minh hai đường thẳng vuông góc'
    },
    {
      id: 'g10-ch5',
      grade: 10,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Các số đặc trưng đo xu thế trung tâm và mức độ phân tán của mẫu số liệu không ghép nhóm',
      shortTitle: 'Thống kê không ghép nhóm',
      description: 'Số trung bình, trung vị, tứ phân vị, mốt, khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn.',
      defaultFocus: '- Nhận biết: Công thức tính số trung bình, trung vị (Me), tứ phân vị (Q1, Q2, Q3), mốt (Mo)\n- Thông hiểu: Tính khoảng biến thiên, khoảng tứ phân vị (Delta Q = Q3 - Q1), phương sai (s^2) và độ lệch chuẩn (s)\n- Vận dụng: So sánh độ phân tán và mức độ ổn định của hai nhóm dữ liệu trong thực nghiệm và học tập'
    },
    {
      id: 'g10-ch6',
      grade: 10,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Hàm số, Đồ thị và Ứng dụng (Hàm số bậc hai)',
      shortTitle: 'Hàm số bậc hai và Dấu tam thức',
      description: 'Khái niệm hàm số, tập xác định, hàm số bậc hai y = ax^2 + bx + c, dấu của tam thức bậc hai, bất phương trình bậc hai.',
      defaultFocus: '- Nhận biết: Tập xác định của hàm số; Đỉnh, trục đối xứng và hướng bề lõm của Parabol bậc hai\n- Thông hiểu: Xét dấu của tam thức bậc hai f(x) = ax^2 + bx + c; Giải bất phương trình bậc hai một ẩn\n- Vận dụng: Tìm tham số m để bất phương trình bậc hai nghiệm đúng với mọi x; Bài toán quỹ đạo chuyển động thực tế'
    },
    {
      id: 'g10-ch7',
      grade: 10,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Phương pháp tọa độ trong mặt phẳng Oxy',
      shortTitle: 'Phương pháp tọa độ Oxy',
      description: 'Tọa độ vectơ, phương trình đường thẳng, khoảng cách, góc, phương trình đường tròn, ba đường conic (Elip, Hypebol, Parabol).',
      defaultFocus: '- Nhận biết: Tọa độ điểm và vectơ; Phương trình tổng quát và tham số của đường thẳng; Phương trình chính tắc đường tròn và Conic\n- Thông hiểu: Tính khoảng cách từ điểm đến đường thẳng, góc giữa hai đường thẳng; Viết phương trình tiếp tuyến đường tròn\n- Vận dụng: Vị trí tương đối của điểm, đường thẳng với đường tròn; Bài toán tìm tọa độ các đỉnh tam giác trong Oxy'
    },
    {
      id: 'g10-ch8',
      grade: 10,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Đại số tổ hợp (Quy tắc đếm, Hoán vị, Chỉnh hợp, Tổ hợp, Nhị thức Newton)',
      shortTitle: 'Đại số tổ hợp & Nhị thức Newton',
      description: 'Quy tắc cộng, quy tắc nhân, hoán vị (Pn), chỉnh hợp (Ank), tổ hợp (Cnk), khai triển nhị thức Newton.',
      defaultFocus: '- Nhận biết: Phân biệt quy tắc cộng và quy tắc nhân; Định nghĩa hoán vị, chỉnh hợp, tổ hợp\n- Thông hiểu: Áp dụng công thức tính số cách chọn, xếp hàng, chọn ban cán sự; Khai triển nhị thức Newton (a + b)^4, (a + b)^5\n- Vận dụng: Tìm hệ số của số hạng chứa x^k trong khai triển; Bài toán đếm số tự nhiên có các chữ số đôi một khác nhau'
    },
    {
      id: 'g10-ch9',
      grade: 10,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Tính xác suất theo định nghĩa cổ điển',
      shortTitle: 'Xác suất cổ điển Toán 10',
      description: 'Biến cố, không gian mẫu, tính xác suất bằng định nghĩa cổ điển, các quy tắc tính xác suất (biến cố đối, cộng xác suất).',
      defaultFocus: '- Nhận biết: Biến cố ngẫu nhiên, không gian mẫu Omega, biến cố đối\n- Thông hiểu: Tính số phần tử không gian mẫu n(Omega) và số kết quả thuận lợi n(A) bằng tổ hợp\n- Vận dụng: Tính xác suất của các bài toán chọn ngẫu nhiên bi, thẻ bài, học sinh có điều kiện'
    }
  ],

  // ==========================================
  // KHỐI 11: TOÁN LỚP 11 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  11: [
    {
      id: 'g11-ch1',
      grade: 11,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Hàm số lượng giác và Phương trình lượng giác',
      shortTitle: 'Hàm số lượng giác & Phương trình',
      description: 'Góc lượng giác, công thức lượng giác (cộng, nhân đôi, biến đổi tích thành tổng), hàm số lượng giác, phương trình lượng giác cơ bản.',
      defaultFocus: '- Nhận biết: Giá trị lượng giác của các cung đặc biệt; Tập xác định, chu kỳ của hàm số y = sinx, cosx, tanx\n- Thông hiểu: Áp dụng công thức lượng giác rút gọn biểu thức; Giải phương trình lượng giác cơ bản sinx = m, cosx = m, tanx = m\n- Vận dụng: Giải phương trình lượng giác có điều kiện nghiệm thuộc khoảng; Ứng dụng dao động điều hòa'
    },
    {
      id: 'g11-ch2',
      grade: 11,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Dãy số, Cấp số cộng và Cấp số nhân',
      shortTitle: 'Dãy số, Cấp số cộng & Cấp số nhân',
      description: 'Khái niệm dãy số, dãy số tăng giảm, công thức số hạng tổng quát và tổng n số hạng đầu của Cấp số cộng và Cấp số nhân.',
      defaultFocus: '- Nhận biết: Định nghĩa dãy số, số hạng tổng quát un; Nhận diện cấp số cộng với công sai d, cấp số nhân với công bội q\n- Thông hiểu: Công thức un = u1 + (n-1)d, Sn = n/2(u1 + un); Công thức un = u1.q^(n-1), Sn = u1(1-q^n)/(1-q)\n- Vận dụng: Tìm các yếu tố của CSC, CSN; Bài toán thực tế về lãi kép ngân hàng, khấu hao tài sản, tăng trưởng dân số'
    },
    {
      id: 'g11-ch3',
      grade: 11,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
      shortTitle: 'Thống kê mẫu số liệu ghép nhóm',
      description: 'Mẫu số liệu ghép nhóm, số trung bình, trung vị, tứ phân vị, mốt của mẫu số liệu ghép nhóm.',
      defaultFocus: '- Nhận biết: Nhóm số liệu [a; b), độ dài nhóm, giá trị đại diện của nhóm\n- Thông hiểu: Công thức tính số trung bình, trung vị Me, tứ phân vị Q1, Q3 và mốt Mo của mẫu số liệu ghép nhóm\n- Vận dụng: Phân tích số liệu điều tra thu nhập, điểm thi, chiều cao học sinh và nhận xét xu thế tập trung'
    },
    {
      id: 'g11-ch4',
      grade: 11,
      chapterNumber: 4,
      term: 'Học kỳ 1',
      title: 'Chương 4: Quan hệ song song trong không gian',
      shortTitle: 'Quan hệ song song trong không gian',
      description: 'Đường thẳng và mặt phẳng trong không gian, hai đường thẳng song song, đường thẳng song song mặt phẳng, hai mặt phẳng song song, phép chiếu.',
      defaultFocus: '- Nhận biết: Các tiên đề hình học không gian; Vị trí tương đối của hai đường thẳng, đường thẳng và mặt phẳng, hai mặt phẳng\n- Thông hiểu: Dấu hiệu nhận biết đường thẳng song song mặt phẳng (d // a thuộc (P)); Dấu hiệu nhận biết hai mặt phẳng song song\n- Vận dụng: Tìm giao tuyến của hai mặt phẳng; Tìm thiết diện của hình chóp/lăng trụ cắt bởi mặt phẳng song song'
    },
    {
      id: 'g11-ch5',
      grade: 11,
      chapterNumber: 5,
      term: 'Học kỳ 1',
      title: 'Chương 5: Giới hạn và Hàm số liên tục',
      shortTitle: 'Giới hạn và Hàm số liên tục',
      description: 'Giới hạn của dãy số, giới hạn của hàm số tại một điểm và vô cực, các dạng vô định, hàm số liên tục và ứng dụng.',
      defaultFocus: '- Nhận biết: Định nghĩa giới hạn lim un = 0, lim q^n = 0 (|q| < 1); Giới hạn vô cực\n- Thông hiểu: Khử dạng vô định 0/0, vô cùng/vô cùng bằng phân tích nhân tử hoặc nhân liên hợp; Xét tính liên tục của hàm số tại 1 điểm\n- Vận dụng: Tìm tham số để hàm số liên tục trên R; Chứng minh phương trình có ít nhất một nghiệm trong khoảng (a; b)'
    },
    {
      id: 'g11-ch6',
      grade: 11,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Hàm số mũ và Hàm số lôgarit',
      shortTitle: 'Hàm số mũ và Hàm số lôgarit',
      description: 'Phép tính lũy thừa với số mũ thực, phép tính lôgarit, hàm số mũ, hàm số lôgarit, phương trình và bất phương trình mũ, lôgarit.',
      defaultFocus: '- Nhận biết: Tính chất lũy thừa và lôgarit cơ bản; Tập xác định và đồ thị của hàm số y = a^x và y = log_a(x)\n- Thông hiểu: Rút gọn biểu thức chứa lũy thừa, lôgarit; Giải phương trình mũ và lôgarit cơ bản bằng đưa về cùng cơ số hoặc đặt ẩn phụ\n- Vận dụng: Giải bất phương trình mũ, lôgarit; Bài toán thực tế về thang đo Richter động đất, độ pH hóa học'
    },
    {
      id: 'g11-ch7',
      grade: 11,
      chapterNumber: 7,
      term: 'Học kỳ 2',
      title: 'Chương 7: Đạo hàm và Ứng dụng',
      shortTitle: 'Đạo hàm và Ý nghĩa hình học',
      description: 'Định nghĩa đạo hàm, ý nghĩa hình học (tiếp tuyến), các quy tắc tính đạo hàm (tổng, hiệu, tích, thương, hàm hợp), đạo hàm cấp hai.',
      defaultFocus: '- Nhận biết: Định nghĩa đạo hàm bằng giới hạn; Bảng đạo hàm của các hàm số cơ bản (x^n, căn(x), sinx, cosx, a^x, lnx)\n- Thông hiểu: Quy tắc đạo hàm hàm hợp; Viết phương trình tiếp tuyến của đồ thị hàm số tại một điểm hoặc khi biết hệ số góc k\n- Vận dụng: Đạo hàm cấp hai và bài toán chuyển động vật lý (vận tốc tức thời v(t) = s\'(t), gia tốc a(t) = s\'\'(t))'
    },
    {
      id: 'g11-ch8',
      grade: 11,
      chapterNumber: 8,
      term: 'Học kỳ 2',
      title: 'Chương 8: Quan hệ vuông góc trong không gian',
      shortTitle: 'Quan hệ vuông góc trong không gian',
      description: 'Hai đường thẳng vuông góc, đường thẳng vuông góc mặt phẳng, hai mặt phẳng vuông góc, khoảng cách, góc trong không gian.',
      defaultFocus: '- Nhận biết: Định lý đường thẳng vuông góc với mặt phẳng (d vuông góc 2 đường cắt nhau trong (P)); Định lý ba đường vuông góc\n- Thông hiểu: Xác định góc giữa đường thẳng và mặt phẳng, góc phẳng nhị diện giữa hai mặt phẳng; Khoảng cách từ điểm đến mặt phẳng\n- Vận dụng: Tính khoảng cách giữa hai đường thẳng chéo nhau; Tính góc và khoảng cách trong khối chóp, lăng trụ'
    },
    {
      id: 'g11-ch9',
      grade: 11,
      chapterNumber: 9,
      term: 'Học kỳ 2',
      title: 'Chương 9: Xác suất và các quy tắc tính xác suất',
      shortTitle: 'Quy tắc cộng và nhân xác suất',
      description: 'Biến cố hợp, biến cố giao, biến cố độc lập, quy tắc cộng xác suất cho biến cố xung khắc, quy tắc nhân xác suất cho biến cố độc lập.',
      defaultFocus: '- Nhận biết: Định nghĩa biến cố hợp A hợp B, biến cố giao A giao B; Nhận biết hai biến cố độc lập hoặc xung khắc\n- Thông hiểu: Công thức cộng xác suất P(A hợp B) = P(A) + P(B) - P(AB); Công thức nhân P(AB) = P(A).P(B) khi A, B độc lập\n- Vận dụng: Tính xác suất bài toán bắn trúng bia, mạch điện hoạt động, bài toán khám chữa bệnh độc lập'
    }
  ],

  // ==========================================
  // KHỐI 12: TOÁN LỚP 12 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
  // ==========================================
  12: [
    {
      id: 'g12-ch1',
      grade: 12,
      chapterNumber: 1,
      term: 'Học kỳ 1',
      title: 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số',
      shortTitle: 'Khảo sát hàm số & Ứng dụng đạo hàm',
      description: 'Tính đơn điệu, cực trị, giá trị lớn nhất và nhỏ nhất, đường tiệm cận, khảo sát sự biến thiên và đồ thị, ứng dụng tối ưu thực tế.',
      defaultFocus: '- Nhận biết: Khái niệm đồng biến, nghịch biến; Điểm cực đại, cực tiểu; Tiệm cận đứng, tiệm cận ngang, tiệm cận xiên\n- Thông hiểu: Lập bảng biến thiên và xác định đồ thị hàm đa thức bậc 3, hàm phân thức bậc 1/bậc 1, bậc 2/bậc 1; Tìm GTLN, GTNN trên đoạn\n- Vận dụng: Tìm tham số m để hàm số đơn điệu hoặc có cực trị thỏa mãn điều kiện; Bài toán tối ưu hóa chi phí, thể tích thực tế'
    },
    {
      id: 'g12-ch2',
      grade: 12,
      chapterNumber: 2,
      term: 'Học kỳ 1',
      title: 'Chương 2: Tọa độ của vectơ trong không gian Oxyz',
      shortTitle: 'Vectơ trong không gian Oxyz',
      description: 'Hệ trục tọa độ Oxyz, tọa độ điểm và vectơ, các phép toán vectơ, tích vô hướng, tích có hướng và ứng dụng.',
      defaultFocus: '- Nhận biết: Hệ trục tọa độ Oxyz, tọa độ các điểm đặc biệt, tọa độ của tổng, hiệu, tích vectơ với số\n- Thông hiểu: Tích vô hướng, tính độ dài vectơ, khoảng cách giữa 2 điểm; Tích có hướng của hai vectơ [a, b]\n- Vận dụng: Ứng dụng tích có hướng tính diện tích tam giác, thể tích khối tứ diện, khối hộp; Chứng minh 4 điểm đồng phẳng'
    },
    {
      id: 'g12-ch3',
      grade: 12,
      chapterNumber: 3,
      term: 'Học kỳ 1',
      title: 'Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm',
      shortTitle: 'Mức độ phân tán mẫu ghép nhóm',
      description: 'Khoảng biến thiên, khoảng tứ phân vị, phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm.',
      defaultFocus: '- Nhận biết: Định nghĩa khoảng biến thiên R = x_max - x_min; Khoảng tứ phân vị Delta Q = Q3 - Q1 của mẫu ghép nhóm\n- Thông hiểu: Công thức tính phương sai s^2 và độ lệch chuẩn s của mẫu số liệu ghép nhóm\n- Vận dụng: Phân tích, đánh giá rủi ro và mức độ ổn định của danh mục đầu tư hoặc chất lượng sản phẩm công nghiệp'
    },
    {
      id: 'g12-ch4',
      grade: 12,
      chapterNumber: 4,
      term: 'Học kỳ 2',
      title: 'Chương 4: Nguyên hàm và Tích phân',
      shortTitle: 'Nguyên hàm, Tích phân & Ứng dụng',
      description: 'Định nghĩa nguyên hàm, bảng nguyên hàm cơ bản, tích phân và tính chất, phương pháp đổi biến, từng phần, ứng dụng hình học.',
      defaultFocus: '- Nhận biết: Định nghĩa F\'(x) = f(x); Bảng nguyên hàm của các hàm số thường gặp; Các tính chất cơ bản của tích phân\n- Thông hiểu: Tính tích phân bằng phương pháp đổi biến số và tích phân từng phần; Ứng dụng tính diện tích hình phẳng giới hạn bởi đồ thị\n- Vận dụng: Tính thể tích khối tròn xoay quanh trục Ox; Bài toán vật lý tính quãng đường, công sinh ra trong thực tế'
    },
    {
      id: 'g12-ch5',
      grade: 12,
      chapterNumber: 5,
      term: 'Học kỳ 2',
      title: 'Chương 5: Phương pháp tọa độ trong không gian Oxyz (Mặt phẳng, Đường thẳng, Mặt cầu)',
      shortTitle: 'Mặt phẳng, Đường thẳng, Mặt cầu Oxyz',
      description: 'Phương trình mặt phẳng, phương trình đường thẳng, phương trình mặt cầu, vị trí tương đối, khoảng cách và góc trong không gian.',
      defaultFocus: '- Nhận biết: Vectơ pháp tuyến của mặt phẳng, vectơ chỉ phương của đường thẳng; Tâm và bán kính của mặt cầu (S)\n- Thông hiểu: Viết phương trình mặt phẳng đi qua 3 điểm hoặc vuông góc đường thẳng; Viết phương trình đường thẳng tham số, chính tắc\n- Vận dụng: Vị trí tương đối và khoảng cách; Tìm hình chiếu vuông góc của điểm lên mặt phẳng/đường thẳng; Bài toán cực trị Oxyz'
    },
    {
      id: 'g12-ch6',
      grade: 12,
      chapterNumber: 6,
      term: 'Học kỳ 2',
      title: 'Chương 6: Xác suất có điều kiện và Công thức xác suất toàn phần',
      shortTitle: 'Xác suất có điều kiện & Bayes',
      description: 'Khái niệm xác suất có điều kiện P(A|B), công thức nhân xác suất, sơ đồ hình cây, công thức xác suất toàn phần và công thức Bayes.',
      defaultFocus: '- Nhận biết: Định nghĩa xác suất có điều kiện P(A|B) = P(AB)/P(B); Sơ đồ hình cây biểu diễn bài toán xác suất nhiều giai đoạn\n- Thông hiểu: Công thức xác suất toàn phần P(A) = P(B1).P(A|B1) + P(B2).P(A|B2); Công thức Bayes\n- Vận dụng: Bài toán chẩn đoán y khoa (xác suất người dương tính thực sự mắc bệnh), xác suất kiểm định chất lượng hàng hóa'
    },
    {
      id: 'g12-onthpt',
      grade: 12,
      term: 'Chuyên đề ôn tập',
      title: 'Chuyên đề Ôn thi Tốt nghiệp THPT & Đánh giá năng lực Quốc gia (Toán 12)',
      shortTitle: 'Ôn thi Tốt nghiệp THPT & ĐGNL',
      description: 'Tổng hợp đề thi chuẩn cấu trúc mới Bộ GD&ĐT: Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn; Vận dụng cao thực tế.',
      defaultFocus: '- Dạng 1: Đọc đồ thị hàm số, tiệm cận, điểm cực trị và bài toán thực tế tối ưu đạo hàm\n- Dạng 2: Nguyên hàm, tích phân và bài toán diện tích, thể tích có yếu tố thực tiễn đời sống\n- Dạng 3: Hình học không gian Oxyz gắn hệ tọa độ giải bài toán thực tế kiến trúc, radar, tàu bay\n- Dạng 4: Xác suất có điều kiện và công thức Bayes trong kinh tế, y tế, thống kê\n- Dạng 5: Thống kê số liệu ghép nhóm và phân tích quyết định'
    }
  ]
};

// Helper để lấy danh sách đầy đủ chuyên đề theo khối lớp
export function getCurriculumTopicsByGrade(grade: number): CurriculumTopic[] {
  const g = Number(grade) || 8;
  return CURRICULUM_TOPICS_BY_GRADE[g] || CURRICULUM_TOPICS_BY_GRADE[8] || [];
}
