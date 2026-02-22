//back-end/services/ai/aiContextBuilder.service.js
const { extractTextFromLocalFile } = require('./fileTextExtractor.service');

const MAX_ATTACHMENTS = 10;
const MAX_IMAGES = 3;
const MAX_CONTEXT_CHARS = 30000;

const clamp = (text) => {
  const t = (text || '').trim();
  return t.length > MAX_CONTEXT_CHARS ? t.slice(0, MAX_CONTEXT_CHARS) + '…' : t;
}

const buildProjectTextContext= (project, reviews, fileTexts) => {
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
}

const extractProjectImages= (project, baseUrl) => {
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
}

const extractProjectFiles= (project) => {
  const files = [];

  const arr = Array.isArray(project.files) ? project.files : [];
  for (const f of arr) {
    // נחלץ טקסט רק מקבצים “מסמכים” / “מצגות” וכו', לא מתמונות
    if (!f?.path || !f?.filename) continue;
    if (f.fileType === 'image' || f.fileType === 'video') continue;

    files.push({
      name: String(f.filename),
      localPath: String(f.path), // אצלכם זה נתיב פיזי שנשמר ע"י multer
    });
  }

  return files.slice(0, MAX_ATTACHMENTS);
}

const buildFullProjectContext= async({ project, reviews, baseUrl })=> {
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

  const textContext = buildProjectTextContext(project, reviews, fileTexts);
  return { textContext, imageUrls };
}

module.exports = { buildFullProjectContext };
