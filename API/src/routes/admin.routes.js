import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use('/admin', authenticateUser, requireAdmin);

router.get('/admin', asyncHandler(async (req, res) => {
  const products = await sql('SELECT id, name, price, url, stock FROM products');
  const sales = await sql('SELECT SUM(amount) AS total_sales FROM receipts');
  res.json({ products, totalSales: sales[0]?.total_sales || 0 });
}));

router.post('/admin/products', asyncHandler(async (req, res) => {
  const { name, price, url, stock } = req.body;
  const products = await sql(
    'INSERT INTO products (name, price, url, stock) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, price, url, stock],
  );
  res.status(200).json({
    message: 'Producto creado correctamente.',
    product: products[0],
  });
}));

router.post('/admin/edit/:id', asyncHandler(async (req, res) => {
  const { name, price, url, stock } = req.body;
  await sql(
    'UPDATE products SET name=$1, price=$2, url=$3, stock=$4 WHERE id=$5',
    [name, price, url, stock, req.params.id],
  );
  res.json({ message: 'Producto modificado correctamente' });
}));

router.delete('/admin/products/:id', asyncHandler(async (req, res) => {
  await sql('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.status(200).json({ message: 'Producto eliminado correctamente.' });
}));

export default router;
