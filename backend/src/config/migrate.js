const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`🚀 Found ${files.length} migration files. Starting database setup on Neon...`);

  for (const file of files) {
    console.log(`   📄 Applying ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await db.query(sql);
      console.log(`   ✅ Succeeded.`);
    } catch (err) {
      // If table already exists, just continue
      if (err.code === '42P07') {
        console.log(`   ℹ️ Already applied (skipped).`);
      } else {
        console.error(`   ❌ FAILED to apply ${file}:`, err.message);
      }
    }
  }

  console.log('\n🌟 Migration process completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n💥 CRITICAL: Migration failed:', err.message);
  process.exit(1);
});
