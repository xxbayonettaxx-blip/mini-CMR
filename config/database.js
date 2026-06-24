// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// データベースファイルの保存場所を指定（プロジェクトのルート直下）
const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ データベース接続エラー:', err.message);
    } else {
        console.log('📦 SQLite データベースに正常に接続しました。');
    }
});

// 🛠️ テーブルの一発自動作成（初期化）
db.serialize(() => {
    // 1. 管理者ユーザーテーブル
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    // 2. お問い合わせ管理テーブル（★CRUDの主役）
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            job TEXT NOT NULL,
            budget TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT '未対応', -- 未対応 / 対応中 / 完了
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// 他のファイル（routesなど）でこのdbを使えるように外に出す
module.exports = db;