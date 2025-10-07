# 🔧 Environment Setup Guide - Qurtuba Fashion

This guide will help you set up the environment variables and get your Qurtuba Fashion webapp running properly.

## 🚀 Quick Fix for "Missing Supabase environment variables" Error

If you're seeing this error, follow these steps:

### Step 1: Create Environment File
```bash
node setup-env.js
```

This will create a `.env` file with the basic configuration.

### Step 2: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `dbjaogpesmyrqjwtzzwr`

2. **Get Your API Keys**
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon public** key
   - Update your `.env` file with the correct values

### Step 3: Update .env File

Your `.env` file should look like this:
```env
VITE_SUPABASE_URL=https://dbjaogpesmyrqjwtzzwr.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-from-supabase-dashboard
```

### Step 4: Test the Setup
```bash
node test-env.js
```

### Step 5: Start the Application
```bash
npm run dev
```

## 🗄️ Database Setup

### Create Database Tables

1. **Go to Supabase SQL Editor**
   - Navigate to your project dashboard
   - Click **SQL Editor** in the left sidebar

2. **Run the Complete Schema**
   - Copy the contents of `complete-database-schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see these tables:
     - ✅ users
     - ✅ roles
     - ✅ customers
     - ✅ orders
     - ✅ invoices
     - ✅ invoice_items
     - ✅ customer_measurements
     - ✅ pages
     - ✅ actions

## 🧪 Testing the Application

### 1. Check Environment Variables
```bash
node test-env.js
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open the Application
- Go to: http://localhost:3000
- Check browser console for any errors
- Look for database connection messages

### 4. Test Database Integration
- Try creating a new customer
- Try creating a new order
- Try creating a new invoice
- Verify data persists between page refreshes

## 🔧 Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"
**Solution:**
```bash
node setup-env.js
```

#### 2. "Supabase connection failed"
**Check:**
- Internet connection
- Supabase credentials in `.env`
- Database tables are created
- Supabase project is active

#### 3. Forms not saving data
**Check:**
- Browser console for errors
- Database tables exist
- Environment variables are correct

#### 4. "Cannot read properties of undefined"
**Solution:**
- Restart the development server
- Clear browser cache
- Check environment variables

### Debug Steps

1. **Check Environment Variables**
   ```bash
   node test-env.js
   ```

2. **Verify Database Connection**
   - Check Supabase dashboard
   - Look for sample data in tables
   - Test with a simple query

3. **Check Browser Console**
   - Look for error messages
   - Check network requests
   - Verify API calls are working

## 📋 Complete Setup Checklist

- [ ] Environment variables configured (`.env` file)
- [ ] Supabase project active
- [ ] Database tables created
- [ ] Development server running
- [ ] Application accessible at http://localhost:3000
- [ ] No console errors
- [ ] Database operations working
- [ ] Forms saving data successfully

## 🎉 Success Indicators

When everything is working correctly, you should see:

- ✅ Development server running without errors
- ✅ Application loads at http://localhost:3000
- ✅ No "Missing Supabase environment variables" error
- ✅ Database connection successful in console
- ✅ Forms can create, read, update, and delete data
- ✅ Data persists between page refreshes

## 📞 Need Help?

If you're still having issues:

1. **Check the browser console** for specific error messages
2. **Verify your Supabase credentials** are correct
3. **Ensure database tables** are created
4. **Test with the provided scripts** (`setup-env.js`, `test-env.js`)

The application is designed to work with both Supabase and local fallback, so it should function even if there are connection issues.

