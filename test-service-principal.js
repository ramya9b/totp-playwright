/**
 * Quick test to verify Service Principal credentials are loaded
 * Run: node test-service-principal.js
 */

require('dotenv').config();

console.log('\n=== Service Principal Credentials Check ===\n');

const checks = {
  'D365_URL': process.env.D365_URL,
  'AZURE_TENANT_ID': process.env.AZURE_TENANT_ID,
  'AZURE_CLIENT_ID': process.env.AZURE_CLIENT_ID,
  'AZURE_CLIENT_SECRET': process.env.AZURE_CLIENT_SECRET ? '***' + process.env.AZURE_CLIENT_SECRET.slice(-4) : undefined,
};

let allPresent = true;

for (const [key, value] of Object.entries(checks)) {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allPresent = false;
  }
}

console.log('\n=== Result ===\n');

if (allPresent) {
  console.log('✅ All Service Principal credentials are configured!');
  console.log('🚀 Service Principal authentication will be used');
  console.log('⚡ Login flow will be SKIPPED');
} else {
  console.log('⚠️  Some Service Principal credentials are missing');
  console.log('🔐 TOTP authentication will be used instead');
  console.log('📝 Add missing credentials to .env file or Azure DevOps Variable Group');
}

console.log('');
