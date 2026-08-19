import { getSummary } from './runner';
import { runMatchingUnitTests } from './unit_matching.test';
import { runClinicalSafetyTests } from './unit_clinical_safety.test';
import { runMiddlewareTests } from './unit_middleware.test';
import { runNotificationUnitTests } from './unit_notifications.test';
import { runIntegrationServicesTests } from './integration_services.test';
import { runAuthAndDbSafeTests } from './integration_auth_db_safe.test';
import { pool } from '../src/config/database';
import { redisClient } from '../src/config/redis';

async function main() {
  console.log('\n======================================================');
  console.log('🚀 MEDISYNC BACKEND AUTOMATED TEST SUITE');
  console.log('======================================================');

  try {
    await runMatchingUnitTests();
    await runClinicalSafetyTests();
    await runMiddlewareTests();
    await runNotificationUnitTests();
    await runIntegrationServicesTests();
    await runAuthAndDbSafeTests();
  } catch (e) {
    console.error('Test Runner Exception:', e);
  } finally {
    // Close DB pool & redis client cleanly
    try {
      await pool.end();
      redisClient.disconnect();
    } catch {}
  }

  const { totalTests, passedTests, failedTests } = getSummary();
  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS SUMMARY:`);
  console.log(`   Total Tests:  ${totalTests}`);
  console.log(`   \x1b[32mPassed:       ${passedTests}\x1b[0m`);
  if (failedTests > 0) {
    console.log(`   \x1b[31mFailed:       ${failedTests}\x1b[0m`);
  } else {
    console.log(`   \x1b[32mFailed:       0\x1b[0m`);
    console.log(`   \x1b[32m🎉 ALL BACKEND FUNCTIONS PASSED SUCCESSFULLY!\x1b[0m`);
  }
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
