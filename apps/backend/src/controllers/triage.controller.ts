import { Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';
import { logger } from '../config/logger';

// ─── POST /api/triage/chat  [PATIENT] ────────────────────────────────────────
export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const { sessionId: reqSessionId, symptoms, additionalNotes, conversationHistory } = req.body;

  let sessionId: string = reqSessionId || uuidv4();
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let aiText: string = '';
  let recommendedAction: string = 'Consult a healthcare professional for a medical assessment.';
  let sessionTitle: string = (symptoms && symptoms.length > 0) ? `${symptoms.slice(0, 2).join(' & ')} Consultation` : 'Health Consultation';

  try {
    const aiResponse = await axios.post<{
      sessionId: string;
      title?: string;
      urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      response: string;
      recommendedAction: string;
    }>(
      `${config.aiServiceUrl}/triage/chat`,
      { patientId, sessionId: reqSessionId, symptoms, additionalNotes, conversationHistory },
      { timeout: 12000 }
    );

    sessionId = aiResponse.data.sessionId || reqSessionId;
    urgencyLevel = aiResponse.data.urgencyLevel;
    aiText = aiResponse.data.response;
    recommendedAction = aiResponse.data.recommendedAction;
    if (aiResponse.data.title) {
      sessionTitle = aiResponse.data.title;
    }
    console.log(`[AI SERVICE] Triage chat processed by external service on ${config.aiServiceUrl}`);
  } catch (error) {
    const symptomText = symptoms.join(', ');
    logger.warn('AI microservice unreachable, falling back to direct LLM triage handler');

    // Attempt direct Groq / Grok LLM call as resilient fallback (NO GEMINI)
    const groqKey = process.env.GROQ_API_KEY;
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    let llmSuccess = false;

    if (grokKey || groqKey) {
      try {
        const sysPrompt = `You are MediSync Medical Intelligence Assistant. Provide safe, educational guidance and reassurance. Assess urgency (LOW, MEDIUM, HIGH, CRITICAL), explain precautions, and advise consulting a doctor. Never give a definitive diagnosis or prescribe medicines.`;
        const historyMsgs = Array.isArray(conversationHistory) && conversationHistory.length > 0
          ? conversationHistory.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
          : [];
        
        const endpoint = grokKey 
          ? 'https://api.x.ai/v1/chat/completions' 
          : 'https://api.groq.com/openai/v1/chat/completions';
        const apiKey = grokKey || groqKey;
        const model = grokKey ? 'grok-beta' : 'qwen/qwen3.8-27b';

        const [llmRes, titleRes] = await Promise.all([
          axios.post(
            endpoint,
            {
              model,
              messages: [
                { role: 'system', content: sysPrompt },
                ...historyMsgs,
                { role: 'user', content: `Symptoms: ${symptomText}. ${additionalNotes || ''}` }
              ],
              max_tokens: 800,
              temperature: 0.3
            },
            { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 10000 }
          ),
          axios.post(
            endpoint,
            {
              model,
              messages: [
                { role: 'user', content: `Generate a concise 2-4 word chat title for symptoms: ${symptomText}. Return ONLY the title words, no quotes or punctuation.` }
              ],
              max_tokens: 15,
              temperature: 0.2
            },
            { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 6000 }
          ).catch(() => ({ data: null }))
        ]);

        if (llmRes.data?.choices?.[0]?.message?.content) {
          aiText = llmRes.data.choices[0].message.content;
          const up = aiText.toUpperCase();
          urgencyLevel = up.includes('CRITICAL') ? 'CRITICAL' : up.includes('HIGH') ? 'HIGH' : up.includes('MEDIUM') ? 'MEDIUM' : 'LOW';
          recommendedAction = urgencyLevel === 'CRITICAL'
            ? 'Seek immediate emergency medical care.'
            : 'Consult a licensed physician or clinic for a physical assessment.';
          sessionId = reqSessionId || uuidv4();
          llmSuccess = true;

          const rawTitle = titleRes.data?.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
          if (rawTitle && rawTitle.length > 2) {
            sessionTitle = rawTitle;
          }
        }
      } catch (llmErr) {
        logger.warn('Direct LLM fallback failed', llmErr instanceof Error ? llmErr.message : '');
      }
    }

    if (!llmSuccess) {
      sessionId = reqSessionId || uuidv4();
      const lower = (symptomText + ' ' + (additionalNotes || '')).toLowerCase();
      if (lower.includes('chest pain') || lower.includes('shortness of breath') || lower.includes('bleeding')) {
        urgencyLevel = 'CRITICAL';
        aiText = `⚠️ **Urgent Medical Notice**: You reported severe symptoms (${symptomText}). These symptoms may require immediate emergency evaluation. Please proceed to the nearest emergency clinic or hospital.`;
        recommendedAction = 'Seek immediate emergency medical care.';
        sessionTitle = 'Emergency Medical Alert';
      } else {
        urgencyLevel = 'LOW';
        aiText = `Thank you for sharing your symptoms (${symptomText}). Ensure plenty of rest, maintain hydration, and monitor your symptoms. Please consult a qualified doctor for a proper evaluation.`;
        recommendedAction = 'Schedule a consultation with a healthcare professional.';
        sessionTitle = `${symptoms.slice(0, 2).join(' & ')} Consultation`;
      }
    }
  }

  // Validate that sessionId is a valid UUID, fallback to reqSessionId or uuidv4()
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const finalSessionId = (reqSessionId && uuidRegex.test(reqSessionId))
    ? reqSessionId
    : ((sessionId && uuidRegex.test(sessionId)) ? sessionId : uuidv4());

  // Format messages list to store in DB
  const historyRecords = Array.isArray(conversationHistory) && conversationHistory.length > 0 
    ? [...conversationHistory, { role: 'assistant', content: aiText, timestamp: new Date().toISOString() }]
    : [
        { role: 'user', content: `I am experiencing: ${symptoms.join(', ')}. ${additionalNotes || ''}`, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiText, timestamp: new Date().toISOString() }
      ];

  // Log session to DB (UPSERT session record with title & complete chat history)
  await query(
    `INSERT INTO triage_sessions (session_id, patient_id, title, symptoms, urgency_level, ai_response, recommended_action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (session_id) DO UPDATE SET
       title = COALESCE(triage_sessions.title, EXCLUDED.title),
       ai_response = EXCLUDED.ai_response,
       urgency_level = EXCLUDED.urgency_level,
       symptoms = EXCLUDED.symptoms,
       recommended_action = EXCLUDED.recommended_action`,
    [finalSessionId, patientId, sessionTitle, JSON.stringify(historyRecords), urgencyLevel, aiText, recommendedAction]
  );

  res.json({
    success: true,
    message: 'Triage response generated',
    data: { sessionId: finalSessionId, title: sessionTitle, urgencyLevel, response: aiText, recommendedAction, messages: historyRecords, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/triage/sessions  [PATIENT] ─────────────────────────────────────
export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;

  const sessions = await query(
    `SELECT session_id AS "sessionId", COALESCE(title, 'Health Consultation') AS "title", symptoms, urgency_level AS "urgencyLevel",
            ai_response AS "response", recommended_action AS "recommendedAction", created_at AS "timestamp"
     FROM triage_sessions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [patientId]
  );

  res.json({ success: true, message: 'Triage sessions retrieved', data: sessions, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/triage/sessions/:sessionId  [PATIENT] ──────────────────────
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const { sessionId } = req.params;

  await query(
    `DELETE FROM triage_sessions WHERE session_id = $1 AND patient_id = $2`,
    [sessionId, patientId]
  );

  res.json({ success: true, message: 'Triage session deleted successfully', timestamp: new Date().toISOString() });
};
