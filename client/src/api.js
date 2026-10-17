const API_URL = (https://civivvix-sentinel-api.onrender.com || 'http://localhost:5000/api').replace(/\/$/, '');
let token = localStorage.getItem('civicfix_token') || '';
export function setToken(value) { token = value || ''; if (token) localStorage.setItem('civicfix_token', token); else localStorage.removeItem('civicfix_token'); }
export function getToken() { return token; }
export async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  } catch { throw new Error('Cannot reach the API. Check the server URL and try again.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}
export async function uploadImage(file) {
  if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Image upload failed.');
    return data.secure_url;
  }
  if (file.size > 2_500_000) throw new Error('Without Cloudinary, each image must be under 2.5 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read selected image.'));
    reader.readAsDataURL(file);
  });
}
