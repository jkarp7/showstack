#!/usr/bin/env npx ts-node
/**
 * Supabase Connection Test Script
 *
 * Tests connectivity to Supabase and verifies schema deployment.
 * Run with: npm run test:supabase
 *
 * Prerequisites:
 * - .env file with SUPABASE_URL and SUPABASE_ANON_KEY
 * - Schema deployed via Supabase SQL Editor
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Expected tables from our schema
const EXPECTED_TABLES = [
  'projects',
  'fixtures',
  'dimmer_racks',
  'dimmer_rack_modules',
  'pd_racks',
  'phase_distribution_templates',
  'infrastructure_equipment',
  'user_preferences',
  'shop_order_projects',
  'shop_order_sections',
  'shop_order_items',
  'shop_order_revisions',
  'shop_order_notes',
  'shop_order_note_templates',
  'page_layout_templates',
  'page_layout_elements',
  'paperwork_templates',
];

async function testSupabaseConnection(): Promise<void> {
  console.log('\n🔍 Testing Supabase Connection...\n');

  // Check environment variables
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not set in .env file');
    console.log('   Please copy .env.example to .env and add your Supabase URL');
    process.exit(1);
  }

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY not set in .env file');
    console.log('   Please copy .env.example to .env and add your Supabase anon key');
    process.exit(1);
  }

  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

  try {
    // Test basic connectivity by querying the health endpoint
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!healthResponse.ok) {
      throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }

    console.log('✅ Connected to Supabase\n');

    // Check schema by querying table information
    console.log('📋 Checking schema deployment...\n');

    const tablesFound: string[] = [];
    const tablesMissing: string[] = [];

    for (const table of EXPECTED_TABLES) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?limit=0`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Prefer: 'count=exact',
            },
          }
        );

        if (response.ok) {
          tablesFound.push(table);
          console.log(`   ✅ ${table}`);
        } else if (response.status === 404) {
          tablesMissing.push(table);
          console.log(`   ❌ ${table} (not found)`);
        } else {
          // Table exists but RLS may block access (that's fine)
          tablesFound.push(table);
          console.log(`   ✅ ${table} (RLS active)`);
        }
      } catch {
        tablesMissing.push(table);
        console.log(`   ❌ ${table} (error)`);
      }
    }

    console.log('');

    if (tablesMissing.length === 0) {
      console.log(`✅ Schema verified (${tablesFound.length} tables found)`);
    } else if (tablesFound.length > 0) {
      console.log(`⚠️  Partial schema: ${tablesFound.length}/${EXPECTED_TABLES.length} tables found`);
      console.log(`   Missing: ${tablesMissing.join(', ')}`);
      console.log('   Run migrations in order: 001_initial_schema.sql, 002_indexes.sql, 003_rls_policies.sql');
    } else {
      console.log('❌ Schema not deployed');
      console.log('   Run migrations via Supabase SQL Editor:');
      console.log('   1. supabase/migrations/001_initial_schema.sql');
      console.log('   2. supabase/migrations/002_indexes.sql');
      console.log('   3. supabase/migrations/003_rls_policies.sql');
    }

    // Test RLS by checking if anon user can see data
    console.log('\n🔒 Checking RLS policies...');

    const projectsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (projectsResponse.status === 200) {
      const data = await projectsResponse.json();
      if (data.length === 0) {
        console.log('✅ RLS policies active (anonymous user sees no data)');
      } else {
        console.log('⚠️  RLS may be disabled (anonymous user can see data)');
        console.log('   Run 003_rls_policies.sql to enable RLS');
      }
    } else {
      console.log('✅ RLS policies active');
    }

    console.log('\n✅ Supabase connection test complete!\n');
  } catch (error) {
    console.error('\n❌ Connection failed:', error instanceof Error ? error.message : error);
    console.log('\nTroubleshooting:');
    console.log('1. Verify SUPABASE_URL is correct (check Supabase Dashboard → Settings → API)');
    console.log('2. Verify SUPABASE_ANON_KEY is correct');
    console.log('3. Ensure your Supabase project is active');
    console.log('4. Check your internet connection');
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);
