// src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { UserRepository } from '../repositories/user.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const userRepository = new UserRepository();
const listingRepository = new ListingRepository();
const transactionRepository = new TransactionRepository();
const complaintRepository = new ComplaintRepository();

const adminService = new AdminService(
  userRepository,
  listingRepository,
  transactionRepository,
  complaintRepository,
);
const adminController = new AdminController(adminService);

const router = Router();

// Semua admin routes wajib authenticate + requireAdmin
router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/listings/pending', adminController.getPendingListings);
router.patch('/listings/:id/moderate', adminController.moderateListing);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle', adminController.toggleUserStatus);
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:id', adminController.updateComplaintStatus);

export default router;
