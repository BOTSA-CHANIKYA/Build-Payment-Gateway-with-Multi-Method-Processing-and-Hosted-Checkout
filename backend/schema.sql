CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  apikey VARCHAR(64) UNIQUE NOT NULL,
  apisecret VARCHAR(64) NOT NULL,
  webhookurl TEXT,
  isactive BOOLEAN DEFAULT true,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed test merchant
INSERT INTO merchants (id, name, email, apikey, apisecret) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Test Merchant',
  'test@example.com',
  'keytestabc123',
  'secrettestxyz789'
) ON CONFLICT (email) DO NOTHING;


CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  merchantid UUID NOT NULL REFERENCES merchants(id),
  amount INTEGER NOT NULL CHECK (amount >= 100),
  currency VARCHAR(3) DEFAULT 'INR',
  receipt VARCHAR(255),
  notes JSONB,
  status VARCHAR(20) DEFAULT 'created',
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_merchantid ON orders(merchantid);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  orderid VARCHAR(64) NOT NULL REFERENCES orders(id),
  merchantid UUID NOT NULL REFERENCES merchants(id),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing',
  vpa VARCHAR(255),
  cardnetwork VARCHAR(20),
  cardlast4 VARCHAR(4),
  errorcode VARCHAR(50),
  errordescription TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_orderid ON payments(orderid);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
