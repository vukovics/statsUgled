// Script to migrate SQLite data to Postgres
// Run this locally: node migrate-to-postgres.js

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

async function migrate() {
  // Connect to SQLite
  const sqliteDb = new Database(path.join(__dirname, 'database', 'sales.db'));

  // Connect to Postgres (set your connection string)
  const pgClient = new Client({
    connectionString: process.env.POSTGRES_URL || 'YOUR_POSTGRES_CONNECTION_STRING'
  });

  await pgClient.connect();

  console.log('Connected to databases...');

  try {
    // Create table in Postgres
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        import_id TEXT,
        import_timestamp TIMESTAMP,
        sifra_art TEXT,
        naziv_art TEXT,
        kolicina DECIMAL(10,2),
        cena DECIMAL(10,2),
        datum TEXT,
        datum_az TEXT,
        revenue DECIMAL(10,2)
      );
    `);

    console.log('Table created...');

    // Get all data from SQLite
    const sales = sqliteDb.prepare('SELECT * FROM sales').all();
    console.log(`Found ${sales.length} records to migrate...`);

    // Insert in batches
    const batchSize = 1000;
    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);

      const values = batch.map((sale, idx) => {
        const baseIdx = i * 9;
        return `($${baseIdx + idx * 9 + 1}, $${baseIdx + idx * 9 + 2}, $${baseIdx + idx * 9 + 3}, $${baseIdx + idx * 9 + 4}, $${baseIdx + idx * 9 + 5}, $${baseIdx + idx * 9 + 6}, $${baseIdx + idx * 9 + 7}, $${baseIdx + idx * 9 + 8}, $${baseIdx + idx * 9 + 9})`;
      }).join(',');

      const params = batch.flatMap(sale => [
        sale.import_id,
        sale.import_timestamp,
        sale.sifra_art,
        sale.naziv_art,
        sale.kolicina,
        sale.cena,
        sale.datum,
        sale.datum_az,
        sale.revenue
      ]);

      await pgClient.query(`
        INSERT INTO sales (import_id, import_timestamp, sifra_art, naziv_art, kolicina, cena, datum, datum_az, revenue)
        VALUES ${values}
      `, params);

      console.log(`Migrated ${Math.min(i + batchSize, sales.length)} / ${sales.length} records...`);
    }

    console.log('✅ Migration complete!');

    // Create indexes for better performance
    await pgClient.query('CREATE INDEX IF NOT EXISTS idx_sales_datum ON sales(datum);');
    await pgClient.query('CREATE INDEX IF NOT EXISTS idx_sales_sifra_art ON sales(sifra_art);');

    console.log('✅ Indexes created!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

migrate();
