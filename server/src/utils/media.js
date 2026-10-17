import { v2 as cloudinary } from 'cloudinary';

export async function persistImage(value) {
  if (typeof value !== 'string' || !value.trim()) throw Object.assign(new Error('Invalid image.'), { status: 400 });
  if (/^https:\/\/res\.cloudinary\.com\//i.test(value)) return value;
  if (!value.startsWith('data:image/')) throw Object.assign(new Error('Images must be uploaded as image data or a Cloudinary URL.'), { status: 400 });
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, secure: true });
    const result = await cloudinary.uploader.upload(value, {
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      folder: 'civicfix-sentinel'
    });
    return result.secure_url;
  }
  if (value.length > 4_000_000) throw Object.assign(new Error('Fallback image is too large. Use an image under 3 MB or configure Cloudinary.'), { status: 413 });
  return value;
}

export async function persistImages(values = []) {
  if (!Array.isArray(values)) throw Object.assign(new Error('Photos must be a list.'), { status: 400 });
  if (values.length > 5) throw Object.assign(new Error('Upload up to five photos per action.'), { status: 400 });
  return Promise.all(values.map(persistImage));
}
