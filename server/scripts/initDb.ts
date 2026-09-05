import { getDatabase } from '../db';
import { seedDatabase } from './seedDb';
import { isMasterAdminConfigured } from '../auth';

console.log('====================================================');
console.log(' POLAD CHARKHESH - DATABASE INITIALIZATION UTILITY  ');
console.log('====================================================');

const db = getDatabase();
console.log('✓ SQLite database connected and pragmas verified.');
console.log('✓ Tables and indexes ensured.');

const seedResult = seedDatabase(false);
console.log(`✓ Products database status: ${seedResult.productsSeeded} products active.`);

const adminConfigured = isMasterAdminConfigured();
if (adminConfigured) {
  console.log('✓ Master administrator account is provisioned.');
} else {
  console.log('ℹ Master administrator is NOT yet provisioned.');
  console.log('  Provision via the secure web interface at /#admin or via the setup API.');
}

console.log('====================================================');
console.log(' Initialization complete.');
console.log('====================================================');
