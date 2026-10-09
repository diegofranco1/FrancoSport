import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use('/cart', authenticateUser);
router.post('/buy', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cartItems = await sql(
    'SELECT p.id, p.price, ci.quantity FROM cart_item ci JOIN products p ON ci.product_id = p.id JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = $1',
    [userId],
  );
  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const walletResults = await sql('SELECT wallet FROM users WHERE id = $1', [userId]);
  const userWallet = walletResults[0]?.wallet;

  if (userWallet < totalAmount) {
    return res.json({
      products: cartItems,
      totalProducts: cartItems.length,
      totalPrice: totalAmount,
      errorMessage: 'No tienes saldo suficiente para completar la compra.',
    });
  }

  await sql('UPDATE users SET wallet = wallet - $1 WHERE id = $2', [totalAmount, userId]);
  await sql(
    'INSERT INTO receipts (date, amount, user_id) VALUES (CURRENT_TIMESTAMP, $1, $2)',
    [totalAmount, userId],
  );
  const receipts = await sql(
    'SELECT id, date, amount FROM receipts WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
    [userId],
  );
  await sql(
    'DELETE FROM cart_item WHERE cart_id IN (SELECT id FROM cart WHERE user_id = $1)',
    [userId],
  );
  res.json({ receipt: receipts[0], products: cartItems });
}));

router.post('/cart/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { product_id: productId, quantity, size } = req.body;
  const productIdNumber = Number(productId);
  const requestedQuantity = Number(quantity);
  const allowedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  if (!Number.isInteger(productIdNumber) || productIdNumber < 1) {
    return res.status(400).json({ error: 'El producto seleccionado no es válido.' });
  }
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor que cero.' });
  }
  if (!allowedSizes.includes(size)) {
    return res.status(400).json({ error: 'Selecciona una talla válida.' });
  }

  const inventory = await sql(
    `SELECT ps.stock,
            COALESCE(SUM(ci.quantity), 0)::integer AS cart_quantity
     FROM product_sizes AS ps
     LEFT JOIN cart_item AS ci
       ON ci.product_id = ps.product_id
       AND ci.size = ps.size
       AND ci.cart_id IN (SELECT id FROM cart WHERE user_id = $1)
     WHERE ps.product_id = $2 AND ps.size = $3
     GROUP BY ps.stock`,
    [userId, productIdNumber, size],
  );
  if (!inventory.length) {
    return res.status(404).json({ error: 'No encontramos esa talla para el producto.' });
  }
  if (requestedQuantity + Number(inventory[0].cart_quantity) > Number(inventory[0].stock)) {
    return res.status(409).json({
      error: `No hay suficientes unidades en talla ${size}. Stock disponible: ${inventory[0].stock}.`,
    });
  }

  const carts = await sql('SELECT id FROM cart WHERE user_id=$1', [userId]);
  let cartId = carts[0]?.id;

  if (!cartId) {
    const newCarts = await sql('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [userId]);
    cartId = newCarts[0].id;
  }

  await sql(
    'INSERT INTO cart_item (cart_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)',
    [cartId, productIdNumber, requestedQuantity, size],
  );
  res.json({ message: 'Producto agregado al carro.' });
}));

router.get('/cart', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const products = await sql(
    `SELECT p.id, p.name, p.price, p.url, ci.size, ci.quantity,
            (ci.quantity*p.price) AS total_price
     FROM cart_item ci
     JOIN products p ON ci.product_id = p.id
     JOIN product_sizes ps ON ps.product_id = ci.product_id AND ps.size = ci.size
     JOIN cart c ON ci.cart_id = c.id
     WHERE c.user_id = $1`,
    [userId],
  );
  const totals = await sql(
    `SELECT COALESCE(SUM(ci.quantity), 0) AS total_products,
            COALESCE(SUM(ci.quantity * p.price), 0) AS total_price
     FROM cart_item ci
     JOIN products p ON ci.product_id = p.id
     JOIN cart c ON ci.cart_id = c.id
     WHERE c.user_id = $1`,
    [userId],
  );

  res.json({
    products: products.map(product => ({
      ...product,
      total_price: Number(product.total_price),
    })),
    totalProducts: Number(totals[0].total_products),
    totalPrice: Number(totals[0].total_price),
  });
}));

router.delete('/cart/:productId', asyncHandler(async (req, res) => {
  await sql(
    'DELETE FROM cart_item WHERE product_id = $1 AND cart_id = (SELECT id FROM cart WHERE user_id = $2)',
    [req.params.productId, req.user.id],
  );
  res.json({ message: 'Producto eliminado del carro.' });
}));

router.delete('/cart/:productId/:size', asyncHandler(async (req, res) => {
  await sql(
    `DELETE FROM cart_item
     WHERE product_id = $1 AND size = $2
       AND cart_id = (SELECT id FROM cart WHERE user_id = $3)`,
    [req.params.productId, req.params.size, req.user.id],
  );
  res.json({ message: 'Producto eliminado del carro.' });
}));

router.get('/purchase', authenticateUser, (req, res) => {
  res.json({ message: 'La compra se realizó correctamente.', status: 'success' });
});

export default router;
