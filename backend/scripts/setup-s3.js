require('dotenv').config();
const { checkOrCreateBucket } = require('../src/config/s3');

async function setup() {
  console.log('--- Roz S3 Setup Initializing ---');
  await checkOrCreateBucket();
  console.log('--- Setup Complete ---');
  process.exit(0);
}

setup();
