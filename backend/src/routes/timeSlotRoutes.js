/**
 * TimeSlot Routes
 * Manage doctor availability and time slots
 */

const express = require('express');
const {
  createTimeSlots,
  getAvailableSlots,
  getAllSlotsForDoctor,
  getSlotById,
  updateTimeSlot,
  cancelTimeSlot,
  deleteTimeSlot,
  bulkDeleteSlots,
  getSlotStats,
} = require('../controllers/timeSlotController');
const { protect, protectDoctor, protectAdmin } = require('../middleware/auth');
const { validateTimeSlotCreation } = require('../middleware/validators');

const router = express.Router();

// DOCTOR ROUTES - Create and manage own slots
router.post('/', protect, protectDoctor, validateTimeSlotCreation, createTimeSlots);
router.post('/bulk-delete', protect, protectDoctor, bulkDeleteSlots);
router.delete('/:id', protect, protectDoctor, deleteTimeSlot);
router.put('/:id', protect, protectDoctor, updateTimeSlot);
router.post('/:id/cancel', protect, protectDoctor, cancelTimeSlot);
router.get('/:doctorId/stats', getSlotStats);
router.get('/:doctorId/all', protect, protectDoctor, getAllSlotsForDoctor);

// PUBLIC ROUTES - View available slots
router.get('/:doctorId', getAvailableSlots);
router.get('/:id', getSlotById);

module.exports = router;
