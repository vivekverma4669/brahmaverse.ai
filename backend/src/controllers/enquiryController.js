import { matchedData } from 'express-validator';
import { Enquiry } from '../models/Enquiry.js';
import { ApiError } from '../utils/ApiError.js';

export async function submitEnquiry(req, res) {
  const enquiry = await Enquiry.create({
    ...matchedData(req, { locations: ['body'] }),
    claimedBy: null,
  });
  res
    .status(201)
    .json({ success: true, message: 'Enquiry submitted.', data: { enquiry } });
}

async function list(req, res, filter) {
  const { page: rawPage = 1, limit: rawLimit = 20 } = matchedData(req, {
    locations: ['query'],
  });
  const page = Number(rawPage);
  const limit = Number(rawLimit);
  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: { enquiries },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
export async function publicEnquiries(req, res) {
  await list(req, res, { claimedBy: null });
}

export async function myEnquiries(req, res) {
  await list(req, res, { claimedBy: req.employee._id });
}

export async function claimEnquiry(req, res) {
  // The predicate and write are ONE atomic database operation; never read then overwrite.
  const enquiry = await Enquiry.findOneAndUpdate(
    { _id: req.params.id, claimedBy: null },
    { $set: { claimedBy: req.employee._id } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!enquiry) {
    // Only after a failed conditional update, distinguish absence from a conflict.
    // Do not return the existing private document or its owner.
    if (!(await Enquiry.exists({ _id: req.params.id })))
      throw new ApiError(404, 'Enquiry not found.');
    throw new ApiError(409, 'Enquiry has already been claimed.');
  }
  res.json({ success: true, message: 'Enquiry claimed.', data: { enquiry } });
}
