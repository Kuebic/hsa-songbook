#!/usr/bin/env node

/**
 * Test Supabase Connection
 * 
 * This script tests if your Supabase configuration is correct.
 * Run: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test 1: Check if we can connect
console.log('\n📋 Test 1: Testing basic connection...')
try {
  const { data, error } = await supabase
    .from('songs')
    .select('count')
    .limit(1)
  
  if (error) {
    console.error('❌ Connection failed:', error.message)
    if (error.hint) {
      console.error('💡 Hint:', error.hint)
    }
    
    console.log('\n🔧 To fix this:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project (cjegmbpyjunitoqqxjbz)')
    console.log('3. Go to Settings -> API')
    console.log('4. Copy the "anon public" key (NOT the service_role key)')
    console.log('5. Update VITE_SUPABASE_PUBLISHABLE_KEY in your .env file')
    console.log('6. The key should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
  } else {
    console.log('✅ Connection successful!')
    console.log('Data:', data)
  }
} catch (err) {
  console.error('❌ Unexpected error:', err)
}

// Test 2: Check auth configuration
console.log('\n📋 Test 2: Testing auth configuration...')
try {
  const { data: { session } } = await supabase.auth.getSession()
  console.log('✅ Auth configured correctly')
  console.log('Current session:', session ? 'Logged in' : 'Not logged in')
} catch (err) {
  console.error('❌ Auth error:', err)
}

// Test 3: List tables (if we have access)
console.log('\n📋 Test 3: Checking table access...')
const tables = ['songs', 'arrangements', 'users', 'setlists']
for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: accessible (${count || 0} rows)`)
    }
  } catch (err) {
    console.log(`❌ ${table}: ${err.message}`)
  }
}

process.exit(0)