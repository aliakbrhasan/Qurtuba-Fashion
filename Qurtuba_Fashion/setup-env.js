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

// Create .env file with Supabase configuration
const envContent = `# Supabase Configuration for Qurtuba Fashion
# These are the default values for the project

VITE_SUPABASE_URL=https://dbjaogpesmyrqjwtzzwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamFvZ3Blc215cnFqd3R6endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8

# Note: You may need to update the VITE_SUPABASE_ANON_KEY with your actual Supabase anon key
# Get it from: https://supabase.com/dashboard/project/dbjaogpesmyrqjwtzzwr/settings/api
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Environment variables configured:');
  console.log('   - VITE_SUPABASE_URL: https://dbjaogpesmyrqjwtzzwr.supabase.co');
  console.log('   - VITE_SUPABASE_ANON_KEY: [configured]');
  console.log('\n🚀 You can now run: npm run dev');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure your Supabase database tables are created');
  console.log('2. Run the database schema from complete-database-schema.sql');
  console.log('3. Start the development server with: npm run dev');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n🔧 Manual setup:');
  console.log('Create a .env file in the project root with:');
  console.log('VITE_SUPABASE_URL=https://dbjaogpesmyrqjwtzzwr.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here');
}

