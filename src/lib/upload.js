import api from './api';

/**
 * Converts a browser File object to a Base64 Data URI
 * @param {File} file
 * @returns {Promise<string>}
 */
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads an image file or base64 data URI to ImageKit via backend upload endpoint
 * @param {File|string} fileOrBase64 - File object or base64 string
 * @param {string} folder - 'institutions', 'avatars', 'students', etc.
 * @param {string} [fileName] - Optional target filename
 * @returns {Promise<{ url: string, thumbnailUrl: string, fileId: string }>}
 */
export const uploadToImageKit = async (fileOrBase64, folder = 'general', fileName = null) => {
  let base64Data = fileOrBase64;
  let targetName = fileName;

  if (typeof window !== 'undefined' && fileOrBase64 instanceof File) {
    if (!targetName) targetName = fileOrBase64.name;
    const ext = fileOrBase64.name?.split('.').pop() || (fileOrBase64.type?.split('/')[1] || 'jpg');
    if (!targetName) {
      targetName = fileOrBase64.name;
    } else if (!targetName.includes('.')) {
      targetName = `${targetName}.${ext}`;
    }
    base64Data = await convertFileToBase64(fileOrBase64);
  } else if (targetName && !targetName.includes('.')) {
    targetName = `${targetName}.jpg`;
  }

  const uploadData = response.data?.data || response.data;
  const directUrl = typeof uploadData === 'string' ? uploadData : (uploadData?.url || uploadData?.secure_url || '');
  const result = new String(directUrl);
  result.url = directUrl;
  result.thumbnailUrl = uploadData?.thumbnailUrl || directUrl;
  result.fileId = uploadData?.fileId || '';
  return result;
};

export default {
  convertFileToBase64,
  uploadToImageKit
};

