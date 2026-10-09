import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import productRoutes from './products.routes.js';
import profileRoutes from './profile.routes.js';
import receiptsRoutes from './receipts.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
router.use(adminRoutes);
router.use(authRoutes);
router.use(cartRoutes);
router.use(productRoutes);
router.use(profileRoutes);
router.use(receiptsRoutes);

export default router;
