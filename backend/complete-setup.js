#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' StudyConnect Backend - Complete Setup & Test');
console.log('===============================================');

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n ${description}...`);
    console.log(`   Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(` ${description} completed successfully`);
        resolve();
      } else {
        console.log(` ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
    
    child.on('error', (err) => {
      console.log(` ${description} failed: ${err.message}`);
      reject(err);
    });
  });
}

async function checkPrerequisites() {
  console.log('\n🔍 Checking Prerequisites...');
  
  try {
    await runCommand('node', ['--version'], 'Checking Node.js version');
    await runCommand('npm', ['--version'], 'Checking npm version');
    console.log(' All prerequisites met');
  } catch (err) {
    console.log(' Prerequisites check failed');
    throw err;
  }
}

async function setup() {
  try {
    console.log('\n Starting StudyConnect Backend Setup');
    
    // Check prerequisites
    await checkPrerequisites();
    
    // Install dependencies
    await runCommand('npm', ['install'], 'Installing dependencies');
    
    // Verify TypeScript compilation
    console.log('\n Verifying TypeScript configuration...');
    if (fs.existsSync('tsconfig.json')) {
      console.log(' TypeScript configuration found');
    } else {
      console.log(' TypeScript configuration missing');
    }
    
    // Verify Jest configuration
    console.log('\n Verifying Jest configuration...');
    if (fs.existsSync('jest.config.js')) {
      console.log(' Jest configuration found');
    } else {
      console.log(' Jest configuration missing');
    }
    
    // Check test files
    console.log('\n Checking test files...');
    const testDir = path.join(__dirname, 'src', '__tests__');
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));
      console.log(` Found ${testFiles.length} test files:`);
      testFiles.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log(' Test directory not found');
    }
    
    // Run tests
    await runCommand('npm', ['test'], 'Running all tests');
    
    // Generate coverage report
    console.log('\n Generating coverage report...');
    await runCommand('npm', ['run', 'test:coverage'], 'Generating test coverage');
    
    console.log('\n Setup and Testing Complete!');
    console.log('===============================');
    console.log(' Dependencies installed');
    console.log(' All tests passing');
    console.log(' Coverage report generated');
    console.log('\nView coverage report: open coverage/lcov-report/index.html');
    console.log(' Start development server: npm run dev');
    
  } catch (error) {
    console.log('\n Setup failed:', error.message);
    console.log('\n Troubleshooting:');
    console.log('1. Check that Node.js and npm are installed');
    console.log('2. Ensure you are in the correct directory');
    console.log('3. Try running commands manually:');
    console.log('   npm install');
    console.log('   npm test');
    console.log('4. See SETUP_AND_TESTING_GUIDE.md for detailed instructions');
    process.exit(1);
  }
}

setup();
