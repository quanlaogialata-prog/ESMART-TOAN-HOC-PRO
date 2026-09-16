export const chapter1Data = {
  topic: {
    name: "Chương 1: Phương trình và Hệ phương trình bậc nhất hai ẩn",
    grade: 9,
    isSpecial: false
  },
  lessons: [
    {
      title: "Bài 1: Phương trình bậc nhất hai ẩn",
      knowledge: `TÓM TẮT LÍ THUYẾT:
1. Khái niệm phương trình bậc nhất hai ẩn
+) Phương trình bậc nhất hai ẩn x, y là hệ thức dạng: ax + by = c, trong đó a,b,c là các số cho trước, a ≠ 0 hoặc b ≠ 0.
+) Cho phương trình bậc nhất hai ẩn x, y : ax + by = c. Nếu ax0 + by0 = c là khẳng định đúng thì cặp số (x0; y0) được gọi là một nghiệm của phương trình.

Chú ý:
• Mỗi phương trình bậc nhất hai ẩn đều có vô số nghiệm.
• Trong mặt phẳng tọa độ, tập hợp các điểm có tọa độ (x; y) thỏa mãn phương trình bậc nhất hai ẩn ax + by = c là một đường thẳng. Đường thẳng đó gọi là đường thẳng ax + by = c.

CÁC DẠNG TOÁN VÀ VÍ DỤ MẪU:
Ví dụ 1: Trong các phương trình sau, phương trình nào là phương trình bậc nhất hai ẩn? tại sao?
1) x + 2y = -3    2) 0x - 3y = 0    3) 0x + 0y = 2    4) 2x + y^2 = 8
Lời giải:
1) Phương trình x + 2y = -3 là phương trình bậc nhất hai ẩn vì có dạng ax + by = c và a=1≠0, b=2≠0.
2) Phương trình 0x - 3y = 0 là phương trình bậc nhất hai ẩn.
3) Phương trình 0x + 0y = 2 không phải phương trình bậc nhất hai ẩn vì a=0, b=0.
4) Phương trình 2x + y^2 = 8 không phải phương trình bậc nhất hai ẩn vì không có dạng ax + by = c.

Ví dụ 2: Trong các cặp số (12;1), (1;1), cặp số nào là nghiệm của phương trình 2x - 5y = 19.
Lời giải:
+) Thay x=12, y=1 vào 2x - 5y = 19, ta có: 2.12 - 5.1 = 19 (luôn đúng). Vậy (12;1) là một nghiệm.
+) Thay x=1, y=1 vào 2x - 5y = 19, ta có: 2.1 - 5.1 = -3 ≠ 19. Vậy (1;1) không phải là nghiệm.

Ví dụ 3: Tìm m để phương trình mx - y = 3m - 1 có một nghiệm là (2; -3).
Lời giải: 
Thay x=2, y=-3 vào phương trình: m(2) - (-3) = 3m - 1 <=> 2m + 3 = 3m - 1 <=> m = 4.

BÀI TẬP TỰ LUYỆN:
Bài 1. Trong các phương trình sau, phương trình nào là phương trình bậc nhất hai ẩn? tại sao?
1) -a + 2b = 15     2) 5x - 0y = 0     3) 0x + 0y = -1     4) -x^2 + 2y^2 = 8
Bài 2. Cặp số (2; -3) là nghiệm của phương trình bậc nhất hai ẩn nào trong các phương trình sau:
1) x - y = 1      2) 2x - y = 7      3) -3x + 5y = -21
Bài 3. Tìm các giá trị của tham số m để phương trình bậc nhất hai ẩn 4mx - 2y = m + 1 có một nghiệm là (1; -1).
Bài 4. Viết công thức nghiệm tổng quát của các phương trình sau:
1) 3x - y = 1      2) x - 2y = 4      3) 3x + 2y = 5`
    },
    {
      title: "Bài 2: Hệ phương trình bậc nhất hai ẩn",
      knowledge: `TÓM TẮT LÍ THUYẾT:
2. Hệ hai phương trình bậc nhất hai ẩn
+) Cho hệ hai phương trình bậc nhất hai ẩn: 
{ a1x + b1y = c1 
{ a2x + b2y = c2 (I)
+) Nếu cặp số (x0; y0) là nghiệm của từng phương trình trong hệ (I) thì cặp (x0; y0) được gọi là nghiệm của hệ (I).
+) Giải hệ phương trình người ta hay dùng phương pháp thế hoặc phương pháp cộng đại số.

CÁC DẠNG TOÁN VÀ VÍ DỤ MẪU:
Ví dụ 4. Giải hệ phương trình bằng phương pháp thế:
{ 3x - 2y = 11
{ x + 2y = 1
Lời giải:
Từ PT(2) => x = 1 - 2y. Thế vào PT(1): 3(1 - 2y) - 2y = 11 <=> 3 - 6y - 2y = 11 <=> -8y = 8 <=> y = -1.
Thay y = -1 vào x = 1 - 2y => x = 1 - 2(-1) = 3.
Vậy hệ phương trình có nghiệm duy nhất (x;y) = (3; -1).

Ví dụ 6. Giải hệ phương trình bằng phương pháp cộng:
{ 3x - 2y = 11
{ x + 2y = 1
Lời giải:
Cộng vế với vế hai phương trình: (3x + x) + (-2y + 2y) = 11 + 1 <=> 4x = 12 <=> x = 3.
Thay x = 3 vào PT(2): 3 + 2y = 1 <=> 2y = -2 <=> y = -1.
Vậy hệ phương trình có nghiệm duy nhất (x;y) = (3; -1).

Ví dụ 7. Giải hệ phương trình bằng phương pháp đặt ẩn phụ:
{ 1/x - 1/y = 1
{ 3/x + 4/y = 5
Lời giải: Điều kiện x,y ≠ 0. Đặt a = 1/x, b = 1/y.
Ta có hệ: { a - b = 1 ; 3a + 4b = 5 } => a = 9/7, b = 2/7.
=> 1/x = 9/7 => x = 7/9; 1/y = 2/7 => y = 7/2 (thỏa mãn ĐK).

BÀI TẬP TỰ LUYỆN:
Bài 5. Giải hệ các phương trình sau bằng phương pháp thế:
a) { x + y = 5 ; 4x - 3y = -1 }
b) { x - 2y = 2 ; 2x - 4y = 4 }
c) { 8x - 2y = 10 ; -4x + y = 3 }
Bài 6. Giải hệ các phương trình sau bằng phương pháp cộng đại số:
a) { -2x + 3y = 5 ; 4x - 3y = -1 }
b) { x - 2y = 2 ; 2x - 4y = 4 }
c) { x + 2y = 6 ; 2x + 3y = 7 }`
    },
    {
      title: "Bài 3: Hệ phương trình chứa tham số",
      knowledge: `TÓM TẮT LÍ THUYẾT:
Xét hệ phương trình (I):
{ ax + by = c
{ a'x + b'y = c'
Tọa độ điểm chung của hai đường thẳng (d): ax + by = c và (d'): a'x + b'y = c' là nghiệm của hệ phương trình (I).
+) Hệ phương trình có nghiệm duy nhất khi d cắt d' <=> a/a' ≠ b/b'
+) Hệ phương trình vô nghiệm khi d // d' <=> a/a' = b/b' ≠ c/c'
+) Hệ phương trình có vô số nghiệm khi d trùng d' <=> a/a' = b/b' = c/c'

CÁC DẠNG TOÁN VÀ VÍ DỤ MẪU:
Ví dụ 3. Cho hệ phương trình:
{ 2x - my = m^2
{ x + y = 2
(với m là tham số)
1) Tìm m để hệ phương trình có nghiệm duy nhất.
Lời giải: Để hệ có nghiệm duy nhất thì a/a' ≠ b/b' hay 2/1 ≠ -m/1 <=> m ≠ -2.
2) Tìm m để hệ phương trình có vô số nghiệm.
Lời giải: Để hệ có vô số nghiệm thì a/a' = b/b' = c/c' hay 2/1 = -m/1 = m^2/2.
=> m = -2 và m^2 = 4 <=> m = -2.

BÀI TẬP TỰ LUYỆN:
Bài 3. Cho hệ phương trình :
{ 2x + ay = -4
{ ax - 3y = 5
1) Giải hệ phương trình với a = 1
2) Tìm a để hệ phương trình có nghiệm duy nhất.
Bài 4. Cho hệ phương trình:
{ x + 2y = -3
{ 2x - 3y = m
1) Giải hệ phương trình khi m = 1.
2) Tìm m để hệ có nghiệm duy nhất (x;y) thỏa mãn x + y = -3.`
    },
    {
      title: "Bài 4: Giải bài toán bằng cách lập hệ phương trình",
      knowledge: `TÓM TẮT LÍ THUYẾT:
Các bước giải bài toán bằng cách lập hệ phương trình:
- Bước 1: Lập hệ phương trình:
  + Chọn hai ẩn biểu thị hai đại lượng chưa biết và đặt điều kiện thích hợp.
  + Biểu diễn các đại lượng liên quan theo các ẩn.
  + Lập hệ phương trình biểu thị mối quan hệ.
- Bước 2: Giải hệ hai phương trình nói trên.
- Bước 3: Kiểm tra nghiệm và kết luận.

CÁC DẠNG TOÁN VÀ VÍ DỤ MẪU:
Ví dụ (Toán chuyển động): Một ô tô dự định đi từ A đến B trong thời gian nhất định. Nếu xe chạy mỗi giờ nhanh hơn 10km thì đến nơi sớm hơn 3 giờ, nếu xe chạy chậm lại mỗi giờ 10km thì đến nơi chậm mất 5 giờ. Tính vận tốc, thời gian dự định và quãng đường AB.
Lời giải:
Gọi vận tốc dự định là x (km/h, x>10), thời gian dự định là y (giờ, y>3).
Quãng đường AB là xy.
Theo đề bài, ta có hệ PT:
{ (x + 10)(y - 3) = xy
{ (x - 10)(y + 5) = xy
Giải hệ ta được: x = 40, y = 15. Quãng đường = 600km.

Ví dụ (Toán năng suất): Lớp 9A giao cho An mua 15 hộp bánh và 5 túi kẹo hết 850 nghìn đồng. Giá mỗi hộp bánh hơn giá mỗi túi kẹo là 10 nghìn đồng. Tính giá tiền 1 hộp bánh, 1 túi kẹo.
Lời giải:
Gọi giá 1 hộp bánh là x, giá 1 túi kẹo là y (nghìn đồng, x>0, y>0).
Ta có hệ:
{ 15x + 5y = 850
{ x - y = 10
Giải hệ: x = 45, y = 35. Vậy bánh giá 45.000đ, kẹo giá 35.000đ.

BÀI TẬP TỰ LUYỆN:
Bài 1. Một ca nô chạy xuôi dòng một khúc sông dài 72km, rồi ngược dòng 64km hết 7h. Nếu xuôi dòng 120km rồi ngược dòng 32km cũng hết 7h. Tính vận tốc riêng ca nô và dòng nước.
Bài 2. Một tổ may 47 người nhận may 350 chiếc áo. Mỗi nam may 8 áo, mỗi nữ may 7 áo. Tính số công nhân nam, nữ.
Bài 3. Một sân trường HCN có chiều dài hơn chiều rộng 16m. Hai lần chiều dài kém 5 lần chiều rộng 28m. Tính kích thước sân trường.`
    },
    {
      title: "Bài 5: Ôn tập chương 1",
      knowledge: `BÀI TẬP TRẮC NGHIỆM ÔN TẬP CHƯƠNG:
Câu 1: Trong các phương trình sau, phương trình nào là phương trình bậc nhất hai ẩn x,y?
A. 2x^2 + 2y = 4     B. 3/x + 4/y = 4     C. 0.x + 0.y = 7     D. 2x - 3y = 0

Câu 2: Cặp số nào sau đây là nghiệm của phương trình x - 3y = -1?
A. (2;0)      B. (2;1)      C. (1;2)      D. (2;-11)

Câu 3: Với giá trị nào của k thì phương trình x - ky = -1 nhận cặp số (1;2) làm nghiệm?
A. k = 2      B. k = 1      C. k = -1     D. k = 0

BÀI TẬP TỰ LUYỆN:
Bài 1. Giải hệ các phương trình sau:
1) { 2x - y = 4 ; x + 3y = -5 }
2) { 2x + y = 5 ; 3x - y = 5 }
3) { 2x + 3y = 8 ; -x + y = 1 }

Bài 2. Giải hệ các phương trình sau:
1) { 1/x + 1/y = 1/12 ; 8/x + 15/y = 1 }
2) { 1/x + 1/y = -1 ; 3/x - 2/y = 7 }

Bài 3. Cho hệ phương trình:
{ -mx + y = -2m
{ x - y = -1
1) Tìm m để cặp số (1;2) là nghiệm.
2) Tìm m để hệ có nghiệm duy nhất.
3) Tìm m để hệ vô nghiệm.
4) Tìm m để hệ có vô số nghiệm.`
    }
  ],
  tests: [
    {
      title: "Đề trắc nghiệm: Phương trình bậc nhất hai ẩn",
      durationMinutes: 15,
      type: "mcq",
      questionsData: JSON.stringify([
        {
          id: "q1",
          text: "Trong các phương trình sau, phương trình nào là phương trình bậc nhất hai ẩn?",
          options: ["4x^2 + 5y = 7", "x + 2y^2 = 5", "2x^2 + 3y^2 = 1", "2a + 5b = 9"],
          correctOption: 3,
          explanation: "Phương trình bậc nhất hai ẩn có dạng ax + by = c (a, b không đồng thời bằng 0). 2a + 5b = 9 có dạng này với ẩn a và b."
        },
        {
          id: "q2",
          text: "Phương trình nào dưới đây là phương trình bậc nhất hai ẩn x, y?",
          options: ["2.x^2 + 2y = 4", "3/x + 4/y = 4", "0.x + 0.y = 7", "2.x - 3.y = 0"],
          correctOption: 3,
          explanation: "Phương trình 2x - 3y = 0 là phương trình bậc nhất 2 ẩn vì có dạng ax + by = c và a=2, b=-3."
        },
        {
          id: "q3",
          text: "Cặp số nào sau đây là nghiệm của phương trình x - 3y = -1?",
          options: ["(2;0)", "(2;1)", "(1;2)", "(2;-11)"],
          correctOption: 1,
          explanation: "Thay x=2, y=1 vào phương trình: 2 - 3(1) = 2 - 3 = -1 (đúng)."
        },
        {
          id: "q4",
          text: "Cặp số nào sau đây không phải là nghiệm của phương trình x + 2y = -1?",
          options: ["(1;-1)", "(-1;0)", "(0;-1/2)", "(3;-2)"],
          correctOption: 1,
          explanation: "Thay x=-1, y=0 vào phương trình: -1 + 2(0) = -1 (là nghiệm). Các đáp án khác cũng là nghiệm. Đợi đã, thay (1;-1) -> 1 - 2 = -1 (nghiệm). (-1;0) -> -1 + 0 = -1 (nghiệm). (0;-1/2) -> 0 - 1 = -1 (nghiệm). (3;-2) -> 3 - 4 = -1 (nghiệm). Đề bài gốc có lỗi (câu 4 trang 1 PDF, tất cả đều là nghiệm)."
        },
        {
          id: "q5",
          text: "Với giá trị nào của k thì phương trình x - ky = -1 nhận cặp số (1; 2) làm nghiệm?",
          options: ["k = 2", "k = 1", "k = -1", "k = 0"],
          correctOption: 1,
          explanation: "Thay x=1, y=2 vào: 1 - k(2) = -1 <=> 2k = 2 <=> k = 1."
        },
        {
          id: "q6",
          text: "Công thức nghiệm tổng quát của phương trình x + 2y = 0 là:",
          options: ["{ x ∈ R, y = -x/2 }", "{ x ∈ R, y = -2x }", "{ y ∈ R, x = -y/2 }", "{ x ∈ R, y = x/2 }"],
          correctOption: 0,
          explanation: "Từ x + 2y = 0 => 2y = -x => y = -x/2. Nghiệm là x ∈ R, y = -x/2."
        }
      ])
    },
    {
      title: "Đề trắc nghiệm: Hệ phương trình bậc nhất hai ẩn",
      durationMinutes: 15,
      type: "mcq",
      questionsData: JSON.stringify([
        {
          id: "q1",
          text: "Trong các hệ phương trình dưới đây, hệ phương trình nào là hệ hai phương trình bậc nhất hai ẩn?",
          options: ["{ x^2 - 2y = 0 ; 2x + 3y = 1 }", "{ x - 2y = 0 ; 2x + 3y = 1 }", "{ x - 2y^2 = 0 ; 2x + 3y = 1 }", "{ x^2 - 2y = 0 ; 2x + 3y^2 = 1 }"],
          correctOption: 1,
          explanation: "Hệ { x - 2y = 0 ; 2x + 3y = 1 } gồm 2 phương trình bậc nhất 2 ẩn."
        },
        {
          id: "q2",
          text: "Cặp số nào dưới đây là nghiệm của hệ phương trình { x - 2y = -4 ; x + y = -1 }?",
          options: ["(-2;1)", "(2;-1)", "(2;1)", "(-2;-1)"],
          correctOption: 0,
          explanation: "Giải hệ: trừ hai phương trình => -3y = -3 => y = 1. Thay vào => x = -1 - y = -2. Nghiệm là (-2;1)."
        },
        {
          id: "q3",
          text: "Cặp số (-3;2) là nghiệm của hệ phương trình nào?",
          options: ["{ x + 3y = 3 ; x - 3y = 9 }", "{ x + 3y = 3 ; x - 3y = -9 }", "{ x + 3y = 3 ; 3x - y = -9 }", "{ 3x + y = 3 ; x - 3y = -9 }"],
          correctOption: 1,
          explanation: "Thay x=-3, y=2 vào hệ B: -3 + 6 = 3 (đúng), -3 - 6 = -9 (đúng)."
        }
      ])
    }
  ]
};
