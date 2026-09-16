import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const oldBlock = `
      if (newFile) {
        testData.fileUrl = finalFileUrl || "";
        testData.fileName = newFile.name;

        if (extractionFileUrl) {
          setSysMsg('Đang dùng AI trích xuất câu hỏi từ tài liệu... Vui lòng chờ...');
          try {
            const res = await fetch('/api/extract-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
              body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
            });
            if (res.ok) {
              const extracted = await res.json();
              if (Array.isArray(extracted) && extracted.length > 0) {
                testData.questionsData = JSON.stringify(extracted);
                if (testData.type === 'essay') {
                  testData.type = 'mixed';
                }
              } else {
                setSysError('AI trả về kết quả rỗng. Vui lòng kiểm tra lại tài liệu.');
                setIsSaving(false);
                return;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi trích xuất bằng AI: ' + (errData.error || errData.details || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e) {
             console.error("Extraction error", e);
             setSysError('Lỗi kết nối khi trích xuất tài liệu.');
             setIsSaving(false);
             return;
          }
        }
      }
`;

const newBlock = `
      if (newFile) {
        testData.fileUrl = finalFileUrl || "";
        testData.fileName = newFile.name;

        if (splitAnswers && extractionFileUrl) {
           setSysMsg('Đang dùng AI để phân tích và tách riêng Đề bài / Đáp án... Vui lòng chờ (có thể mất 15-30s)...');
           try {
              const splitRes = await fetch('/api/split-document', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
                 body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
              });
              if (splitRes.ok) {
                 const splitData = await splitRes.json();
                 if (splitData.cleanTestHtml && splitData.answersHtml) {
                    const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
                    testData.fileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.cleanTestHtml + "</body></html>");
                    testData.fileName = "de_thi_sach.html";
                    testData.answerFileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.answersHtml + "</body></html>");
                    testData.answerFileName = "dap_an_chi_tiet.html";
                 } else {
                    setSysError('AI không thể tự động tách được Đề và Đáp án từ file này. Vui lòng bỏ tích chọn tách tự động, hoặc tự tách thành 2 file riêng biệt trên máy của bạn rồi tải lên.');
                    setIsSaving(false);
                    return;
                 }
              } else {
                 setSysError('Lỗi máy chủ khi tách đề.');
                 setIsSaving(false);
                 return;
              }
           } catch(e) {
              console.error("Split error", e);
              setSysError('Lỗi kết nối khi tách đề.');
              setIsSaving(false);
              return;
           }
        } else if (newAnswerFile) {
            const answerFileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(newAnswerFile);
            });
            if (newAnswerFile.size <= 800000) {
               testData.answerFileUrl = answerFileDataUrl;
               testData.answerFileName = newAnswerFile.name;
            } else {
               alert('Tệp đáp án quá lớn. Vui lòng dùng tệp nhỏ hơn.');
            }
        }

        if (extractionFileUrl) {
          setSysMsg('Đang dùng AI trích xuất câu hỏi từ tài liệu... Vui lòng chờ...');
          try {
            const res = await fetch('/api/extract-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
              body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
            });
            if (res.ok) {
              const extracted = await res.json();
              if (Array.isArray(extracted) && extracted.length > 0) {
                testData.questionsData = JSON.stringify(extracted);
                if (testData.type === 'essay') {
                  testData.type = 'mixed';
                }
              } else {
                setSysError('AI trả về kết quả rỗng. Vui lòng kiểm tra lại tài liệu.');
                setIsSaving(false);
                return;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi trích xuất bằng AI: ' + (errData.error || errData.details || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e) {
             console.error("Extraction error", e);
             setSysError('Lỗi kết nối khi trích xuất tài liệu.');
             setIsSaving(false);
             return;
          }
        }
      }
`;

if (content.includes(oldBlock.trim().substring(0, 50))) {
    content = content.replace(oldBlock.trim(), newBlock.trim());
    fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
    console.log("Successfully replaced block");
} else {
    console.log("Could not find the block to replace");
}
