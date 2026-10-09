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
  const { product_id: productId, quantity } = req.body;
  const carts = await sql('SELECT id FROM cart WHERE user_id=$1', [userId]);
  let cartId = carts[0]?.id;

  if (!cartId) {
    const newCarts = await sql('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [userId]);
    cartId = newCarts[0].id;
  }

  await sql(
    'INSERT INTO cart_item (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
    [cartId, productId, quantity],
  );
  res.json({ message: 'Producto agregado al carro.' });
}));

router.get('/cart', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const products = await sql(
    `SELECT p.id, p.name, p.price, p.url, ci.quantity, (ci.quantity*p.price) AS total_price
     FROM cart_item ci
     JOIN products p ON ci.product_id = p.id
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

router.get('/purchase', authenticateUser, (req, res) => {
  res.json({ message: 'La compra se realizó correctamente.', status: 'success' });
});

export default router;
