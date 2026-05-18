// src/routes/listing.routes.ts
import { Router } from 'express';
import { ListingController } from '../controllers/listing.controller';
import { ListingService } from '../services/listing.service';
import { ListingRepository } from '../repositories/listing.repository';
import { authenticate } from '../middleware/auth.middleware';

const listingRepository = new ListingRepository();
const listingService = new ListingService(listingRepository);
const listingController = new ListingController(listingService);

const router = Router();

router.get('/', authenticate, listingController.getAll);
router.get('/my/listings', authenticate, listingController.getMyListings);
router.get('/:id', authenticate, listingController.getById);
router.post('/', authenticate, listingController.create);
router.put('/:id', authenticate, listingController.update);
router.delete('/:id', authenticate, listingController.delete);

export default router;
