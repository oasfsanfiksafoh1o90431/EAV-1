// Backend server with MySQL database
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eavgomez_clinic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create database if not exists, then create pool
async function createDatabaseIfNotExists() {
  const tempPool = mysql.createPool({
    ...DB_CONFIG,
    database: undefined, // Connect without database
  });
  
  try {
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${DB_CONFIG.database}' ready`);
  } finally {
    await tempPool.end();
  }
}

// MySQL connection pool
const pool = mysql.createPool(DB_CONFIG);

// Initialize database tables
async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    // Patients table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age VARCHAR(20),
        gender VARCHAR(20),
        contact VARCHAR(50),
        blood_group VARCHAR(10),
        address TEXT,
        notes TEXT,
        maternal_data JSON,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_name (name),
        INDEX idx_contact (contact),
        INDEX idx_created (created_at)
      )
    `);

    // Nurses/Admins table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS nurses (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(512) NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        role ENUM('admin') NOT NULL DEFAULT 'admin',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        archived_at BIGINT NULL,
        INDEX idx_email (email),
        INDEX idx_archived (archived)
      )
    `);

    // Audit logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role ENUM('superadmin', 'admin') NOT NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        entity_name VARCHAR(255) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        INDEX idx_timestamp (timestamp),
        INDEX idx_user (user_id),
        INDEX idx_entity (entity_type, entity_id)
      )
    `);

    // Settings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(64) PRIMARY KEY,
        clinic_name VARCHAR(255),
        clinic_address TEXT,
        clinic_phone VARCHAR(50),
        clinic_email VARCHAR(255),
        backup_enabled BOOLEAN DEFAULT TRUE,
        backup_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
        session_timeout BIGINT DEFAULT 28800000,
        max_login_attempts INT DEFAULT 5,
        lockout_duration BIGINT DEFAULT 900000,
        updated_at BIGINT NOT NULL,
        updated_by VARCHAR(255)
      )
    `);

    // Insert default settings if empty
    const [settings] = await conn.query('SELECT COUNT(*) as count FROM settings');
    if (settings[0].count === 0) {
      await conn.query(`
        INSERT INTO settings (id, clinic_name, backup_enabled, backup_frequency, session_timeout, max_login_attempts, lockout_duration, updated_at, updated_by)
        VALUES ('main', 'E.A.V. GOMEZ LYING IN CLINIC', TRUE, 'daily', 28800000, 5, 900000, ?, 'system')
      `, [Date.now()]);
    }

    console.log('Database initialized successfully');
  } finally {
    conn.release();
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Patients API
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

app.post('/api/patients', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const patient = req.body;
    const now = Date.now();
    const id = patient.id || `patient_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    await conn.query(
      `INSERT INTO patients (id, name, age, gender, contact, blood_group, address, notes, maternal_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patient.name, patient.age, patient.gender, patient.contact, patient.bloodGroup, patient.address, patient.notes, JSON.stringify(patient.maternalData), now, now]
    );
    
    await conn.commit();
    res.status(201).json({ id, ...patient, createdAt: now, updatedAt: now });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  } finally {
    conn.release();
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = req.body;
    const now = Date.now();
    
    await pool.query(
      `UPDATE patients SET name=?, age=?, gender=?, contact=?, blood_group=?, address=?, notes=?, maternal_data=?, updated_at=? WHERE id=?`,
      [patient.name, patient.age, patient.gender, patient.contact, patient.bloodGroup, patient.address, patient.notes, JSON.stringify(patient.maternalData), now, req.params.id]
    );
    
    res.json({ id: req.params.id, ...patient, updatedAt: now });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Search patients
app.get('/api/patients/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const [rows] = await pool.query(
      `SELECT * FROM patients WHERE name LIKE ? OR contact LIKE ? OR blood_group LIKE ? OR address LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(maternal_data, '$.caseNo')) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(maternal_data, '$.philHealthNo')) LIKE ? ORDER BY updated_at DESC`,
      [query, query, query, query, query, query]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error searching patients:', err);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Filter by risk
app.get('/api/patients/filter/risk/:hasRisk', async (req, res) => {
  try {
    const hasRisk = req.params.hasRisk === 'true';
    const [rows] = await pool.query(
      `SELECT * FROM patients WHERE 
        (JSON_EXTRACT(maternal_data, '$.riskCodeA') = true OR JSON_EXTRACT(maternal_data, '$.riskCodeB') = true OR JSON_EXTRACT(maternal_data, '$.riskCodeC') = true OR JSON_EXTRACT(maternal_data, '$.riskCodeD') = true OR JSON_EXTRACT(maternal_data, '$.riskCodeE') = true) = ?
       ORDER BY updated_at DESC`,
      [hasRisk]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error filtering patients:', err);
    res.status(500).json({ error: 'Failed to filter patients' });
  }
});

// Nurses API
app.get('/api/nurses', async (req, res) => {
  try {
    const archived = req.query.archived === 'true';
    const [rows] = await pool.query('SELECT * FROM nurses WHERE archived = ? ORDER BY created_at DESC', [archived]);
    // Don't send password hashes to frontend
    const safeRows = rows.map(n => {
      const { password_hash, password_salt, ...rest } = n;
      return rest;
    });
    res.json(safeRows);
  } catch (err) {
    console.error('Error fetching nurses:', err);
    res.status(500).json({ error: 'Failed to fetch nurses' });
  }
});

app.get('/api/nurses/:email', async (req, res) => {
  try {
    // Case-insensitive email lookup
    const includeAuth = req.query.auth === 'true';
    const selectFields = includeAuth ? '*' : 'id, email, first_name, last_name, name, role, created_at, updated_at, archived, archived_at';
    const [rows] = await pool.query(`SELECT ${selectFields} FROM nurses WHERE LOWER(email) = LOWER(?)`, [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: 'Nurse not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching nurse:', err);
    res.status(500).json({ error: 'Failed to fetch nurse' });
  }
});

app.post('/api/nurses', async (req, res) => {
  try {
    const nurse = req.body;
    const now = Date.now();
    const id = `nurse_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      `INSERT INTO nurses (id, email, first_name, last_name, name, password_hash, password_salt, role, created_at, updated_at, archived)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, FALSE)`,
      [id, nurse.email, nurse.firstName, nurse.lastName, nurse.name, nurse.passwordHash, nurse.passwordSalt, now, now]
    );
    
    const { password_hash, password_salt, ...safeNurse } = nurse;
    res.status(201).json({ id, ...safeNurse, createdAt: now, updatedAt: now, archived: false });
  } catch (err) {
    console.error('Error creating nurse:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create nurse' });
  }
});

app.put('/api/nurses/:id/archive', async (req, res) => {
  try {
    const now = Date.now();
    await pool.query('UPDATE nurses SET archived = TRUE, archived_at = ?, updated_at = ? WHERE id = ?', [now, now, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error archiving nurse:', err);
    res.status(500).json({ error: 'Failed to archive nurse' });
  }
});

app.put('/api/nurses/:id/restore', async (req, res) => {
  try {
    const now = Date.now();
    await pool.query('UPDATE nurses SET archived = FALSE, archived_at = NULL, updated_at = ? WHERE id = ?', [now, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error restoring nurse:', err);
    res.status(500).json({ error: 'Failed to restore nurse' });
  }
});

// Audit Logs API
app.get('/api/audit-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const log = req.body;
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, entity_name, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, Date.now(), log.userId, log.userName, log.userRole, log.action, log.entityType, log.entityId, log.entityName, JSON.stringify(log.details), log.ipAddress, log.userAgent]
    );
    
    res.status(201).json({ id, ...log, timestamp: Date.now() });
  } catch (err) {
    console.error('Error creating audit log:', err);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = ?', ['main']);
    if (rows.length === 0) return res.status(404).json({ error: 'Settings not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    const now = Date.now();
    
    await pool.query(
      `UPDATE settings SET clinic_name=?, clinic_address=?, clinic_phone=?, clinic_email=?, backup_enabled=?, backup_frequency=?, session_timeout=?, max_login_attempts=?, lockout_duration=?, updated_at=?, updated_by=? WHERE id='main'`,
      [settings.clinicName, settings.clinicAddress, settings.clinicPhone, settings.clinicEmail, settings.backupEnabled, settings.backupFrequency, settings.sessionTimeout, settings.maxLoginAttempts, settings.lockoutDuration, now, settings.updatedBy]
    );
    
    res.json({ ...settings, updatedAt: now });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Full database export
app.get('/api/export', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT * FROM patients');
    const [nurses] = await pool.query('SELECT * FROM nurses');
    const [auditLogs] = await pool.query('SELECT * FROM audit_logs');
    const [settings] = await pool.query('SELECT * FROM settings');
    
    const backup = {
      version: 2,
      timestamp: Date.now(),
      patients,
      nurses,
      auditLogs,
      settings,
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=clinic-db-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    console.error('Error exporting database:', err);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Full database import
app.post('/api/import', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const data = req.body;
    
    if (data.patients) {
      await conn.query('DELETE FROM patients');
      for (const p of data.patients) {
        await conn.query(
          `INSERT INTO patients (id, name, age, gender, contact, blood_group, address, notes, maternal_data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.age, p.gender, p.contact, p.blood_group, p.address, p.notes, JSON.stringify(p.maternal_data), p.created_at, p.updated_at]
        );
      }
    }
    
    if (data.nurses) {
      await conn.query('DELETE FROM nurses');
      for (const n of data.nurses) {
        await conn.query(
          `INSERT INTO nurses (id, email, first_name, last_name, name, password_hash, password_salt, role, created_at, updated_at, archived, archived_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.id, n.email, n.first_name, n.last_name, n.name, n.password_hash, n.password_salt, n.role, n.created_at, n.updated_at, n.archived, n.archived_at]
        );
      }
    }
    
    if (data.auditLogs) {
      await conn.query('DELETE FROM audit_logs');
      for (const a of data.auditLogs) {
        await conn.query(
          `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, entity_name, details, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.timestamp, a.user_id, a.user_name, a.user_role, a.action, a.entity_type, a.entity_id, a.entity_name, JSON.stringify(a.details), a.ip_address, a.user_agent]
        );
      }
    }
    
    if (data.settings) {
      for (const s of data.settings) {
        await conn.query(
          `INSERT INTO settings (id, clinic_name, clinic_address, clinic_phone, clinic_email, backup_enabled, backup_frequency, session_timeout, max_login_attempts, lockout_duration, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE clinic_name=VALUES(clinic_name), clinic_address=VALUES(clinic_address), clinic_phone=VALUES(clinic_phone), clinic_email=VALUES(clinic_email), backup_enabled=VALUES(backup_enabled), backup_frequency=VALUES(backup_frequency), session_timeout=VALUES(session_timeout), max_login_attempts=VALUES(max_login_attempts), lockout_duration=VALUES(lockout_duration), updated_at=VALUES(updated_at), updated_by=VALUES(updated_by)`,
          [s.id, s.clinic_name, s.clinic_address, s.clinic_phone, s.clinic_email, s.backup_enabled, s.backup_frequency, s.session_timeout, s.max_login_attempts, s.lockout_duration, s.updated_at, s.updated_by]
        );
      }
    }
    
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error importing database:', err);
    res.status(500).json({ error: 'Failed to import database' });
  } finally {
    conn.release();
  }
});

// Start server
async function start() {
  try {
    await createDatabaseIfNotExists();
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();