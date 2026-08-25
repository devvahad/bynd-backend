import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    deleted: { type: Boolean, default: false },
    category: { type: String, required: true },
    subOption: { type: String },
    source: { type: String, enum: ['CHAT', 'PROFILE'], default: 'PROFILE' },
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

ReportSchema.index({ reporterId: 1, reportedUserId: 1, category: 1, subOption: 1 });
ReportSchema.index({ status: 1, createdOn: -1 });

const ReportModel = model('Report', ReportSchema);

export default ReportModel;
