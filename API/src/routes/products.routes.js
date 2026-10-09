import { Router } from 'express';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/products', asyncHandler(async (req, res) => {
  const products = await sql('SELECT * FROM products');
  res.status(200).json({
    message: 'Lista de productos cargada correctamente.',
    products,
  });
}));

export default router;
