#!/usr/bin/env node

// Script to verify service role key functionality
// Run with: node scripts/verify-service-role.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Get variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required variables are set
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined');
  console.error('This must be set in .env.local or .env file');
  process.exit(1);
}

console.log('✅ Environment variables found');

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Test RLS bypass ability
async function testServiceRole() {
  console.log('Testing service role key functionality...');
  
  try {
    // Test RLS bypass by trying to access the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);
    
    if (error) {
      console.error('❌ Error using service role key:', error.message);
      console.error('Service role key might be invalid or misconfigured');
      process.exit(1);
    }
    
    console.log('✅ Service role key is working correctly!');
    console.log(`Successfully retrieved ${data?.length || 0} profiles`);
    
    // Now test series table specifically
    console.log('Testing series table access...');
    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('id, name')
      .limit(1);
    
    if (seriesError) {
      console.error('❌ Error accessing series table:', seriesError.message);
      console.error('You may need to run the SQL script to fix RLS policies');
      process.exit(1);
    }
    
    console.log('✅ Series table access works with service role key');
    console.log(`Successfully retrieved ${seriesData?.length || 0} series`);
    
    // Optional: Try an insert operation
    try {
      const testName = `Test Series ${new Date().toISOString()}`;
      const testSlug = `test-series-${Date.now()}`;
      
      console.log('Testing series insert operation...');
      const { data: insertData, error: insertError } = await supabase
        .from('series')
        .insert({
          name: testName,
          slug: testSlug,
          description: 'Test series for verification',
          status: 'approved',
          created_by: 'system',
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting into series table:', insertError.message);
        console.error('You may need to run the SQL script to fix RLS policies');
      } else {
        console.log('✅ Successfully inserted test series!');
        console.log('Cleaning up test series...');
        
        // Delete the test series
        await supabase
          .from('series')
          .delete()
          .eq('slug', testSlug);
          
        console.log('✅ Test series deleted');
      }
    } catch (err) {
      console.error('❌ Error during insert test:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testServiceRole(); 