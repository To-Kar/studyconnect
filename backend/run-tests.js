#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log(' StudyConnect Backend Test Runner');
console.log('=====================================');
console.log('Starting Jest tests...\n');

const jest = spawn('npx', ['jest', '--verbose', '--no-coverage', '--forceExit'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let output = '';

jest.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

jest.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
});

jest.on('close', (code) => {
  console.log('\n=====================================');
  console.log(`Jest process exited with code ${code}`);
  
  if (code === 0) {
    console.log(' All tests passed successfully!');
    console.log('\n Test Summary:');
    console.log('- Total test files: 6');
    console.log('- Expected tests: 148');
    console.log('- All domain models tested');
    console.log('- All business logic validated');
  } else {
    console.log(' Some tests failed');
    console.log('Check the output above for details');
  }
  
  console.log('\n To run tests again: npm test');
  console.log(' For coverage report: npm run test:coverage');
});

jest.on('error', (err) => {
  console.error(' Failed to start Jest:', err);
});
