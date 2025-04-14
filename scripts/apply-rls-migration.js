// Script to apply RLS policies to the series table
// Run this with: node scripts/apply-rls-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  console.log('Please add it to your .env.local file from the Supabase dashboard:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project: zxjxpmpzcsxjahfzcikg');
  console.log('3. Project Settings > API > service_role key');
  process.exit(1);
}

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Read the migration SQL file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250414060141_series_admin_access.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Split the SQL into separate statements
const statements = sql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`Applying ${statements.length} SQL statements to add RLS policies...`);

// Execute each statement separately
async function applyMigration() {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error('SQL:', statement);
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully.`);
      }
    } catch (err) {
      console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
      console.error('SQL:', statement);
    }
  }
  
  console.log('Migration completed.');
}

applyMigration().catch(err => {
  console.error('❌ Migration failed:', err.message);
}); 