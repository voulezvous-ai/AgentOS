import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date }
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema);