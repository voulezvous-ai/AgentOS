// vercel-build-check.js
// Script to verify build environment for Vercel deployments

console.log('🔍 Vercel Build Environment Check');
console.log('=================================');

// Check Node.js version
console.log(`Node version: ${process.version}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Platform: ${process.platform}`);

// Check environment variables
console.log('\n📋 Environment Variables:');
const envVars = [
  'VERCEL', 
  'VERCEL_ENV', 
  'VERCEL_URL', 
  'VERCEL_REGION',
  'NODE_ENV',
  'VITE_API_URL'
];

envVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] || 'not set'}`);
});

// Check file system access
console.log('\n📁 File System Check:');
const fs = require('fs');
try {
  const files = fs.readdirSync('.');
  console.log(`Current directory contains ${files.length} files/directories`);
  console.log(`First 5 entries: ${files.slice(0, 5).join(', ')}`);
} catch (error) {
  console.error(`Error reading directory: ${error.message}`);
}

// Check package.json
console.log('\n📦 Package.json Check:');
try {
  const packageJson = require('./package.json');
  console.log(`Name: ${packageJson.name}`);
  console.log(`Version: ${packageJson.version}`);
  console.log(`Build script: ${packageJson.scripts.build}`);
  console.log(`Vercel build script: ${packageJson.scripts['build:vercel'] || 'not defined'}`);
} catch (error) {
  console.error(`Error reading package.json: ${error.message}`);
}

console.log('\n✅ Build environment check complete');
