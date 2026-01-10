const express = require('express');
const pool = require('../models/db.js');
const authenticateMerchant = require('../middleware/auth.js');

const router = express.Router();

// INLINE ID GENERATOR - perfect
function generateOrderId(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

router.post('/orders', authenticateMerchant, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ 
        error: { code: 'BADREQUESTERROR', description: 'amount must be at least 100' }  // ✅ Fixed: error.code
      });
    }
    const merchantId = req.merchant.id;
    console.log('Creating order for merchant:', merchantId);
    let orderId;
    let attempts = 0;
    while (attempts < 10) {
      orderId = generateOrderId('order');
      const existing = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
      if (existing.rows.length === 0) break;
      attempts++;
    }
    if (attempts >= 10) {
      return res.status(500).json({ 
        error: { code: 'INTERNALERROR', description: 'Could not generate unique order ID' }  // ✅ Fixed
      });
    }

    await pool.query(`
      INSERT INTO orders (id, merchantid, amount, currency, receipt, notes, status, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW(), NOW())
    `, [orderId, merchantId, amount, currency, receipt, notes]);

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    console.log('Order created:', orderId);
    res.status(201).json(order.rows[0]);
  } catch (err) {
    console.error('Order error:', err.message, err.stack);
    res.status(500).json({ 
      error: { code: 'INTERNALERROR', description: err.message }  // ✅ Fixed
    });
  }
});

router.get('/orders/:orderId', authenticateMerchant, async (req, res) => {  // ✅ Param :orderId perfect
  try {
    const { orderId } = req.params;
    const merchantId = req.merchant.id;
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND merchantid = $2',
      [orderId, merchantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { code: 'NOTFOUNDERROR', description: 'Order not found' }  // ✅ Fixed
      });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Order fetch error:', err.message);
    res.status(500).json({ 
      error: { code: 'INTERNALERROR', description: 'Order fetch failed' }  // ✅ Fixed
    });
  }
});

module.exports = router;
