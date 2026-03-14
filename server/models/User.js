import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      userId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

export default class User {
  constructor(data) {
    this.username = data.username;
    this.userId = data.userId;
    this.email = data.email;
    this.password = data.password;
  }

  save() {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (username, userId, email, password)
        VALUES (?, ?, ?, ?)
      `;
      db.run(query, [this.username, this.userId, this.email, this.password], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, username: this.username, userId: this.userId, email: this.email });
      });
    });
  }

  static findOne(queryObj) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM users WHERE ';
      let values = [];
      
      if (queryObj.$or) {
        const conditions = [];
        queryObj.$or.forEach((condition) => {
          const key = Object.keys(condition)[0];
          values.push(condition[key]);
          conditions.push(`${key} = ?`);
        });
        query += conditions.join(' OR ');
      } else {
        const ObjectKeys = Object.keys(queryObj);
        if (ObjectKeys.length === 1) {
          const key = ObjectKeys[0];
          values.push(queryObj[key]);
          query += `${key} = ?`;
        } else {
          resolve(null);
          return;
        }
      }

      db.get(query, values, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
}

