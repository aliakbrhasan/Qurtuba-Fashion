#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Qurtuba Fashion Environment Variables...\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Backing up to .env.backup');
  fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

// Create .env file with Supabase configuration template
const envContent = `# Supabase Configuration for Qurtuba Fashion
# Please replace these with your actual Supabase credentials

VITE_SUPABASE_URL=your-supabase-project-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Instructions:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project (or create a new one)
# 3. Go to Settings → API
# 4. Copy the Project URL and replace VITE_SUPABASE_URL above
# 5. Copy the anon public key and replace VITE_SUPABASE_ANON_KEY above
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update the .env file with your Supabase credentials:');
  console.log('   - VITE_SUPABASE_URL: Your Supabase project URL');
  console.log('   - VITE_SUPABASE_ANON_KEY: Your Supabase anon key');
  console.log('\n📋 Next steps:');
  console.log('1. Open .env file and add your Supabase credentials');
  console.log('2. Make sure your Supabase database tables are created');
  console.log('3. Run the database schema from complete-database-schema.sql');
  console.log('4. Start the development server with: npm run dev');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n🔧 Manual setup:');
  console.log('Create a .env file in the project root with:');
  console.log('VITE_SUPABASE_URL=your-supabase-project-url');
  console.log('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.log('Get your credentials from: https://supabase.com/dashboard → Your Project → Settings → API');
}


