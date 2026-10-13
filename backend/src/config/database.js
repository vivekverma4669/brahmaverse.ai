import mongoose from 'mongoose';
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);
export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
