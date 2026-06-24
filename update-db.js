//node update-db.js で作成したら削除しても構わない

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite'); // 既存のDBファイルを指定

db.serialize(() => {
    // 🛡️ blogs テーブルがなければ新しく作成する（監査済みのデータ構造）
    db.run(`
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft', -- 'draft' または 'published'
            tags TEXT,                            -- パターンA：カンマ区切りの文字列
            thumbnail_url TEXT,                   -- サムネイル画像のURLまたはパス
            author TEXT NOT NULL DEFAULT '管理者',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ テーブル作成エラー:', err.message);
        } else {
            console.log('✅ blogs テーブルの作成（または確認）が成功しました！');
        }
    });
});

db.close();