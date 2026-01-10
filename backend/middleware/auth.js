const pool = require('../models/db.js');  // ✅ Direct pool (no { pool })

async function authenticateMerchant(req, res, next) {
  try {
    const apiKey = req.header('X-Api-Key');
    const apiSecret = req.header('X-Api-Secret');

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATIONERROR',  // ✅ Fixed casing
          description: 'Missing API credentials'
        }
      });
    }

    console.log('Auth:', apiKey.substring(0,8)+'...');  // Debug

    const result = await pool.query(
      'SELECT * FROM merchants WHERE apikey = $1 AND apisecret = $2 AND isactive = true',
      [apiKey, apiSecret]
    );

    console.log('Auth rows:', result.rows.length);  // Debug

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATIONERROR',
          description: 'Invalid API credentials'
        }
      });
    }

    req.merchant = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth error:', err.message, err.stack);
    return res.status(500).json({
      error: {
        code: 'AUTHENTICATIONERROR',
        description: 'Authentication service error'
      }
    });
  }
}

module.exports = authenticateMerchant;
