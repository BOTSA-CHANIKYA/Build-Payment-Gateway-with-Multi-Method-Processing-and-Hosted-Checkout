const express = require('express');
const { pool } = require('../models/db.js');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1'); // DB check
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

module.exports = router;
