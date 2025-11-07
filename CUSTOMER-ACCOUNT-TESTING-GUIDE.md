# Customer Account Creation - Testing Guide

## 🎯 **Overview**
The customer account creation system has been fully implemented and is ready for testing. Customers can now register with email/password credentials and login with those same credentials.

## 🚀 **How to Test**

### **Method 1: Use the Test Page**
1. Navigate to: `http://localhost:3000/customer-account-test`
2. Fill in the test form with sample data
3. Click "Test Customer Account Creation"
4. Review the detailed test results

### **Method 2: Use the Registration Page**
1. Navigate to: `http://localhost:3000/customer-registration`
2. Fill in the registration form
3. Submit the form
4. You'll be automatically logged in and redirected to dashboard

### **Method 3: Test Login**
1. Navigate to: `http://localhost:3000/login`
2. Use the credentials from a created customer account
3. Verify successful login and dashboard access

## 🔧 **Database Setup**

### **Run SQL Script**
1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `test-customer-accounts.sql`
3. Run the script to verify database structure

### **Expected Database Structure**
The `users` table should have these columns:
- `id` (Primary Key)
- `email` (Unique)
- `name`
- `phone` (Optional)
- `password_hash`
- `role` (CUSTOMER/SHOPKEEPER/ADMIN)
- `is_active` (Boolean)
- `email_verified` (Boolean)
- `phone_verified` (Boolean)
- `created_at` (Timestamp)

## 📋 **Test Cases**

### **1. Successful Registration**
- **Input**: Valid name, email, password
- **Expected**: Account created, auto-login, redirect to dashboard
- **Verify**: User appears in database, session stored

### **2. Duplicate Email**
- **Input**: Email that already exists
- **Expected**: Error message about existing account
- **Verify**: No duplicate accounts created

### **3. Password Mismatch**
- **Input**: Password and confirm password don't match
- **Expected**: Validation error before submission
- **Verify**: Form doesn't submit

### **4. Missing Required Fields**
- **Input**: Empty required fields
- **Expected**: Validation errors
- **Verify**: Form doesn't submit

### **5. Login with Created Account**
- **Input**: Email/password from registered account
- **Expected**: Successful login
- **Verify**: Dashboard access, session persistence

## 🔍 **Debugging**

### **Check Browser Console**
Look for these debug messages:
- `🔍 Creating user account with data:`
- `🔍 Insert result:`
- `🔍 Account created successfully, authenticating...`

### **Check Database**
Run this query in Supabase:
```sql
SELECT id, email, name, phone, role, is_active, created_at
FROM users 
WHERE role = 'CUSTOMER'
ORDER BY created_at DESC;
```

### **Check Session Storage**
In browser DevTools > Application > Session Storage:
- Look for `userSession` key
- Verify it contains user data

## ✅ **Success Indicators**

1. **Registration Form**: All fields work, validation works
2. **Account Creation**: User appears in database
3. **Auto-Login**: User is logged in after registration
4. **Dashboard Access**: Can access customer dashboard
5. **Login Page**: Can login with created credentials
6. **Session Persistence**: Login persists across page refreshes

## 🚨 **Common Issues & Solutions**

### **Issue**: "User already exists"
- **Solution**: Use a different email or try logging in

### **Issue**: "Database error"
- **Solution**: Check Supabase connection, run SQL setup script

### **Issue**: "Login failed after registration"
- **Solution**: Check password hashing, verify database structure

### **Issue**: "No redirect to dashboard"
- **Solution**: Check router.push, verify dashboard route exists

## 📞 **Support**

If you encounter issues:
1. Check browser console for error messages
2. Run the test page to see detailed results
3. Verify database structure with SQL script
4. Check Supabase environment variables

The customer account creation system is now fully functional and ready for use! 🎉
