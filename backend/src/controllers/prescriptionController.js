const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const fs = require('fs');
const path = require('path');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============ CREATE PRESCRIPTION ============
// Doctor creates a new prescription after appointment consultation
exports.createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, medicines, diagnosis, notes, followUpDate, testRecommendations } = req.body;
  const doctorId = req.user._id;

  // Validate inputs
  if (!appointmentId) {
    return sendError(res, 400, 'Appointment ID is required');
  }
  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return sendError(res, 400, 'At least one medicine is required');
  }
  if (!diagnosis || diagnosis.trim() === '') {
    return sendError(res, 400, 'Diagnosis is required');
  }

  // Verify appointment exists and belongs to this doctor
  const appointment = await Appointment.findById(appointmentId).populate('doctorId patientId');
  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }
  if (appointment.doctorId._id.toString() !== doctorId.toString()) {
    return sendError(res, 403, 'Not authorized to create prescription for this appointment');
  }
  if (appointment.status !== 'Confirmed' && appointment.status !== 'Completed') {
    return sendError(res, 400, 'Prescription can only be created for confirmed or completed appointments');
  }

  // Check if prescription already exists for this appointment
  const existingPrescription = await Prescription.findOne({ appointmentId });
  if (existingPrescription) {
    return sendError(res, 400, 'Prescription already exists for this appointment');
  }

  // Validate medicines array
  const validatedMedicines = medicines.map((med) => {
    if (!med.name || !med.dosage || !med.frequency || !med.duration) {
      throw new Error('Each medicine must have name, dosage, frequency, and duration');
    }
    return {
      name: med.name.trim(),
      dosage: med.dosage.trim(), // e.g., "500mg"
      frequency: med.frequency.trim(), // e.g., "Twice daily"
      duration: med.duration.trim(), // e.g., "5 days"
      instructions: med.instructions ? med.instructions.trim() : ''
    };
  });

  // Create prescription
  const prescription = new Prescription({
    appointmentId,
    patientId: appointment.patientId._id,
    doctorId,
    diagnosis: diagnosis.trim(),
    medicines: validatedMedicines,
    notes: notes ? notes.trim() : '',
    testRecommendations: testRecommendations ? testRecommendations.map(t => t.trim()) : [],
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    status: 'Active',
    createdAt: new Date()
  });

  await prescription.save();

  // Update appointment to mark prescription created
  appointment.hasPrescription = true;
  await appointment.save();

  return sendSuccess(res, 201, 'Prescription created successfully', {
    prescriptionId: prescription._id,
    appointmentId,
    doctorName: appointment.doctorId.firstName + ' ' + appointment.doctorId.lastName,
    patientName: appointment.patientId.firstName + ' ' + appointment.patientId.lastName,
    diagnosis: prescription.diagnosis,
    medicinesCount: prescription.medicines.length,
    createdAt: prescription.createdAt
  });
});

// ============ GET PRESCRIPTION ============
// Patient or Doctor views a specific prescription
exports.getPrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId)
    .populate('appointmentId')
    .populate({
      path: 'patientId',
      select: 'firstName lastName email phone'
    })
    .populate({
      path: 'doctorId',
      select: 'firstName lastName specialization'
    });

  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization (patient or doctor can view their prescription)
  const isPatient = prescription.patientId._id.toString() === userId.toString();
  const isDoctor = prescription.doctorId._id.toString() === userId.toString();

  if (!isPatient && !isDoctor) {
    return sendError(res, 403, 'Not authorized to view this prescription');
  }

  return sendSuccess(res, 200, 'Prescription retrieved successfully', {
    prescriptionId: prescription._id,
    appointmentId: prescription.appointmentId._id,
    appointmentDate: prescription.appointmentId.date,
    patientName: prescription.patientId.firstName + ' ' + prescription.patientId.lastName,
    patientEmail: prescription.patientId.email,
    doctorName: prescription.doctorId.firstName + ' ' + prescription.doctorId.lastName,
    specialization: prescription.doctorId.specialization,
    diagnosis: prescription.diagnosis,
    medicines: prescription.medicines,
    notes: prescription.notes,
    testRecommendations: prescription.testRecommendations,
    followUpDate: prescription.followUpDate,
    attachments: prescription.attachments.map(att => ({
      attachmentId: att._id,
      fileName: att.fileName,
      fileType: att.fileType,
      uploadedAt: att.uploadedAt,
      downloadUrl: `/api/prescriptions/${prescription._id}/attachment/${att._id}`
    })),
    status: prescription.status,
    createdAt: prescription.createdAt,
    expiresAt: prescription.expiresAt
  });
});

// ============ GET PRESCRIPTIONS BY PATIENT ============
// Patient views all their prescriptions
exports.getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { status, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

  // Build query
  const query = { patientId };
  if (status) {
    query.status = status; // Active, Expired, Completed
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const prescriptions = await Prescription.find(query)
    .populate({
      path: 'appointmentId',
      select: 'date'
    })
    .populate({
      path: 'doctorId',
      select: 'firstName lastName specialization'
    })
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Prescription.countDocuments(query);

  // Format response
  const formattedPrescriptions = prescriptions.map(p => ({
    prescriptionId: p._id,
    appointmentDate: p.appointmentId.date,
    doctorName: p.doctorId.firstName + ' ' + p.doctorId.lastName,
    specialization: p.doctorId.specialization,
    diagnosis: p.diagnosis,
    medicinesCount: p.medicines.length,
    hasAttachments: p.attachments.length > 0,
    status: p.status,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt
  }));

  return sendSuccess(res, 200, 'Patient prescriptions retrieved', {
    prescriptions: formattedPrescriptions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// ============ GET PRESCRIPTIONS BY DOCTOR ============
// Doctor views all prescriptions they created
exports.getPrescriptionsByDoctor = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { status, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

  // Build query
  const query = { doctorId };
  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const prescriptions = await Prescription.find(query)
    .populate({
      path: 'appointmentId',
      select: 'date'
    })
    .populate({
      path: 'patientId',
      select: 'firstName lastName email'
    })
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Prescription.countDocuments(query);

  // Format response
  const formattedPrescriptions = prescriptions.map(p => ({
    prescriptionId: p._id,
    appointmentDate: p.appointmentId.date,
    patientName: p.patientId.firstName + ' ' + p.patientId.lastName,
    patientEmail: p.patientId.email,
    diagnosis: p.diagnosis,
    medicinesCount: p.medicines.length,
    hasAttachments: p.attachments.length > 0,
    status: p.status,
    createdAt: p.createdAt
  }));

  return sendSuccess(res, 200, 'Doctor prescriptions retrieved', {
    prescriptions: formattedPrescriptions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// ============ UPDATE PRESCRIPTION ============
// Doctor updates prescription details
exports.updatePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const { medicines, diagnosis, notes, testRecommendations, followUpDate } = req.body;
  const doctorId = req.user._id;

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization (only the doctor who created it can update)
  if (prescription.doctorId.toString() !== doctorId.toString()) {
    return sendError(res, 403, 'Not authorized to update this prescription');
  }

  // Prevent update if prescription is expired or completed
  if (prescription.status === 'Expired' || prescription.status === 'Completed') {
    return sendError(res, 400, `Cannot update ${prescription.status.toLowerCase()} prescription`);
  }

  // Update fields if provided
  if (medicines && Array.isArray(medicines) && medicines.length > 0) {
    prescription.medicines = medicines.map((med) => ({
      name: med.name.trim(),
      dosage: med.dosage.trim(),
      frequency: med.frequency.trim(),
      duration: med.duration.trim(),
      instructions: med.instructions ? med.instructions.trim() : ''
    }));
  }

  if (diagnosis) {
    prescription.diagnosis = diagnosis.trim();
  }

  if (notes !== undefined) {
    prescription.notes = notes ? notes.trim() : '';
  }

  if (testRecommendations !== undefined) {
    prescription.testRecommendations = Array.isArray(testRecommendations)
      ? testRecommendations.map(t => t.trim())
      : [];
  }

  if (followUpDate) {
    prescription.followUpDate = new Date(followUpDate);
  }

  prescription.updatedAt = new Date();
  await prescription.save();

  return sendSuccess(res, 200, 'Prescription updated successfully', {
    prescriptionId: prescription._id,
    diagnosis: prescription.diagnosis,
    medicinesCount: prescription.medicines.length,
    updatedAt: prescription.updatedAt
  });
});

// ============ UPDATE PRESCRIPTION STATUS ============
// Doctor marks prescription as Active, Expired, or Completed
exports.updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const { status } = req.body;
  const doctorId = req.user._id;

  // Validate status
  const validStatuses = ['Active', 'Expired', 'Completed'];
  if (!validStatuses.includes(status)) {
    return sendError(res, 400, `Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization
  if (prescription.doctorId.toString() !== doctorId.toString()) {
    return sendError(res, 403, 'Not authorized to update this prescription');
  }

  // Update status
  prescription.status = status;
  if (status === 'Expired') {
    prescription.expiresAt = new Date();
  }
  prescription.updatedAt = new Date();
  await prescription.save();

  return sendSuccess(res, 200, 'Prescription status updated', {
    prescriptionId: prescription._id,
    status: prescription.status,
    updatedAt: prescription.updatedAt
  });
});

// ============ UPLOAD PRESCRIPTION ATTACHMENT ============
// Upload PDF/image file to prescription
exports.uploadPrescriptionAttachment = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const userId = req.user._id;

  if (!req.file) {
    return sendError(res, 400, 'No file uploaded');
  }

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization (patient or doctor can upload)
  const isPatient = prescription.patientId.toString() === userId.toString();
  const isDoctor = prescription.doctorId.toString() === userId.toString();

  if (!isPatient && !isDoctor) {
    return sendError(res, 403, 'Not authorized to upload to this prescription');
  }

  // Add attachment metadata
  const attachment = {
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: req.file.path,
    uploadedBy: userId,
    uploadedAt: new Date()
  };

  prescription.attachments.push(attachment);
  await prescription.save();

  return sendSuccess(res, 201, 'File attached successfully', {
    prescriptionId: prescription._id,
    attachmentId: prescription.attachments[prescription.attachments.length - 1]._id,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    uploadedAt: attachment.uploadedAt
  });
});

// ============ DELETE PRESCRIPTION ATTACHMENT ============
// Remove attached file from prescription
exports.deletePrescriptionAttachment = asyncHandler(async (req, res) => {
  const { prescriptionId, attachmentId } = req.params;
  const userId = req.user._id;

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization (patient or doctor can delete their uploads)
  const isPatient = prescription.patientId.toString() === userId.toString();
  const isDoctor = prescription.doctorId.toString() === userId.toString();

  if (!isPatient && !isDoctor) {
    return sendError(res, 403, 'Not authorized to delete from this prescription');
  }

  // Find attachment
  const attachmentIndex = prescription.attachments.findIndex(
    att => att._id.toString() === attachmentId
  );

  if (attachmentIndex === -1) {
    return sendError(res, 404, 'Attachment not found');
  }

  const attachment = prescription.attachments[attachmentIndex];

  // Delete file from disk
  if (fs.existsSync(attachment.filePath)) {
    fs.unlinkSync(attachment.filePath);
  }

  // Remove from array
  prescription.attachments.splice(attachmentIndex, 1);
  await prescription.save();

  return sendSuccess(res, 200, 'Attachment deleted successfully', {
    prescriptionId,
    deletedAttachmentId: attachmentId
  });
});

// ============ DOWNLOAD PRESCRIPTION ATTACHMENT ============
// Stream file download
exports.downloadPrescriptionAttachment = asyncHandler(async (req, res) => {
  const { prescriptionId, attachmentId } = req.params;
  const userId = req.user._id;

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization
  const isPatient = prescription.patientId.toString() === userId.toString();
  const isDoctor = prescription.doctorId.toString() === userId.toString();

  if (!isPatient && !isDoctor) {
    return sendError(res, 403, 'Not authorized to download from this prescription');
  }

  // Find attachment
  const attachment = prescription.attachments.find(
    att => att._id.toString() === attachmentId
  );

  if (!attachment) {
    return sendError(res, 404, 'Attachment not found');
  }

  // Check file exists
  if (!fs.existsSync(attachment.filePath)) {
    return sendError(res, 404, 'File not found on server');
  }

  // Send file
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
  res.setHeader('Content-Type', attachment.fileType);
  res.setHeader('Content-Length', attachment.fileSize);

  const fileStream = fs.createReadStream(attachment.filePath);
  fileStream.on('error', () => {
    return sendError(res, 500, 'Error downloading file');
  });

  fileStream.pipe(res);
});

// ============ DELETE PRESCRIPTION ============
// Doctor permanently deletes a prescription
exports.deletePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const doctorId = req.user._id;

  // Find prescription
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) {
    return sendError(res, 404, 'Prescription not found');
  }

  // Verify authorization (only doctor who created it)
  if (prescription.doctorId.toString() !== doctorId.toString()) {
    return sendError(res, 403, 'Not authorized to delete this prescription');
  }

  // Delete all attached files
  for (const attachment of prescription.attachments) {
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }
  }

  // Delete prescription
  await Prescription.findByIdAndDelete(prescriptionId);

  // Update appointment
  const appointment = await Appointment.findByIdAndUpdate(
    prescription.appointmentId,
    { hasPrescription: false }
  );

  return sendSuccess(res, 200, 'Prescription deleted successfully', {
    prescriptionId: prescription._id
  });
});

// ============ GET PRESCRIPTION STATISTICS ============
// Doctor views prescription statistics
exports.getPrescriptionStats = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const stats = await Prescription.aggregate([
    { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        activePrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        expiredPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
        },
        completedPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        prescriptionsWithAttachments: {
          $sum: { $cond: [{ $gt: [{ $size: '$attachments' }, 0] }, 1, 0] }
        },
        totalAttachments: {
          $sum: { $size: '$attachments' }
        },
        avgMedicinesPerPrescription: {
          $avg: { $size: '$medicines' }
        }
      }
    }
  ]);

  const data = stats[0] || {
    totalPrescriptions: 0,
    activePrescriptions: 0,
    expiredPrescriptions: 0,
    completedPrescriptions: 0,
    prescriptionsWithAttachments: 0,
    totalAttachments: 0,
    avgMedicinesPerPrescription: 0
  };

  return sendSuccess(res, 200, 'Prescription statistics retrieved', data);
});
