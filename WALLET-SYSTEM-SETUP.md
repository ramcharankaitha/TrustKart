# Customer Wallet System Setup Guide

This guide explains how to set up and use the customer wallet system that allows customers to add money to their e-wallet.

## Features

- ✅ View current wallet balance
- ✅ Add money to wallet with multiple payment methods
- ✅ View transaction history
- ✅ Quick add amount buttons (₹100, ₹500, ₹1,000, ₹2,000, ₹5,000)
- ✅ Support for UPI, Card, Net Banking, Cash, and Other payment methods
- ✅ Transaction tracking with payment references

## Database Setup

### Step 1: Run the SQL Script

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the `CREATE-WALLET-SYSTEM.sql` file

This will create:
- `wallet_balances` table - Stores current balance for each customer
- `wallet_transactions` table - Stores all wallet transactions (credits, debits, refunds)
- Indexes for better query performance
- Triggers for automatic timestamp updates

### Step 2: Verify Tables

After running the SQL script, verify that the tables were created:

```sql
-- Check wallet_balances table
SELECT * FROM wallet_balances LIMIT 5;

-- Check wallet_transactions table
SELECT * FROM wallet_transactions LIMIT 5;
```

## API Endpoints

### 1. Get Wallet Balance

**Endpoint:** `GET /api/wallet/balance?userId={userId}`

**Response:**
```json
{
  "success": true,
  "balance": 1500.00,
  "transactions": [...]
}
```

### 2. Add Money to Wallet

**Endpoint:** `POST /api/wallet/add-money`

**Request Body:**
```json
{
  "userId": "user-id-here",
  "amount": 1000,
  "paymentMethod": "UPI",
  "paymentReference": "UPI123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully added ₹1000 to wallet",
  "balance": 2500.00,
  "transaction": {...}
}
```

## Usage

### For Customers

1. Navigate to **Dashboard → My Wallet** (or `/dashboard/wallet`)
2. View your current balance
3. Click **"Add Money"** button
4. Enter the amount or use quick add buttons
5. Select payment method
6. Optionally enter payment reference
7. Click **"Add ₹{amount}"** to complete

### Payment Methods Supported

- **UPI** - Unified Payments Interface
- **CARD** - Credit/Debit Card
- **NET_BANKING** - Net Banking
- **CASH** - Cash payment
- **OTHER** - Other payment methods

## Transaction Types

- **CREDIT** - Money added to wallet (green)
- **DEBIT** - Money spent from wallet (red)
- **REFUND** - Refund received (blue)

## Transaction Status

- **PENDING** - Transaction is pending
- **COMPLETED** - Transaction completed successfully
- **FAILED** - Transaction failed

## Limits

- Minimum amount: ₹1
- Maximum amount per transaction: ₹1,00,000

## Security Considerations

1. **Row Level Security (RLS)**: Consider enabling RLS policies to ensure users can only access their own wallet data
2. **Payment Gateway Integration**: For production, integrate with a payment gateway (Razorpay, Stripe, etc.) instead of manual entry
3. **Transaction Validation**: Add additional validation for payment references
4. **Audit Logging**: All transactions are logged with timestamps and user IDs

## Future Enhancements

- [ ] Integrate with payment gateway (Razorpay/Stripe)
- [ ] Add wallet-to-wallet transfers
- [ ] Add withdrawal functionality
- [ ] Add wallet usage in checkout/payment flow
- [ ] Add transaction filters and search
- [ ] Add export transaction history
- [ ] Add wallet balance notifications

## Troubleshooting

### Wallet balance not showing

1. Check if the wallet_balances table exists
2. Verify the user has a record in wallet_balances (auto-created on first API call)
3. Check browser console for errors
4. Verify user session is valid

### Cannot add money

1. Verify amount is between ₹1 and ₹1,00,000
2. Check user ID is valid
3. Check database connection
4. Verify wallet_balances and wallet_transactions tables exist

### Transactions not appearing

1. Check wallet_transactions table exists
2. Verify user_id matches the logged-in user
3. Check transaction status is 'COMPLETED'
4. Refresh the page

## Support

For issues or questions, check:
- Database logs in Supabase dashboard
- Browser console for frontend errors
- API route logs in Next.js server

