// backend/routes/payments.js - SCHEMA-MATCHED FIXED (Copy-Paste Replace)
const express = require('express');
const pool = require('../models/db.js');
const authenticateMerchant = require('../middleware/auth.js');

const router = express.Router();

// Utils (unchanged)
function generatePaymentId(prefix = 'pay') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function validateVPA(vpa) {
  return /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/.test(vpa);
}

function luhnCheck(cardNumber) {
  let sum = 0, shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function getCardNetwork(cleanCard) {
  if (cleanCard.startsWith('4')) return 'visa';
  if (cleanCard.startsWith('5')) return 'mastercard';
  if (cleanCard.startsWith('34') || cleanCard.startsWith('37')) return 'amex';
  if (cleanCard.startsWith('60') || cleanCard.startsWith('65') || (parseInt(cleanCard.substring(0,2)) >= 81 && parseInt(cleanCard.substring(0,2)) <= 89)) return 'rupay';
  return 'unknown';
}

// POST /api/v1/payments
router.post('/payments', authenticateMerchant, async (req, res) => {
  try {
    const { orderid, method, vpa, cardnumber, cardexpirymm, cardexpiyyear, cvv } = req.body;
    
    if (!orderid || !method) {
      return res.status(400).json({ error: { code: 'BADREQUESTERROR', description: 'Missing orderid or method' } });
    }

    // Fetch order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderid]);
    if (orderResult.rows.length === 0) {
      return res.status(400).json({ error: { code: 'ORDERNOTFOUND', description: 'Order not found' } });
    }
    const order = orderResult.rows[0];

    // UPI validation
    if (method === 'upi') {
      if (!vpa || !validateVPA(vpa)) {
        return res.status(400).json({ error: { code: 'BADREQUESTERROR', description: 'Invalid VPA' } });
      }
    } else if (method === 'card') {
      if (!cardnumber || !luhnCheck(cardnumber.replace(/\s/g, ''))) {
        return res.status(400).json({ error: { code: 'INVALIDCARD', description: 'Invalid card number' } });
      }
      const expMonth = parseInt(cardexpirymm);
      const expYear = parseInt(cardexpiyyear);
      const currYear = new Date().getFullYear() % 100;
      const currMonth = new Date().getMonth() + 1;
      if (expMonth < 1 || expMonth > 12 || expYear < currYear || (expYear === currYear && expMonth < currMonth)) {
        return res.status(400).json({ error: { code: 'EXPIREDCARD', description: 'Invalid expiry date' } });
      }
      if (!cvv || cvv.length !== 3) {
        return res.status(400).json({ error: { code: 'BADREQUESTERROR', description: 'Invalid CVV' } });
      }
    } else {
      return res.status(400).json({ error: { code: 'BADREQUESTERROR', description: 'Invalid method' } });
    }

    const paymentId = generatePaymentId();
    const cleanCard = cardnumber ? cardnumber.replace(/\s/g, '').slice(-4) : null;
    const cardNetwork = cardnumber ? getCardNetwork(cardnumber.replace(/\s/g, '')) : null;
    const cardLast4 = cleanCard;

    // Insert payment (matches orders schema: merchantid lowercase, adds error fields)
    await pool.query(`
  INSERT INTO payments (
    id,
    merchantid,
    orderid,
    amount,
    currency,
    method,
    vpa,
    cardnetwork,
    cardlast4,
    status,
    createdat,
    updatedat,
    errorcode,
    errordescription
  )
  VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    'processing',
    NOW(), NOW(),
    NULL, NULL
  )
`, [
  paymentId,
  order.merchantid,
  orderid,
  order.amount,
  order.currency,
  method,
  vpa || null,
  cardNetwork,
  cardLast4
]);

    // Simulate processing
    setTimeout(async () => {
      const successRate = method === 'upi' ? 0.9 : 0.95;
      const status = Math.random() < successRate ? 'success' : 'failed';
      const errorCode = status === 'failed' ? (Math.random() < 0.5 ? 'DECLINED' : 'NETWORKERROR') : null;
      const errorDescription = status === 'failed' ? 'Payment declined' : null;

      await pool.query(`
  UPDATE payments
  SET status = $1,
      errorcode = $2,
      errordescription = $3,
      updatedat = NOW()
  WHERE id = $4
`, [status, errorCode, errorDescription, paymentId]);

      await pool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, orderid]);
    }, Math.random() * 8000 + 2000);

    res.status(201).json({
      id: paymentId,
      entity: 'payment',
      status: 'processing',
      amount: order.amount / 100,
      currency: order.currency
    });
  } catch (err) {
    console.error('Payment creation error:', err.message);
    res.status(500).json({ error: { code: 'INTERNALERROR', description: 'Payment creation failed' } });
  }
});

// GET /api/v1/payments/:id
router.get('/payments/:id', authenticateMerchant, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'PAYMENTNOTFOUND', description: 'Payment not found' } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Payment fetch error:', err.message);
    res.status(500).json({ error: { code: 'INTERNALERROR', description: 'Payment fetch failed' } });
  }
});

module.exports = router;
