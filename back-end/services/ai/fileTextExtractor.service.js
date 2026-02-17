// back-end/services/ai/fileTextExtractor.service.js
const fs = require('fs/promises');
const path = require('path');
const mime = require('mime-types');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB טקסט/קובץ לקריאה (דמו-friendly)
const MAX_TEXT_CHARS = 12000; // כדי לא להציף את ה-LLM

function clampText(text) {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  return cleaned.length > MAX_TEXT_CHARS ? cleaned.slice(0, MAX_TEXT_CHARS) + '…' : cleaned;
}

async function readLimitedBuffer(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_BYTES) {
    // לא נכשיל, פשוט נחתוך כדי שהדמו לא ייפול
    const buf = await fs.readFile(filePath);
    return buf.subarray(0, MAX_FILE_BYTES);
  }
  return fs.readFile(filePath);
}

/**
 * extractTextFromLocalFile(filePath)
 * תומך: pdf, docx, txt/markdown
 */
async function extractTextFromLocalFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mime.lookup(ext) || '';

  // PDF
  if (ext === '.pdf' || contentType === 'application/pdf') {
    const buf = await readLimitedBuffer(filePath);
    const parsed = await pdfParse(buf);
    return clampText(parsed.text);
  }

  // DOCX
  if (
    ext === '.docx' ||
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const buf = await readLimitedBuffer(filePath);
    const result = await mammoth.extractRawText({ buffer: buf });
    return clampText(result.value);
  }

  // טקסט פשוט
  if (ext === '.txt' || ext === '.md' || contentType.startsWith('text/')) {
    const buf = await readLimitedBuffer(filePath);
    return clampText(buf.toString('utf8'));
  }

  // פורמטים אחרים (zip, psd, וכו') — נחזיר מטה-דאטה במקום טקסט
  return '';
}

module.exports = {
  extractTextFromLocalFile,
};
