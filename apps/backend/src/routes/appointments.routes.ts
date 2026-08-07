import { Router } from 'express';
import * as appointmentsController from '../controllers/appointments.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// PUBLIC/AUTH endpoints (accessible by both PATIENT and DOCTOR, but needs authentication typically, except public listing might just need auth token if platform requires login)
router.get('/doctors', authenticate, appointmentsController.getDoctors);
router.get('/doctors/:doctorId', authenticate, appointmentsController.getDoctorProfile);
router.get('/doctors/:doctorId/slots', authenticate, appointmentsController.getAvailableSlots);

// SHARED AUTH endpoints
router.get('/my', authenticate, appointmentsController.getMyAppointments);
router.patch('/:appointmentId/status', authenticate, appointmentsController.updateAppointmentStatus);

// PATIENT endpoints
router.post('/', authenticate, authorize('PATIENT'), appointmentsController.bookAppointment);

// DOCTOR endpoints
router.post('/doctor-entry', authenticate, authorize('DOCTOR'), appointmentsController.createDoctorAppointment);
router.get('/my/availability', authenticate, authorize('DOCTOR'), appointmentsController.getDoctorAvailability);
router.put('/my/availability', authenticate, authorize('DOCTOR'), appointmentsController.upsertDoctorAvailability);
router.delete('/my/availability/:slotId', authenticate, authorize('DOCTOR'), appointmentsController.deleteDoctorAvailabilitySlot);

export default router;
