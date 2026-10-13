import mongoose from 'mongoose';
const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: { type: String, trim: true, maxlength: 25 },
    courseInterest: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    message: { type: String, trim: true, maxlength: 2000 },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);
enquirySchema.index({ claimedBy: 1, createdAt: -1, _id: -1 });
export const Enquiry = mongoose.model('Enquiry', enquirySchema);
