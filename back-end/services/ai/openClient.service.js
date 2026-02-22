//back-end/services/ai/openaiClient.service.js
const OpenAI = require('openai');

/**
 * createOpenAIClient()
 * - יוצר מופע OpenAI Client אחד לפי API Key מה-ENV.
 * - אנחנו שמים את זה בשכבת services כדי שה-controller לא "יידע" על צד ג'.
 */
const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error('OPENAI_API_KEY is missing in environment variables');

  return new OpenAI({ apiKey });
}

/**
 * callDesignConsultationAI({ messages, language, safetyIdentifier })
 * - מקבל מערך הודעות (system/user/assistant) ומחזיר טקסט תשובה.
 * - משתמש ב-Responses API (ה-API הראשי כיום בספריית Node הרשמית).
 */
const callDesignConsultationAI = async({ messages, language, safetyIdentifier }) => {
  const client = createOpenAIClient();

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 20000);

  // "instruction" = מסר מערכת. "input" = ההודעות.
  // Responses API: מחזיר output שהוא מערך פריטים; אנחנו מחלצים את הטקסט.
  // (אם בעתיד תרצה streaming – נרחיב פה.)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.responses.create(
      {
        model,
        // שפה לפי העדפת משתמש (שמרנו לך ב-spec)
        instructions:
          language === 'he'
            ? 'אתה מנטור לעיצוב מוצר. תן משוב פרקטי וברור.'
            : 'You are a product design mentor. Give practical, clear feedback.',
        input: messages,
        // safety_identifier מומלץ לשימוש בטיחותי (לא PII; אפשר hash של userId).
        safety_identifier: safetyIdentifier,
      },
      { signal: controller.signal }
    );

    // חילוץ טקסט מה-output של Responses API
    const text = (response.output || [])
      .flatMap((item) => item.content || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('\n')
      .trim();

    if (!text) throw new Error('AI returned empty response');

    return {
      text,
      model,
      usage: response.usage || null,
    };
  } catch (e) {
    // מיפוי שגיאות לתשובות “נחמדות” ללקוח
    const err = new Error(e?.name === 'AbortError' ? 'AI request timed out' : 'AI request failed');
    err.statusCode = e?.name === 'AbortError' ? 504 : 502;
    err.details = { original: e?.message || String(e) };
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  callDesignConsultationAI,
};
