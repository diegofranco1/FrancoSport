import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/receipts', authenticateUser, asyncHandler(async (req, res) => {
  const receipts = await sql(
    `SELECT r.id, r.date, r.amount, u.name
     FROM receipts r
     JOIN users u ON r.user_id = u.id
     WHERE r.user_id = $1
     ORDER BY r.date DESC`,
    [req.user.id],
  );
  res.json({ receipts });
}));

export default router;
