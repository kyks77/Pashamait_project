require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb } = require('./database');

(async () => {
  const db = await initDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@novo.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role, subscription_status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run(uuidv4(), adminEmail.toLowerCase(), hash, 'Admin');
    console.log(`Default admin created: ${adminEmail}`);
    console.log('Change the password after first login.');
  } else {
    console.log('Database already initialized.');
  }
})();
