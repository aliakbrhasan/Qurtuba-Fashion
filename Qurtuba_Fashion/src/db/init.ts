import { supabase } from './client';
import { databaseService } from './database.service';
import { testDatabaseIntegration } from './test';

// Initialize database with schema and sync data
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Qurtuba Fashion Database...');
    
    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.warn('⚠️ Supabase connection failed, using local data only:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Sync data with Supabase (will fallback to local if Supabase fails)
    await databaseService.syncWithSupabase();
    
    // Run comprehensive database tests
    await testDatabaseIntegration();
    
    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('The app will continue with local data only.');
  }
}

// Run initialization when this module is imported
initializeDatabase();
