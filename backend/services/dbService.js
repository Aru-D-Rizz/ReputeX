// ReputeX Database Service (Supabase PostgreSQL Integration)
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    const sanitizedUrl = process.env.DATABASE_URL.replace(/[\?&]sslmode=[^&]+/i, '');
    pool = new Pool({
      connectionString: sanitizedUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[DB] Unexpected error on idle database client:', err.message);
    });
  }
  return pool;
}

/**
 * Save a community scam/threat report
 */
async function saveThreatReport({ address, chain = 'ethereum', category, description, reporterIp }) {
  const p = getPool();
  if (!p) return { success: false, reason: 'Database not configured' };

  try {
    const res = await p.query(
      `INSERT INTO public.reports (address, chain, category, description, reporter_ip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, address, chain, category, created_at`,
      [address.toLowerCase(), chain.toLowerCase(), category, description || '', reporterIp || null]
    );
    return { success: true, report: res.rows[0] };
  } catch (err) {
    console.error('[DB] Failed to save threat report:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get threat report count and recent reports for an address
 */
async function getThreatReportsForAddress(address) {
  const p = getPool();
  if (!p || !address) return { count: 0, reports: [] };

  try {
    const res = await p.query(
      `SELECT id, chain, category, description, created_at
       FROM public.reports
       WHERE LOWER(address) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT 10`,
      [address.toLowerCase()]
    );
    return { count: res.rows.length, reports: res.rows };
  } catch (err) {
    console.warn('[DB] Failed to fetch threat reports:', err.message);
    return { count: 0, reports: [] };
  }
}

/**
 * Add an address to user watchlist
 */
async function addToWatchlist({ clientId, address, chain = 'ethereum', label = '', lastScore = null }) {
  const p = getPool();
  if (!p) return { success: false, reason: 'Database not configured' };

  try {
    const res = await p.query(
      `INSERT INTO public.watchlists (client_id, address, chain, label, last_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, client_id, address, chain, label, last_score, created_at`,
      [clientId, address.toLowerCase(), chain.toLowerCase(), label, lastScore]
    );
    return { success: true, item: res.rows[0] };
  } catch (err) {
    console.error('[DB] Failed to add to watchlist:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get all watchlisted addresses for a client
 */
async function getWatchlist(clientId) {
  const p = getPool();
  if (!p || !clientId) return [];

  try {
    const res = await p.query(
      `SELECT id, address, chain, label, last_score, created_at
       FROM public.watchlists
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [clientId]
    );
    return res.rows;
  } catch (err) {
    console.warn('[DB] Failed to fetch watchlist:', err.message);
    return [];
  }
}

/**
 * Remove an item from watchlist
 */
async function removeFromWatchlist(id, clientId) {
  const p = getPool();
  if (!p) return { success: false };

  try {
    await p.query(
      `DELETE FROM public.watchlists WHERE id = $1 AND client_id = $2`,
      [id, clientId]
    );
    return { success: true };
  } catch (err) {
    console.warn('[DB] Failed to remove from watchlist:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  saveThreatReport,
  getThreatReportsForAddress,
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
};
