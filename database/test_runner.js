const assert = require('assert');

console.log('🧪 Starting Verification Suite for TASK-001, TASK-002, and TASK-003...\n');

let passed = 0;
let total = 0;

function runTest(description, testFn) {
  total++;
  try {
    testFn();
    console.log(`✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ─── TASK-001: Bootstrap & Basic Configuration ──────────────────────────────
runTest('TASK-001: Express App & Config initialization', () => {
  const fs = require('fs');
  assert.ok(fs.existsSync('./apps/backend/src/app.ts'), 'app.ts should exist');
  assert.ok(fs.existsSync('./apps/backend/src/server.ts'), 'server.ts should exist');
  assert.ok(fs.existsSync('./database/init.sql'), 'init.sql should exist');
});

// ─── TASK-002: Authentication Logic Validation ──────────────────────────────
runTest('TASK-002: Authentication & Token Middleware Structure', () => {
  const fs = require('fs');
  assert.ok(fs.existsSync('./apps/backend/src/controllers/auth.controller.ts'), 'auth.controller.ts should exist');
  assert.ok(fs.existsSync('./apps/backend/src/middleware/auth.middleware.ts'), 'auth.middleware.ts should exist');
  
  const authController = fs.readFileSync('./apps/backend/src/controllers/auth.controller.ts', 'utf8');
  assert.ok(authController.includes('bcrypt.hash'), 'Auth controller should use bcrypt hashing');
  assert.ok(authController.includes('jwt.sign'), 'Auth controller should issue JWT tokens');
});

// ─── TASK-003: Medicine Database & Models Validation ───────────────────────
runTest('TASK-003: Medicine Database Migration & Seed SQL files', () => {
  const fs = require('fs');
  assert.ok(fs.existsSync('./apps/backend/prisma/schema.prisma'), 'Prisma schema should exist');
  assert.ok(fs.existsSync('./database/drugs_seed.sql'), 'drugs_seed.sql should exist');
  
  const seedContent = fs.readFileSync('./database/drugs_seed.sql', 'utf8');
  assert.ok(seedContent.includes('INSERT INTO master_pharmacy'), 'Seed file should contain INSERT into master_pharmacy');
  assert.ok(seedContent.includes('Paracetamol'), 'Seed file should include Paracetamol entry');
});

console.log(`\n📊 Verification Summary: ${passed}/${total} tests passed.`);

if (passed !== total) {
  process.exit(1);
}
