import { initAdminConfig } from '../services/adminConfig';
import { seedSampleQuotes } from '../services/seedService';

async function main() {
  await initAdminConfig();
  const result = await seedSampleQuotes();
  console.log(`Seeded ${result.created} sample quotes:`);
  for (const q of result.quotes) {
    console.log(`  - ${q.quoteNumber} (${q.id})`);
  }
}

main().catch(console.error);
