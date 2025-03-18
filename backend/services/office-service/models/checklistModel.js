import mongoose from 'mongoose';

const ChecklistSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  tasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    note: { type: String }
  }]
});

export default mongoose.model('Checklist', ChecklistSchema);