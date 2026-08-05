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

  let sessionId: string;
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  let aiText: string;
  let recommendedAction: string;

  try {
    const aiResponse = await axios.post<{
      sessionId: string;
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
    console.log(`[AI SERVICE] Triage chat processed by external service on ${config.aiServiceUrl}`);
  } catch (error) {
    const symptomText = symptoms.join(', ');
    console.warn(`[UNIFIED BACKEND] External AI Triage Service not responding. Falling back to integrated AI triage handler.`);
    logger.warn('AI service down, falling back to local stub', error instanceof Error ? error.message : '');

    sessionId = reqSessionId || uuidv4();
    urgencyLevel = 'LOW';
    aiText = `[AI Unified Stub] You reported: ${symptomText}. Please consult a doctor for a proper diagnosis.`;
    recommendedAction = 'Schedule a clinic visit within 48 hours.';
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

  // Log session to DB (UPSERT session record with complete chat history)
  await query(
    `INSERT INTO triage_sessions (session_id, patient_id, symptoms, urgency_level, ai_response, recommended_action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (session_id) DO UPDATE SET
       ai_response = EXCLUDED.ai_response,
       urgency_level = EXCLUDED.urgency_level,
       symptoms = EXCLUDED.symptoms,
       recommended_action = EXCLUDED.recommended_action`,
    [finalSessionId, patientId, JSON.stringify(historyRecords), urgencyLevel, aiText, recommendedAction]
  );

  res.json({
    success: true,
    message: 'Triage response generated',
    data: { sessionId: finalSessionId, urgencyLevel, response: aiText, recommendedAction, messages: historyRecords, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/triage/sessions  [PATIENT] ─────────────────────────────────────
export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;

  const sessions = await query(
    `SELECT session_id AS "sessionId", symptoms, urgency_level AS "urgencyLevel",
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
