import { Router } from 'express';
import {
  submitEnquiry,
  publicEnquiries,
  myEnquiries,
  claimEnquiry,
} from '../controllers/enquiryController.js';
import { authenticate } from '../middleware/auth.js';
import {
  enquiryValidation,
  claimValidation,
  paginationValidation,
} from '../middleware/validation.js';
const router = Router();
router.post('/', enquiryValidation, submitEnquiry);
router.get('/public', authenticate, paginationValidation, publicEnquiries);
router.get('/my', authenticate, paginationValidation, myEnquiries);
router.patch('/:id/claim', authenticate, claimValidation, claimEnquiry);
export default router;
