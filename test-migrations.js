// Test script to verify database migrations
import { createClient } from '@supabase/supabase-js';

// Local Supabase connection
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrations() {
  console.log('Testing database migrations...\n');
  
  try {
    // Test 1: Check permissions table
    console.log('1. Testing permissions table...');
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .limit(5);
    
    if (permError) throw permError;
    console.log(`   ✅ Permissions table exists - ${permissions.length} records found`);
    
    // Test 2: Check custom_roles table
    console.log('2. Testing custom_roles table...');
    const { data: roles, error: roleError } = await supabase
      .from('custom_roles')
      .select('*')
      .limit(5);
    
    if (roleError) throw roleError;
    console.log(`   ✅ Custom roles table exists - ${roles.length} records found`);
    
    // Test 3: Check permission_groups table
    console.log('3. Testing permission_groups table...');
    const { data: groups, error: groupError } = await supabase
      .from('permission_groups')
      .select('*')
      .limit(5);
    
    if (groupError) throw groupError;
    console.log(`   ✅ Permission groups table exists - ${groups.length} records found`);
    
    // Test 4: Check user_permissions table
    console.log('4. Testing user_permissions table...');
    const { data: userPerms, error: userPermError } = await supabase
      .from('user_permissions')
      .select('*')
      .limit(5);
    
    if (userPermError) throw userPermError;
    console.log(`   ✅ User permissions table exists - ${userPerms.length} records found`);
    
    // Test 5: Test RPC function - get_moderation_queue
    console.log('5. Testing RPC functions...');
    const { data: modQueue, error: modError } = await supabase
      .rpc('get_moderation_queue', { filter_status: 'pending' });
    
    if (modError) throw modError;
    console.log(`   ✅ get_moderation_queue function works - ${modQueue?.length || 0} items returned`);
    
    // Test 6: Test search function
    console.log('6. Testing search_songs function...');
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_songs', { search_query: 'Lord', limit_count: 5 });
    
    if (searchError) throw searchError;
    console.log(`   ✅ search_songs function works - ${searchResults?.length || 0} results found`);
    
    // Test 7: Test moderation stats
    console.log('7. Testing get_moderation_stats function...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_moderation_stats');
    
    if (statsError) throw statsError;
    console.log(`   ✅ get_moderation_stats function works`);
    if (stats && stats[0]) {
      console.log(`      - Pending songs: ${stats[0].pending_songs}`);
      console.log(`      - Pending arrangements: ${stats[0].pending_arrangements}`);
      console.log(`      - Pending reports: ${stats[0].pending_reports}`);
    }
    
    console.log('\n✅ All migration tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMigrations();