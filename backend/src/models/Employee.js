import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
const employeeSchema = new mongoose.Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_document, object) {
        delete object.password;
        return object;
      },
    },
  },
);
employeeSchema.pre('save', async function () {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, config.bcryptRounds);
});
export const Employee = mongoose.model('Employee', employeeSchema);
