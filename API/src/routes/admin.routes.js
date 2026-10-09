import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use('/admin', authenticateUser, requireAdmin);

async function setProductSizeStock(productId, stock) {
  await sql(
    `INSERT INTO product_sizes (product_id, size, stock)
     SELECT $1, sizes.size,
            ($2::integer / 6) +
            CASE WHEN sizes.size_order <= MOD($2::integer, 6) THEN 1 ELSE 0 END
     FROM (VALUES ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6))
       AS sizes(size, size_order)
     ON CONFLICT (product_id, size)
     DO UPDATE SET stock = EXCLUDED.stock`,
    [productId, stock],
  );
}

router.get('/admin', asyncHandler(async (req, res) => {
  const products = await sql(
    `SELECT p.id, p.name, p.price, p.url,
            COALESCE(SUM(ps.stock), 0)::integer AS stock
     FROM products AS p
     LEFT JOIN product_sizes AS ps ON ps.product_id = p.id
     GROUP BY p.id`,
  );
  const sales = await sql('SELECT SUM(amount) AS total_sales FROM receipts');
  res.json({ products, totalSales: sales[0]?.total_sales || 0 });
}));

router.post('/admin/products', asyncHandler(async (req, res) => {
  const { name, price, url, stock } = req.body;
  const initialStock = Number(stock);
  if (!Number.isInteger(initialStock) || initialStock < 0) {
    return res.status(400).json({ error: 'El stock debe ser un número entero igual o mayor que cero.' });
  }
  const products = await sql(
    'INSERT INTO products (name, price, url, stock) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, price, url, initialStock],
  );
  await setProductSizeStock(products[0].id, initialStock);
  res.status(200).json({
    message: 'Producto creado correctamente.',
    product: products[0],
  });
}));

router.post('/admin/edit/:id', asyncHandler(async (req, res) => {
  const { name, price, url, stock } = req.body;
  const updatedStock = Number(stock);
  if (!Number.isInteger(updatedStock) || updatedStock < 0) {
    return res.status(400).json({ error: 'El stock debe ser un número entero igual o mayor que cero.' });
  }
  await sql(
    'UPDATE products SET name=$1, price=$2, url=$3, stock=$4 WHERE id=$5',
    [name, price, url, updatedStock, req.params.id],
  );
  await setProductSizeStock(req.params.id, updatedStock);
  res.json({ message: 'Producto modificado correctamente' });
}));

router.delete('/admin/products/:id', asyncHandler(async (req, res) => {
  await sql('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.status(200).json({ message: 'Producto eliminado correctamente.' });
}));

export default router;
