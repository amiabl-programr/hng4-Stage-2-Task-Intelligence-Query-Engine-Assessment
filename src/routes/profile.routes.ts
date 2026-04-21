import { Router } from 'express';
import {
  getProfiles,
  searchProfiles,
} from '../controllers/profile.controller.js';

const router = Router();

router.get('/search', searchProfiles);
router.get('/', getProfiles);

export default router;
