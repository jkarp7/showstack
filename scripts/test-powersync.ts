#!/usr/bin/env npx ts-node
/**
 * PowerSync Connection Test Script
 *
 * Tests connectivity to PowerSync instance.
 * Run with: npm run test:powersync
 *
 * Prerequisites:
 * - .env file with POWERSYNC_URL
 * - PowerSync instance provisioned and connected to Supabase
 * - Sync rules deployed
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const POWERSYNC_URL = process.env.POWERSYNC_URL;

async function testPowerSyncConnection(): Promise<void> {
  console.log('\n🔍 Testing PowerSync Connection...\n');

  // Check environment variables
  if (!POWERSYNC_URL) {
    console.error('❌ POWERSYNC_URL not set in .env file');
    console.log('   Please copy .env.example to .env and add your PowerSync URL');
    console.log('   Get this from PowerSync Dashboard → Settings → Credentials');
    process.exit(1);
  }

  console.log(`📍 PowerSync URL: ${POWERSYNC_URL}`);

  try {
    // Test basic connectivity by checking the PowerSync endpoint
    const baseUrl = POWERSYNC_URL.replace(/\/$/, '');

    // PowerSync instances respond at their base URL
    // Try multiple endpoints to verify connectivity
    const endpoints = [
      '', // Base URL
      '/sync/stream', // Sync endpoint (will return 401 without auth)
    ];

    let connected = false;
    let statusCode = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        statusCode = response.status;

        // Any response (including 401, 403, 404) means the server is reachable
        // PowerSync will return 401/403 for unauthenticated requests
        if (response.status < 500) {
          connected = true;
          break;
        }
      } catch (e) {
        // Network error, try next endpoint
        continue;
      }
    }

    if (connected) {
      console.log('✅ Connected to PowerSync\n');

      if (statusCode === 401 || statusCode === 403) {
        console.log('🔒 Authentication required (expected behavior)');
        console.log('   PowerSync requires Supabase Auth tokens for data access');
      } else if (statusCode === 404) {
        console.log('ℹ️  Instance responding (sync endpoints require authentication)');
      }

      console.log('\n✅ PowerSync connection test complete!');
      console.log('\nStatus:');
      console.log('- PowerSync instance is reachable');
      console.log('- Full sync testing requires user authentication (Phase 3.3)');
      console.log('\nNext steps:');
      console.log('1. Verify sync rules are deployed in PowerSync Dashboard');
      console.log('2. Implement Supabase Auth (Phase 3.3)');
      console.log('3. Test full sync with authenticated user');
    } else {
      throw new Error('Unable to reach PowerSync instance');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error('\n❌ Connection failed: Unable to reach PowerSync instance');
    } else {
      console.error('\n❌ Connection failed:', error instanceof Error ? error.message : error);
    }

    console.log('\nTroubleshooting:');
    console.log(
      '1. Verify POWERSYNC_URL is correct (check PowerSync Dashboard → Settings → Credentials)',
    );
    console.log('2. Ensure your PowerSync instance is active');
    console.log('3. Check that PowerSync is connected to your Supabase database');
    console.log('4. Verify sync rules are deployed');
    console.log('5. Check your internet connection');
    process.exit(1);
  }

  console.log('');
}

// Run the test
testPowerSyncConnection().catch(console.error);
