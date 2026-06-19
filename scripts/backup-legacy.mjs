import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: false });

const { Pool } = pg;

const DEST = path.join(
  "C:/Users/Enrique Arenas/Documents/Desarrollos - APP/Control de Instalaciones/Base de Datos - APP/Instalaciones - DP - S - AO"
);

const TABLES = ["configuracion", "obras", "personal", "subcontratos"];

// Credenciales desde variables de entorno (.env.local), nunca hardcodeadas.
const connectionString = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "").replace(/[?&]sslmode=[^&]*/g, "");
if (!connectionString) {
  console.error("Falta DIRECT_URL o DATABASE_URL en el entorno.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function toInsertSQL(tableName, rows) {
  if (!rows.length) return `-- Tabla ${tableName}: sin datos\n`;

  const cols = Object.keys(rows[0]);
  const header = `-- Backup tabla: ${tableName} (${rows.length} filas)\n`;
  const lines = rows.map((row) => {
    const values = cols.map((col) => {
      const val = row[col];
      if (val === null) return "NULL";
      if (typeof val === "number" || typeof val === "boolean") return String(val);
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `INSERT INTO "${tableName}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`;
  });

  return header + lines.join("\n") + "\n";
}

async function main() {
  const client = await pool.connect();
  const timestamp = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const table of TABLES) {
    try {
      const { rows } = await client.query(`SELECT * FROM "${table}"`);
      const sql = toInsertSQL(table, rows);
      const filename = path.join(DEST, `backup_${table}_${timestamp}.sql`);
      fs.writeFileSync(filename, sql, "utf8");
      console.log(`✓ ${table}: ${rows.length} filas → ${filename}`);
      results.push({ table, rows: rows.length, ok: true });
    } catch (err) {
      console.error(`✗ ${table}: ${err.message}`);
      results.push({ table, rows: 0, ok: false, error: err.message });
    }
  }

  client.release();
  await pool.end();

  console.log("\nBackup completado:");
  results.forEach((r) =>
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.table}: ${r.ok ? r.rows + " filas" : r.error}`)
  );
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
