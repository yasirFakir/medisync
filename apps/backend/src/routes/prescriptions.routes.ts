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

// POST /api/prescriptions/digitize — OCR upload [All authenticated roles]
router.post(
  '/digitize',
  authenticate,
  upload.single('file'),
  prescriptionsController.digitizePrescription
);

// POST /api/prescriptions/validate — Validate extracted medicines [All authenticated roles]
router.post('/validate', authenticate, prescriptionsController.validatePrescription);


// POST /api/prescriptions — Manual prescription creation by doctor/patient [All authenticated roles]
router.post('/', authenticate, prescriptionsController.createPrescription);

// GET /api/prescriptions — list patient's prescriptions [All authenticated roles]
router.get('/', authenticate, prescriptionsController.listPrescriptions);


// GET /api/prescriptions/:id
router.get('/:id', authenticate, prescriptionsController.getPrescriptionById);

// PATCH /api/prescriptions/:id — Update prescription details (patient_name, doctor_name, prescription_date, medicines)
router.patch('/:id', authenticate, prescriptionsController.updatePrescription);

// DELETE /api/prescriptions/:id
router.delete('/:id', authenticate, prescriptionsController.deletePrescription);

export default router;

