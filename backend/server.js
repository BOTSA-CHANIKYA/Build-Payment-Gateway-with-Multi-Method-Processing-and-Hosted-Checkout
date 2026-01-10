require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./models/db.js');  // Fixed: plain pool
const luhnCheck = require('./utils/validation.js');  // Fixed: plain
const authenticateMerchant = require('./middleware/auth.js');
const healthRouter = require('./routes/health');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');  // ✅ Fixed path

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint (direct)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ROUTE MOUNTS - Clean single mounts
app.use('/api/v1', healthRouter);
app.use('/api/v1', ordersRouter);
app.use('/api/v1', paymentsRouter);  // ✅ Single mount, correct path

// Test merchant - NO AUTH
app.get('/api/v1/testmerchant', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, apikey FROM merchants WHERE email = $1', 
      ['test@example.com']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { code: 'NOTFOUNDERROR', description: 'Test merchant not seeded' } 
      });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Test merchant error:', err);
    res.status(500).json({ 
      error: { code: 'INTERNALERROR', description: 'Test endpoint failed' } 
    });
  }
});

// Root + Luhn test
app.get('/', (req, res) => res.json({ message: 'Payment Gateway API v1' }));
app.get('/test-luhn/:card', (req, res) => res.json({ valid: luhnCheck(req.params.card) }));

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
