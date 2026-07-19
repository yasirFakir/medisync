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
  const { symptoms, additionalNotes, conversationHistory } = req.body;

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
      { patientId, symptoms, additionalNotes, conversationHistory },
      { timeout: 4000 }
    );

    sessionId = aiResponse.data.sessionId;
    urgencyLevel = aiResponse.data.urgencyLevel;
    aiText = aiResponse.data.response;
    recommendedAction = aiResponse.data.recommendedAction;
    console.log(`🤖 [AI SERVICE] Triage chat processed by external service on ${config.aiServiceUrl}`);
  } catch (error) {
    const symptomText = symptoms.join(', ');
    console.warn(`[UNIFIED BACKEND] ⚠️ External AI Triage Service not responding. Falling back to integrated AI triage handler.`);
    logger.warn('AI service down, falling back to local stub', error instanceof Error ? error.message : '');

    sessionId = uuidv4();
    urgencyLevel = 'LOW';
    aiText = `[AI Unified Stub] You reported: ${symptomText}. Please consult a doctor for a proper diagnosis.`;
    recommendedAction = 'Schedule a clinic visit within 48 hours.';
  }

  // Validate that sessionId is a valid UUID, fallback to uuidv4() if not
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const finalSessionId = (sessionId && uuidRegex.test(sessionId)) ? sessionId : uuidv4();

  // Log session to DB
  await query(
    `INSERT INTO triage_sessions (session_id, patient_id, symptoms, urgency_level, ai_response, recommended_action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (session_id) DO NOTHING`,
    [finalSessionId, patientId, JSON.stringify(symptoms), urgencyLevel, aiText, recommendedAction]
  );

  res.json({
    success: true,
    message: 'Triage response generated',
    data: { sessionId: finalSessionId, urgencyLevel, response: aiText, recommendedAction, timestamp: new Date().toISOString() },
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
