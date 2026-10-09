import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/profile', authenticateUser, asyncHandler(async (req, res) => {
  const users = await sql(
    'SELECT name, email, wallet FROM users WHERE id=$1',
    [req.user.id],
  );

  if (users.length === 0) {
    return res.status(404).json({ message: 'No encontramos tu cuenta.' });
  }

  res.json({
    profile: {
      ...users[0],
      wallet: Number(users[0].wallet),
    },
  });
}));

export default router;
