import Database from 'better-sqlite3';
import { join } from 'path';

class DatabaseService {
  constructor() {
    const dbPath = join(process.cwd(), 'data', 'settings.db');
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // Create servers table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ip TEXT NOT NULL,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger to update updated_at on row update
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_servers_timestamp 
      AFTER UPDATE ON servers
      BEGIN
        UPDATE servers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  }

  // Server CRUD operations
  /**
   * @param {import('../types/server').CreateServerData} serverData
   */
  createServer(serverData) {
    const { name, ip, user, password } = serverData;
    const stmt = this.db.prepare(`
      INSERT INTO servers (name, ip, user, password) 
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(name, ip, user, password);
  }

  getAllServers() {
    const stmt = this.db.prepare('SELECT * FROM servers ORDER BY created_at DESC');
    return stmt.all();
  }

  /**
   * @param {number} id
   */
  getServerById(id) {
    const stmt = this.db.prepare('SELECT * FROM servers WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * @param {number} id
   * @param {import('../types/server').CreateServerData} serverData
   */
  updateServer(id, serverData) {
    const { name, ip, user, password } = serverData;
    const stmt = this.db.prepare(`
      UPDATE servers 
      SET name = ?, ip = ?, user = ?, password = ?
      WHERE id = ?
    `);
    return stmt.run(name, ip, user, password, id);
  }

  /**
   * @param {number} id
   */
  deleteServer(id) {
    const stmt = this.db.prepare('DELETE FROM servers WHERE id = ?');
    return stmt.run(id);
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
/** @type {DatabaseService | null} */
let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

export default DatabaseService;

