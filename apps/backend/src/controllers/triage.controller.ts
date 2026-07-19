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

  try {
    const aiResponse = await axios.post<{
      sessionId: string;
      urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      response: string;
      recommendedAction: string;
    }>(
      `${config.aiServiceUrl}/triage/chat`,
      { patientId, symptoms, additionalNotes, conversationHistory },
      { timeout: 30000 }
    );

    const { sessionId, urgencyLevel, response: aiText, recommendedAction } = aiResponse.data;

    // Log session to DB
    await query(
      `INSERT INTO triage_sessions (session_id, patient_id, symptoms, urgency_level, ai_response, recommended_action, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId || uuidv4(), patientId, JSON.stringify(symptoms), urgencyLevel, aiText, recommendedAction]
    );

    res.json({
      success: true,
      message: 'Triage response generated',
      data: { sessionId, urgencyLevel, response: aiText, recommendedAction, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('Triage AI service error:', error.message);
      throw new AppError('AI triage service is currently unavailable', 503);
    }
    throw error;
  }
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
