import fs from 'fs';
let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const oldFileToBase64 = `  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };`;

const newFileToBase64 = `  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // compress image to avoid 1MB Firestore limit
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height *= maxDim / width));
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width *= maxDim / height));
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress
      };
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(file);
    });
  };`;

content = content.replace(oldFileToBase64, newFileToBase64);

// Fix the error handling to alert if submit fails
const oldSubmit = `    setResult(submissionData);
    try {
      await addDoc(collection(db, 'submissions'), submissionData);
    } catch (err) {
      console.error("Lỗi lưu bài", err);
    }
    setLoading(false);`;

const newSubmit = `    try {
      await addDoc(collection(db, 'submissions'), submissionData);
      setResult(submissionData);
    } catch (err) {
      console.error("Lỗi lưu bài", err);
      alert("Có lỗi xảy ra khi lưu bài (file ảnh có thể quá lớn). Vui lòng thử lại.");
    }
    setLoading(false);`;

content = content.replace(oldSubmit, newSubmit);

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('done');
