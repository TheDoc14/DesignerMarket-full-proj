// services/ai/aiContextBuilder.service.js
const fs = require('fs/promises');
const path = require('path');
const mime = require('mime-types');

const { extractTextFromLocalFile } = require('./fileTextExtractor.service');

const MAX_ATTACHMENTS = 10;
const MAX_IMAGES = 3;
const MAX_CONTEXT_CHARS = 30000;

// חדש: מגבלת גודל לתמונה ב-base64 (כדי לא להציף את ה-LLM)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

const clamp = (text) => {
  const t = (text || '').trim();
  return t.length > MAX_CONTEXT_CHARS ? t.slice(0, MAX_CONTEXT_CHARS) + '…' : t;
};

const buildProjectTextContext = (project, reviews, fileTexts) => {
  const lines = [];

  lines.push(`PROJECT TITLE: ${project.title || ''}`);
  lines.push(`DESCRIPTION: ${project.description || ''}`);

  if (project.tags?.length) lines.push(`TAGS: ${project.tags.join(', ')}`);
  if (project.category) lines.push(`CATEGORY: ${project.category}`);
  if (project.price != null) lines.push(`PRICE: ${project.price}`);

  if (reviews?.length) {
    lines.push(`REVIEWS (${reviews.length}):`);
    for (const r of reviews.slice(0, 10)) {
      lines.push(`- Rating: ${r.rating ?? ''} | ${r.comment || ''}`);
    }
  }

  if (fileTexts?.length) {
    lines.push(`ATTACHED FILES TEXT (${fileTexts.length}):`);
    fileTexts.forEach((ft, idx) => {
      lines.push(`FILE #${idx + 1} (${ft.name}):`);
      lines.push(ft.text || '(no text extracted)');
    });
  }

  return clamp(lines.join('\n'));
};

const extractProjectImages = (project, baseUrl) => {
  const urls = [];

  const files = Array.isArray(project.files) ? project.files : [];
  for (const f of files) {
    if (f?.fileType === 'image' && f?.filename) {
      if (baseUrl) {
        urls.push(
          `${baseUrl}/api/files/projects/projectImages/${encodeURIComponent(String(f.filename))}`
        );
      }
    }
  }

  return [...new Set(urls)].slice(0, MAX_IMAGES);
};

const extractProjectFiles = (project) => {
  const files = [];

  const arr = Array.isArray(project.files) ? project.files : [];
  for (const f of arr) {
    // נחלץ טקסט רק מקבצים “מסמכים” / “מצגות” וכו', לא מתמונות
    if (!f?.path || !f?.filename) continue;
    if (f.fileType === 'image' || f.fileType === 'video') continue;

    files.push({
      name: String(f.filename),
      localPath: String(f.path), // נתיב פיזי שנשמר ע"י multer
    });
  }

  return files.slice(0, MAX_ATTACHMENTS);
};

// ----------------------------------------------------
// Build images as data URLs (base64) from local uploads
// IMPORTANT: in DB, f.path may be a PUBLIC URL, not a filesystem path.
// لذلك we resolve fs path from filename.
// ----------------------------------------------------
const extractProjectImageDataUrls = async (project) => {
  const out = [];

  const files = Array.isArray(project.files) ? project.files : [];
  for (const f of files) {
    if (out.length >= MAX_IMAGES) break;

    if (f?.fileType !== 'image') continue;

    try {
      // Prefer real fs path if it exists AND looks like a local path
      let fsPath = '';

      const maybePath = String(f?.path || '').trim();
      const hasHttp = /^https?:\/\//i.test(maybePath);

      if (maybePath && !hasHttp) {
        fsPath = maybePath;
      } else if (f?.filename) {
        // Fallback: build path from filename (uploads/projects/projectImages)
        fsPath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          'projects',
          'projectImages',
          String(f.filename)
        );
      }

      if (!fsPath) continue;

      const stat = await fs.stat(fsPath);
      if (stat.size > MAX_IMAGE_BYTES) continue;

      const ext = path.extname(fsPath).toLowerCase();
      const contentType = mime.lookup(ext) || 'image/jpeg';

      const buf = await fs.readFile(fsPath);
      const b64 = buf.toString('base64');

      out.push(`data:${contentType};base64,${b64}`);
    } catch (_) {
      // best-effort: do not fail the whole context if one image fails
    }
  }

  return out;
};

const buildFullProjectContext = async ({ project, reviews, baseUrl }) => {
  const imageUrls = extractProjectImages(project, baseUrl);

  const files = extractProjectFiles(project);
  const fileTexts = [];

  for (const f of files) {
    try {
      const text = await extractTextFromLocalFile(f.localPath);
      fileTexts.push({ name: f.name, text });
    } catch {
      fileTexts.push({ name: f.name, text: '' });
    }
  }

  const imageDataUrls = await extractProjectImageDataUrls(project);

  const textContext = buildProjectTextContext(project, reviews, fileTexts);
  return { textContext, imageUrls, imageDataUrls };
};

module.exports = { buildFullProjectContext };
