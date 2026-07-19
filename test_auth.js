const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('🧪 Starting MediSync Auth Endpoint Tests...\n');

  // Test 1: Health Check Connection
  try {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200, 'Health check should return status 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Health check body should indicate success');
    console.log('✅ Test 1 Passed: Connected to Backend successfully (Health check operational)');
  } catch (err) {
    console.error('❌ Test 1 Failed: Cannot connect to Backend!', err.message);
    process.exit(1);
  }

  // Test 2: Invalid Login (Unauthorised check)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@medisync.ai', password: 'wrongpassword' }),
    });
    assert.strictEqual(res.status, 401, 'Invalid login should return status 401');
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Invalid login response body success should be false');
    console.log('✅ Test 2 Passed: Invalid login rejected with status 401 (Unauthorised correctly handled)');
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    process.exit(1);
  }

  // Test 3: Successful Login with Seed User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@medisync.ai', password: 'password123' }),
    });
    assert.strictEqual(res.status, 200, 'Seed login should return status 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Seed login response body success should be true');
    assert.ok(data.data.accessToken, 'Should return accessToken');
    assert.strictEqual(data.data.user.email, 'patient@medisync.ai', 'Should return user profile');
    console.log('✅ Test 3 Passed: Seed user login successful with status 200');
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    process.exit(1);
  }

  // Test 4: Register a new account
  const uniqueEmail = `testuser_${Date.now()}@medisync.ai`;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Suite User',
        email: uniqueEmail,
        password: 'Password@1234',
        role: 'DOCTOR'
      }),
    });
    assert.strictEqual(res.status, 201, 'User registration should return status 201');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'User registration response body success should be true');
    assert.strictEqual(data.data.user.email, uniqueEmail, 'Registered email should match input');
    assert.strictEqual(data.data.user.role, 'DOCTOR', 'User role should be set to DOCTOR');
    console.log(`✅ Test 4 Passed: Registered a new user (${uniqueEmail}) successfully with status 201`);
  } catch (err) {
    console.error('❌ Test 4 Failed:', err.message);
    process.exit(1);
  }

  // Test 5: Register duplicate email
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate User',
        email: uniqueEmail,
        password: 'Password@1234',
        role: 'PATIENT'
      }),
    });
    assert.strictEqual(res.status, 409, 'Duplicate registration should return status 409 Conflict');
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Duplicate registration response body success should be false');
    console.log('✅ Test 5 Passed: Duplicate registration correctly rejected with status 409');
  } catch (err) {
    console.error('❌ Test 5 Failed:', err.message);
    process.exit(1);
  }

  // Test 6: End-to-end Triage Chat (connects Node -> Express Backend -> FastAPI AI Service)
  try {
    // 1. Get auth token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@medisync.ai', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;

    // 2. Call Triage Chat
    const res = await fetch(`${BASE_URL}/api/triage/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        symptoms: ['fever', 'cough', 'headache'],
        additionalNotes: 'Slightly higher temperature in the evening.'
      }),
    });
    assert.strictEqual(res.status, 200, 'Triage chat should return status 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Triage chat response body success should be true');
    assert.ok(data.data.response, 'Should contain AI response text');
    assert.strictEqual(data.data.urgencyLevel, 'LOW', 'Should match AI Service urgency response');
    console.log('✅ Test 6 Passed: End-to-end Triage chat successfully queried AI Service on port 8000!');
  } catch (err) {
    console.error('❌ Test 6 Failed (Make sure uvicorn is running on http://127.0.0.1:8000!):', err.message);
    process.exit(1);
  }

  console.log('\n🎉 All Auth Endpoints and Frontend-Backend connections are working perfectly!');
}

runTests();
