require('dotenv').config();
const mongoose = require('mongoose');
const TimeSlot = require('./src/models/TimeSlot');
const Doctor = require('./src/models/Doctor');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected. Seeding time slots for all doctors...');

  const doctors = await Doctor.find().select('_id firstName');
  console.log(`Found ${doctors.length} doctors`);

  // Build date list: tomorrow + next 14 non-Sunday days
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow
  while (dates.length < 14) {
    if (cursor.getDay() !== 0) { // skip Sundays
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  console.log('Dates to seed:', dates.map(d => d.toLocaleDateString('en-IN')));

  let created = 0;
  let skipped = 0;

  for (const doctor of doctors) {
    for (const slotDate of dates) {
      for (let h = 9; h < 17; h++) {
        for (const m of [0, 30]) {
          const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const endH = m === 30 ? h + 1 : h;
          const endM = m === 30 ? 0 : 30;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          const exists = await TimeSlot.findOne({ doctorId: doctor._id, date: slotDate, startTime });
          if (!exists) {
            const slot = new TimeSlot({
              doctorId: doctor._id,
              date: slotDate,
              startTime,
              endTime,
              isBooked: false,
              isCancelled: false,
            });
            await slot.save();
            created++;
          } else {
            skipped++;
          }
        }
      }
    }
    console.log(`  ${doctor.firstName}: done`);
  }

  console.log(`\nDone! Created: ${created}, Already existed (skipped): ${skipped}`);
  const total = await TimeSlot.countDocuments();
  console.log(`Total slots in DB: ${total}`);
  mongoose.disconnect();
}).catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
