/**
 * Database Abstraction Layer
 * Supports SQLite (local dev) and Supabase (production)
 *
 * Usage:
 *   const { db } = require('./data');
 *   const users = await db.all('SELECT * FROM users');
 *   const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
 *   const result = await db.run('INSERT INTO users ...', [params]);
 */

const Database = require('better-sqlite3');
const path = require('path');
const { supabase, supabaseAdmin, isSupabaseConfigured } = require('./supabase');

// ─── SQLite Setup ───────────────────────────────────────────────
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'school.db')
  : path.join(__dirname, 'school.db');

let sqliteDb;

function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }
  return sqliteDb;
}

// ─── Supabase Query Helpers ─────────────────────────────────────

/**
 * Convert SQLite-style query to Supabase
 * Handles: SELECT, INSERT, UPDATE, DELETE
 */
function parseQuery(sql, params = []) {
  const normalized = sql.trim().replace(/\s+/g, ' ').toUpperCase();

  // Detect operation type
  if (normalized.startsWith('SELECT')) return { type: 'select', sql, params };
  if (normalized.startsWith('INSERT')) return { type: 'insert', sql, params };
  if (normalized.startsWith('UPDATE')) return { type: 'update', sql, params };
  if (normalized.startsWith('DELETE')) return { type: 'delete', sql, params };
  if (normalized.startsWith('CREATE')) return { type: 'ddl', sql, params };

  return { type: 'unknown', sql, params };
}

/**
 * Extract table name from SQL
 */
function extractTableName(sql) {
  // FROM table, INTO table, UPDATE table, DELETE FROM table
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  const intoMatch = sql.match(/INTO\s+(\w+)/i);
  const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
  const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);

  return fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1];
}

/**
 * Extract columns and values from INSERT
 */
function parseInsert(sql, params) {
  // INSERT INTO table (col1, col2, ...) VALUES (?, ?, ...)
  const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!match) return null;

  const table = match[1];
  const columns = match[2].split(',').map((c) => c.trim());
  const values = params;

  return { table, columns, values };
}

/**
 * Extract SET clause from UPDATE
 */
function parseUpdate(sql, params) {
  // UPDATE table SET col1 = ?, col2 = ? WHERE id = ?
  const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
  if (!match) return null;

  const table = match[1];
  const setClause = match[2];
  const whereClause = match[3];

  // Parse SET columns
  const setParts = setClause.split(',').map((p) => {
    const [col] = p.split('=');
    return col.trim();
  });

  // Parse WHERE params
  const whereParams = whereClause
    .split('AND')
    .map((p) => {
      const match = p.match(/(\w+)\s*(=|LIKE|IN|>|<)/i);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  return { table, setParts, whereClause, whereParams };
}

// ─── Unified Database Interface ─────────────────────────────────

const db = {
  /**
   * Get database instance (for backward compatibility)
   */
  getInstance() {
    if (isSupabaseConfigured) {
      return this; // Return our abstraction layer
    }
    return getSqliteDb();
  },

  /**
   * Run a query that returns multiple rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of rows
   */
  async all(sql, params = []) {
    if (!isSupabaseConfigured) {
      // SQLite — synchronous
      return getSqliteDb()
        .prepare(sql)
        .all(...params);
    }

    // Supabase — interpolate params into SQL for RPC
    let finalSql = sql;
    for (const param of params) {
      let replacement;
      if (param === null || param === undefined) {
        replacement = 'NULL';
      } else if (typeof param === 'number') {
        replacement = String(param);
      } else {
        // Escape single quotes for string parameters
        const escaped = String(param).replace(/'/g, "''");
        replacement = `'${escaped}'`;
      }
      finalSql = finalSql.replace('?', replacement);
    }

    const { data, error } = await supabase.rpc('execute_select', { query: finalSql });
    if (error) {
      console.error(
        '[DB] execute_select error:',
        error.message,
        'SQL:',
        finalSql.substring(0, 200)
      );
      throw error;
    }

    // RPC returns JSONB — parse if needed
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (data.error) {
        console.error('[DB] Query error:', data.error, 'SQL:', finalSql.substring(0, 200));
        throw new Error(data.error);
      }
      return [data];
    }
    return [];
  },

  /**
   * Run a query that returns a single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  async get(sql, params = []) {
    if (!isSupabaseConfigured) {
      // SQLite — synchronous
      return getSqliteDb()
        .prepare(sql)
        .get(...params);
    }

    // Supabase
    const rows = await this.all(sql, params);
    return rows?.[0] || null;
  },

  /**
   * Run a query that modifies data (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Result with lastInsertRowid and changes
   */
  async run(sql, params = []) {
    if (!isSupabaseConfigured) {
      // SQLite — synchronous
      const result = getSqliteDb()
        .prepare(sql)
        .run(...params);
      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes,
      };
    }

    // Supabase
    const { type } = parseQuery(sql, params);

    if (type === 'insert') {
      const parsed = parseInsert(sql, params);
      if (parsed) {
        const row = {};
        parsed.columns.forEach((col, i) => {
          row[col] = parsed.values[i];
        });

        const client = supabaseAdmin || supabase;
        const { data, error } = await client.from(parsed.table).insert(row).select();

        if (error) throw error;
        return {
          lastInsertRowid: data?.[0]?.id,
          changes: 1,
        };
      }
    }

    if (type === 'update') {
      const parsed = parseUpdate(sql, params);
      if (parsed) {
        const row = {};
        parsed.setParts.forEach((col, i) => {
          row[col] = params[i];
        });

        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from(parsed.table)
          .update(row)
          .match({ id: params[params.length - 1] }); // Assume last param is ID

        if (error) throw error;
        return { changes: 1 };
      }
    }

    if (type === 'delete') {
      const table = extractTableName(sql);
      const id = params[0]; // Assume first param is ID

      const client = supabaseAdmin || supabase;
      const { data, error } = await client.from(table).delete().match({ id });

      if (error) throw error;
      return { changes: 1 };
    }

    // Fallback: use raw SQL via RPC
    const { error } = await supabase.rpc('execute_sql', { query: sql, params });
    if (error) throw error;
    return { changes: 1 };
  },

  /**
   * Execute multiple statements in a transaction
   * @param {Function} fn - Function that receives db and runs queries
   * @returns {Promise<any>} Result of the function
   */
  async transaction(fn) {
    if (!isSupabaseConfigured) {
      // SQLite transaction
      return getSqliteDb().transaction(fn)(this);
    }

    // Supabase doesn't have native transactions — run sequentially
    return fn(this);
  },

  /**
   * Execute raw SQL (for migrations)
   * @param {string} sql - SQL statement(s)
   */
  async exec(sql) {
    if (!isSupabaseConfigured) {
      return getSqliteDb().exec(sql);
    }

    // Supabase — split by semicolons and execute each
    const statements = sql.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('execute_sql', { query: stmt });
        if (error) {
          console.error('Migration error:', error);
          throw error;
        }
      }
    }
  },

  /**
   * Check if table exists
   * @param {string} tableName
   * @returns {Promise<boolean>}
   */
  async tableExists(tableName) {
    if (!isSupabaseConfigured) {
      const result = getSqliteDb()
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName);
      return !!result;
    }

    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    return !error;
  },

  /**
   * Get row count for a table
   * @param {string} tableName
   * @returns {Promise<number>}
   */
  async count(tableName) {
    if (!isSupabaseConfigured) {
      const result = getSqliteDb().prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      return result.count;
    }

    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },
};

module.exports = { db };
