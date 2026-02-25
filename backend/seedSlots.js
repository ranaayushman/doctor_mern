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

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const doctor of doctors) {
    const docs = [];
    for (const slotDate of dates) {
      for (let h = 9; h < 17; h++) {
        for (const m of [0, 30]) {
          const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const endH = m === 30 ? h + 1 : h;
          const endM = m === 30 ? 0 : 30;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          docs.push({ doctorId: doctor._id, date: slotDate, startTime, endTime, isBooked: false, isCancelled: false });
        }
      }
    }
    try {
      const result = await TimeSlot.insertMany(docs, { ordered: false });
      totalCreated += result.length;
      console.log(`  ${doctor.firstName}: created ${result.length}`);
    } catch (err) {
      if (err.code === 11000 || err.writeErrors) {
        const inserted = err.insertedDocs?.length || (docs.length - (err.writeErrors?.length || 0));
        totalCreated += inserted;
        totalSkipped += err.writeErrors?.length || 0;
        console.log(`  ${doctor.firstName}: created ${inserted}, skipped ${err.writeErrors?.length || 0} duplicates`);
      } else {
        throw err;
      }
    }
  }

  console.log(`\nDone! Created: ${totalCreated}, Skipped duplicates: ${totalSkipped}`);
  const total = await TimeSlot.countDocuments();
  console.log(`Total slots in DB: ${total}`);
  mongoose.disconnect();
}).catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
