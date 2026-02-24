const express = require('express');
const { protect, protectDoctor, protectPatient } = require('../middleware/auth');
const { uploadPrescriptionFile } = require('../middleware/multer');
const {
  createPrescription,
  getPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  updatePrescription,
  updatePrescriptionStatus,
  uploadPrescriptionAttachment,
  deletePrescriptionAttachment,
  downloadPrescriptionAttachment,
  deletePrescription,
  getPrescriptionStats
} = require('../controllers/prescriptionController');

const router = express.Router();

// ============ PATIENT ROUTES ============

// Get all prescriptions for logged-in patient
router.get('/my-prescriptions', protect, protectPatient, getPrescriptionsByPatient);

// Get specific prescription (patient or doctor)
router.get('/:prescriptionId', protect, getPrescription);

// Download attachment from prescription
router.get('/:prescriptionId/attachment/:attachmentId/download', protect, downloadPrescriptionAttachment);

// ============ DOCTOR ROUTES ============

// Create new prescription from appointment
router.post('/', protect, protectDoctor, createPrescription);

// Get all prescriptions created by doctor
router.get('/doctor/my-prescriptions', protect, protectDoctor, getPrescriptionsByDoctor);

// Get prescription statistics
router.get('/doctor/stats', protect, protectDoctor, getPrescriptionStats);

// Update prescription details
router.put('/:prescriptionId', protect, protectDoctor, updatePrescription);

// Update prescription status (Active, Expired, Completed)
router.patch('/:prescriptionId/status', protect, protectDoctor, updatePrescriptionStatus);

// Delete prescription
router.delete('/:prescriptionId', protect, protectDoctor, deletePrescription);

// ============ ATTACHMENT ROUTES ============

// Upload attachment to prescription
router.post('/:prescriptionId/attachments', protect, uploadPrescriptionFile, uploadPrescriptionAttachment);

// Delete attachment from prescription
router.delete('/:prescriptionId/attachments/:attachmentId', protect, deletePrescriptionAttachment);

module.exports = router;
