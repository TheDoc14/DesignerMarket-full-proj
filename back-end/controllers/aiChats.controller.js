// controllers/aiChats.controller.js
const AiChat = require('../models/AiChat.model');
const AiMessage = require('../models/AiMessage.model');
const AiUsageLog = require('../models/AiUsageLog.model');

const { ok } = require('../utils/response.utils');
const { callDesignConsultationAI } = require('../services/ai/openClient.service');
const { buildFullProjectContext } = require('../services/ai/aiContextBuilder.service');
const { buildMeta } = require('../utils/meta.utils');
const { getPaging, toSort } = require('../utils/query.utils');

const Project = require('../models/Project.model');
const Review = require('../models/Review.model');

// ----------------------------------------------------
// Create Chat
// ----------------------------------------------------
const createChat = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { projectId, language, title } = req.body;

    // לוודא שהפרויקט שייך למשתמש (אצלכם זה createdBy)
    const project = await Project.findOne({ _id: projectId, createdBy: ownerId }).select('_id');
    if (!project) throw new Error('Project not found or not owned by user');

    const chat = await AiChat.create({
      ownerId,
      projectId,
      language: (language || 'en').toLowerCase(),
      title: title ? String(title).trim() : 'Design Consultation',
      deletedAt: null,
    });

    return ok(res, {
      message: 'AI chat created',
      data: {
        chatId: String(chat._id),
        projectId: String(chat.projectId),
        language: chat.language,
        title: chat.title,
        createdAt: chat.createdAt,
      },
    });
  } catch (e) {
    return next(e);
  }
};

// ----------------------------------------------------
// existing helper (השאר כמו שיש לך / אם כבר קיים)
// ----------------------------------------------------
function toOpenAIMessages(historyMessages, systemText, userText, imageUrls) {
  const input = [];
  input.push({ role: 'system', content: systemText });

  for (const m of historyMessages) {
    input.push({ role: m.role, content: m.content });
  }

  if (imageUrls?.length) {
    input.push({
      role: 'user',
      content: [
        { type: 'input_text', text: userText },
        ...imageUrls.map((url) => ({ type: 'input_image', image_url: url })),
      ],
    });
  } else {
    input.push({ role: 'user', content: userText });
  }

  return input;
}

// ----------------------------------------------------
// addMessageWithAI (השאר שלך, אבל שים לב לשני שינויים)
// 1) project owner = createdBy
// 2) reviews filter = projectId
// ----------------------------------------------------
const addMessageWithAI = async (req, res, next) => {
  const start = Date.now();

  try {
    const ownerId = req.user.id;
    const { chatId } = req.params;
    const { content } = req.body;

    const chat = await AiChat.findOne({ _id: chatId, ownerId, deletedAt: null });
    if (!chat) throw new Error('Chat not found');

    // ✅ אצלכם זה createdBy (לא owner)
    const project = await Project.findOne({ _id: chat.projectId, createdBy: ownerId }).lean();
    if (!project) throw new Error('Project not found or not owned by user');

    // ✅ אצלכם Review מצביע על projectId
    const reviews = await Review.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();

    // חשוב: נשלח baseUrl כדי לבנות image URLs תקינים
    const baseUrl = req.publicBaseUrl || process.env.PUBLIC_BASE_URL || '';
    const { textContext, imageUrls } = await buildFullProjectContext({ project, reviews, baseUrl });

    const userMsg = await AiMessage.create({
      chatId,
      ownerId,
      role: 'user',
      content: content.trim(),
    });

    const history = await AiMessage.find({ chatId, ownerId })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const language = chat.language || 'en';
    const systemText =
      language === 'he'
        ? `אתה מנטור לעיצוב מוצר. השתמש בכל חומרי הפרויקט להכוונה. החזר משוב פרקטי.`
        : `You are a product design mentor. Use all project materials to guide the designer. Return practical feedback.`;

    const userText =
      language === 'he'
        ? `הקשר פרויקט (כולל קבצים/ביקורות):\n${textContext}\n\nשאלת המשתמש:\n${content.trim()}`
        : `Project context (including files/reviews):\n${textContext}\n\nUser question:\n${content.trim()}`;

    const input = toOpenAIMessages(history, systemText, userText, imageUrls);

    const safetyIdentifier = String(ownerId);
    const aiResult = await callDesignConsultationAI({
      messages: input,
      language,
      safetyIdentifier,
    });

    const assistantMsg = await AiMessage.create({
      chatId,
      ownerId,
      role: 'assistant',
      content: aiResult.text,
      model: aiResult.model,
      tokensIn: aiResult.usage?.input_tokens ?? null,
      tokensOut: aiResult.usage?.output_tokens ?? null,
      latencyMs: Date.now() - start,
    });

    await AiUsageLog.create({
      userId: ownerId,
      chatId,
      projectId: project._id,
      model: aiResult.model,
      latencyMs: Date.now() - start,
      promptChars: userText.length,
      responseChars: aiResult.text.length,
      tokensIn: aiResult.usage?.input_tokens ?? null,
      tokensOut: aiResult.usage?.output_tokens ?? null,
      outcome: 'success',
    });

    return ok(res, {
      message: 'AI response generated',
      data: {
        chatId,
        userMessageId: userMsg._id,
        assistantMessageId: assistantMsg._id,
        answer: aiResult.text,
        usage: aiResult.usage,
      },
    });
  } catch (e) {
    try {
      const ownerId = req.user?.id;
      if (ownerId) {
        await AiUsageLog.create({
          userId: ownerId,
          outcome: 'fail',
          errorCode: 'AI_CALL_FAILED',
        });
      }
    } catch (_) {}

    return next(e);
  }
};

// ----------------------------------------------------
// List My Chats
// GET /api/ai-chats?projectId=&page=&limit=&sortBy=&order=
// ----------------------------------------------------
const listMyChats = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { page, limit, skip } = getPaging(req.query, 20);

    const filter = { ownerId, deletedAt: null };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const sort = toSort(
      req.query.sortBy,
      req.query.order,
      ['createdAt', 'updatedAt', 'title'],
      'createdAt'
    );

    const [items, total] = await Promise.all([
      AiChat.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AiChat.countDocuments(filter),
    ]);

    return ok(res, {
      message: 'AI chats fetched',
      data: items,
      meta: buildMeta(total, page, limit),
    });
  } catch (e) {
    return next(e);
  }
};

// ----------------------------------------------------
// List Messages in Chat
// GET /api/ai-chats/:chatId/messages?page=&limit=&sortBy=&order=
// ----------------------------------------------------
const listChatMessages = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { chatId } = req.params;
    const { page, limit, skip } = getPaging(req.query, 30);

    // לוודא שהצ'אט שייך למשתמש ולא נמחק
    const chat = await AiChat.findOne({ _id: chatId, ownerId, deletedAt: null }).select('_id');
    if (!chat) throw new Error('Chat not found');

    const sort = toSort(req.query.sortBy, req.query.order, ['createdAt'], 'createdAt');

    const filter = { chatId, ownerId };

    const [items, total] = await Promise.all([
      AiMessage.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AiMessage.countDocuments(filter),
    ]);

    return ok(res, {
      message: 'AI chat messages fetched',
      data: items,
      meta: buildMeta(total, page, limit),
    });
  } catch (e) {
    return next(e);
  }
};

// ----------------------------------------------------
// Soft Delete Chat
// DELETE /api/ai-chats/:chatId
// ----------------------------------------------------
const softDeleteChat = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { chatId } = req.params;

    const chat = await AiChat.findOne({ _id: chatId, ownerId, deletedAt: null });
    if (!chat) throw new Error('Chat not found');

    chat.deletedAt = new Date();
    await chat.save();

    return ok(res, {
      message: 'AI chat deleted',
      data: { chatId: String(chat._id), deletedAt: chat.deletedAt },
    });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  createChat,
  addMessageWithAI,
  listMyChats,
  listChatMessages,
  softDeleteChat,
};
