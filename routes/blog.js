const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// 🎯 [GET] /blog : ブログ記事一覧画面（一般ユーザー向け）
router.get('/blog', (req, res) => {
    // 🛡️ [セキュリティ＆仕様監査] 
    // 下書き（draft）のものは一般人には見せない！公開（published）のものだけを新着順で取得
    const sql = `SELECT * FROM blogs WHERE status = 'published' ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("サーバーエラーが発生しました");
        }
        // views/pages/blog-list.ejs を描画（後ほど作成）
        res.render('pages/blog-list', { posts: rows });
    });
});

// 🎯 [GET] /blog/:id : ブログ詳細画面（一般ユーザー向け）
// URLの :id の部分には、記事のID（例: /blog/5）が動的に入ります
router.get('/blog/:id', (req, res) => {
    const postId = req.params.id;
    
    // 🛡️ [セキュリティ監査] SQLインジェクションを防ぐため、プレースホルダ（?）を絶対に使用
    const sql = `SELECT * FROM blogs WHERE id = ? AND status = 'published'`;
    
    db.get(sql, [postId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("サーバーエラーが発生しました");
        }
        if (!row) {
            // 記事が見つからない、または下書き状態の場合は404エラー
            return res.status(404).send("記事が見つかりません");
        }
        // views/pages/blog-detail.ejs を描画（後ほど作成）
        res.render('pages/blog-detail', { post: row });
    });
});

module.exports = router;