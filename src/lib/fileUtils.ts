/**
 * Utility functions for file handling and conversions
 */
import { getFileFromIDB, saveFileToIDB } from './idbStorage';

export function dataUrlToFile(dataUrl: string, filename: string, mimeType?: string): File {
  const parts = dataUrl.split(',');
  const mime = mimeType || (parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream');
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Resolves full dataUrl for an attachment (handles inline dataUrl, IndexedDB, or server endpoint)
 */
export async function ensureAttachmentDataUrl(attachment?: { 
  dataUrl?: string; 
  fileId?: string; 
  fileUrl?: string; 
  name?: string; 
  type?: string 
} | null): Promise<string> {
  if (!attachment) return '';
  if (attachment.dataUrl) return attachment.dataUrl;

  // Try IndexedDB first
  if (attachment.fileId) {
    const fromIdb = await getFileFromIDB(attachment.fileId);
    if (fromIdb) return fromIdb;
  }

  // Try server data endpoint
  if (attachment.fileId) {
    try {
      const res = await fetch(`/api/document-file-data/${attachment.fileId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.dataUrl) {
          await saveFileToIDB(attachment.fileId, data.dataUrl).catch(() => {});
          return data.dataUrl;
        }
      }
    } catch (e) {
      console.warn('Could not fetch document file data:', e);
    }
  }

  // Try direct fileUrl
  if (attachment.fileUrl) {
    try {
      const res = await fetch(attachment.fileUrl);
      if (res.ok) {
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            if (attachment.fileId) {
              await saveFileToIDB(attachment.fileId, dataUrl).catch(() => {});
            }
            resolve(dataUrl);
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn('Could not fetch document fileUrl:', e);
    }
  }

  return '';
}
