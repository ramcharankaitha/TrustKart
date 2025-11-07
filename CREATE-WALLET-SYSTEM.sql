-- Create wallet system for customers
-- This script creates tables for customer wallet balance and transactions
-- Note: Uses TEXT for IDs to match the users table (which uses cuid() strings)

-- Create wallet_balances table to store current balance for each customer
CREATE TABLE IF NOT EXISTS wallet_balances (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallet_transactions table to track all wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- 'CREDIT' (add money), 'DEBIT' (spend), 'REFUND'
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50), -- 'CASH', 'UPI', 'CARD', 'NET_BANKING', etc.
  payment_reference VARCHAR(255), -- UPI transaction ID, payment gateway reference, etc.
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL, -- If transaction is related to an order
  status VARCHAR(20) DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(order_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON wallet_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize wallet balance for new users
CREATE OR REPLACE FUNCTION initialize_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet_balances (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-initialize wallet for new users (optional - can be done manually)
-- Uncomment the line below if you want wallets to be auto-created for new users
-- DROP TRIGGER IF EXISTS initialize_wallet_on_user_create ON users;
-- CREATE TRIGGER initialize_wallet_on_user_create AFTER INSERT ON users
--   FOR EACH ROW EXECUTE FUNCTION initialize_wallet_balance();

-- Grant necessary permissions (adjust based on your RLS policies)
-- ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your security requirements)
-- Policy: Users can only view their own wallet balance
-- CREATE POLICY "Users can view own wallet balance" ON wallet_balances
--   FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only view their own transactions
-- CREATE POLICY "Users can view own transactions" ON wallet_transactions
--   FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE wallet_balances IS 'Stores current wallet balance for each customer';
COMMENT ON TABLE wallet_transactions IS 'Stores all wallet transactions (credits, debits, refunds)';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Type of transaction: CREDIT (add money), DEBIT (spend), REFUND';
COMMENT ON COLUMN wallet_transactions.payment_method IS 'Payment method used: CASH, UPI, CARD, NET_BANKING, etc.';
COMMENT ON COLUMN wallet_transactions.payment_reference IS 'Transaction reference from payment gateway or UPI';
