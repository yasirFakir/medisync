import { Router } from 'express';
import * as prescriptionsController from '../controllers/prescriptions.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
});

// POST /api/prescriptions/digitize  — OCR upload [PATIENT]
router.post(
  '/digitize',
  authenticate,
  authorize('PATIENT'),
  upload.single('file'),
  prescriptionsController.digitizePrescription
);

// GET /api/prescriptions — list patient's prescriptions [PATIENT, DOCTOR]
router.get('/', authenticate, authorize('PATIENT', 'DOCTOR'), prescriptionsController.listPrescriptions);

// GET /api/prescriptions/:id
router.get('/:id', authenticate, prescriptionsController.getPrescriptionById);

export default router;
