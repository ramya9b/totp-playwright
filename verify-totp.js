// Verify TOTP generation before running tests
const { TOTP } = require('otpauth');

// Check if TOTP_SECRET is available
if (!process.env.TOTP_SECRET) {
  console.error('❌ ERROR: TOTP_SECRET environment variable is not set!');
  process.exit(1);
}

try {
  // Create TOTP instance
  const totp = new TOTP({
    issuer: 'Microsoft',
    label: 'Microsoft Account',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: process.env.TOTP_SECRET
  });

  // Generate current code
  const code = totp.generate();
  
  console.log('✅ TOTP Generation Successful');
  console.log(`🔐 Current TOTP Code: ${code}`);
  console.log(`⏱️  Valid for: ~${30 - (Math.floor(Date.now() / 1000) % 30)} seconds`);
  console.log(`📊 Algorithm: SHA1, Digits: 6, Period: 30s`);
  console.log('');
  console.log('✅ TOTP library is working correctly');
  console.log('✅ Ready to run Playwright tests');
  
  process.exit(0);
} catch (error) {
  console.error('❌ TOTP Generation Failed:', error.message);
  process.exit(1);
}
