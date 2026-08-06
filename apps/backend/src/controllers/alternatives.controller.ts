import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { AlternativesService } from '../services/alternatives.service';

// ─── GET /api/drugs/:drugId/alternatives ──────────────────────────────────────
export const getAlternatives = async (req: AuthRequest, res: Response): Promise<void> => {
  const drugId = req.params.drugId as string;
  const budget = req.query.budget as string | undefined;
  const dosageForm = req.query.dosageForm as string | undefined;
  const strength = req.query.strength as string | undefined;
  const limit = req.query.limit as string | undefined;

  try {
    const result = await AlternativesService.getAlternatives(drugId, {
      budget: budget ? parseFloat(budget) : undefined,
      dosageForm: dosageForm || undefined,
      strength: strength || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({
      success: true,
      message: `Found ${result.alternatives.length} alternatives`,
      data: {
        sourceDrug: result.sourceDrug,
        alternatives: result.alternatives,
        totalAlternatives: result.alternatives.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Drug not found') {
      throw new AppError('Drug not found', 404);
    }
    throw new AppError(message, 500);
  }
};

// ─── GET /api/drugs/compare?ids=uuid1,uuid2 ──────────────────────────────────
export const compareDrugs = async (req: AuthRequest, res: Response): Promise<void> => {
  const idsParam = req.query.ids as string;

  if (!idsParam) {
    throw new AppError('Query parameter "ids" is required (comma-separated drug IDs)', 400);
  }

  const drugIds = idsParam.split(',').map((id) => id.trim()).filter(Boolean);

  if (drugIds.length < 2) {
    throw new AppError('At least 2 drug IDs are required for comparison', 400);
  }
  if (drugIds.length > 5) {
    throw new AppError('Maximum 5 drugs can be compared at once', 400);
  }

  try {
    const comparison = await AlternativesService.compareDrugs(drugIds);

    res.json({
      success: true,
      message: `Comparing ${comparison.length} drugs`,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'No drugs found for the provided IDs') {
      throw new AppError(message, 404);
    }
    throw new AppError(message, 500);
  }
};
