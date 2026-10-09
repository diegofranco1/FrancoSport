import { Router } from 'express';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const productSelect = `
  SELECT p.id, p.name, p.price, p.url,
         COALESCE(SUM(ps.stock), 0)::integer AS stock,
         COALESCE(
           JSON_AGG(JSON_BUILD_OBJECT('size', ps.size, 'stock', ps.stock) ORDER BY
             CASE ps.size
               WHEN 'XS' THEN 1
               WHEN 'S' THEN 2
               WHEN 'M' THEN 3
               WHEN 'L' THEN 4
               WHEN 'XL' THEN 5
               WHEN 'XXL' THEN 6
             END
           ) FILTER (WHERE ps.size IS NOT NULL),
           '[]'::json
         ) AS sizes
  FROM products AS p
  LEFT JOIN product_sizes AS ps ON ps.product_id = p.id`;

router.get('/products', asyncHandler(async (req, res) => {
  const products = await sql(`${productSelect} GROUP BY p.id`);
  res.status(200).json({
    message: 'Lista de productos cargada correctamente.',
    products,
  });
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const products = await sql(`${productSelect} WHERE p.id = $1 GROUP BY p.id`, [req.params.id]);
  if (!products.length) {
    return res.status(404).json({ error: 'No encontramos ese producto.' });
  }

  res.status(200).json({ product: products[0] });
}));

export default router;
