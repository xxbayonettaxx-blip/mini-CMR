// お問い合わせとブログ
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 🛡️ 門番（ミドルウェア）：ログインチェック
const authGuard = (req, res, next) => {
    if (req.session && req.session.userId) {
        next(); // ログイン済みなら通す
    } else {
        res.redirect('/login'); // 未ログインならログイン画面へ弾く
    }
};

// ── [GET] お問い合わせ一覧画面（★【R】ead） ──
router.get('/admin', authGuard, (req, res) => {
    // router.get('/admin', (req, res) => {
    // 💡 日付の新しい順（DESC）でデータをすべて取得する
    const sql = `SELECT * FROM contacts ORDER BY created_at DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ DB読込エラー:', err.message);
            return res.status(500).send('システムエラーが発生しました');
        }
        // views/pages/admin.ejs へデータを渡して表示
        res.render('pages/admin', { contacts: rows });
    });
});

// ── [POST] ステータスの更新処理（★【U】pdate） ──
router.post('/admin/update-status/:id', authGuard, (req, res) => {
    const id = req.params.id;         // URLからデータのIDを取得（例: /admin/update-status/5）
    const { status } = req.body;      // 画面から新しいステータス（対応中、完了など）を取得

    // 🛡️ バックエンドバリデーション：決められた文字以外は拒否する
    const allowedStatuses = ['未対応', '対応中', '完了'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).send('不正なステータスです');
    }

    const sql = `UPDATE contacts SET status = ? WHERE id = ?`;

    db.run(sql, [status, id], function(err) {
        if (err) {
            console.error('❌ DB更新エラー:', err.message);
            return res.status(500).send('更新に失敗しました');
        }
        console.log(`📦 【U】pdate成功：データID ${id} のステータスを [${status}] に更新しました`);
        
        // 更新が終わったら一覧画面にリロード（戻る）
        res.redirect('/admin');
    });
});

// ── [POST] お問い合わせの削除処理（★【D】elete） ──
router.post('/admin/delete/:id', authGuard, (req, res) => {
    const id = req.params.id;

    // 🛡️ セキュリティ：URLのIDを悪用した攻撃を防ぐため、? を使って安全に削除
    const sql = `DELETE FROM contacts WHERE id = ?`;

    db.run(sql, [id], function(err) {
        if (err) {
            console.error('❌ DB削除エラー:', err.message);
            return res.status(500).send('削除に失敗しました');
        }
        console.log(`📦 【D】elete成功：データID ${id} を削除しました`);
        res.redirect('/admin');
    });
});



//ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー

// 🎯 [GET] /admin/blog : 管理者用のブログ記事一覧
router.get('/admin/blog', authGuard, (req, res) => {
    // 管理画面では「下書き（draft）」も「公開（published）」もすべて新着順に表示する
    const sql = `SELECT * FROM blogs ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("サーバーエラー");
        }
        // views/pages/admin-blog-list.ejs を描画（後ほど作成）
        res.render('pages/admin-blog-list', { posts: rows });
    });
});

// 🎯 [GET] /admin/blog/create : ブログ新規新規作成画面を表示する
router.get('/admin/blog/create', authGuard, (req, res) => {
    res.render('pages/admin-blog-create'); // 後ほど作成
});

// 🎯 [POST] /admin/blog/create : ブログをデータベースに安全に保存する
router.post('/admin/blog/create', authGuard, (req, res) => {
    // 画面のフォームから送られてきたデータを受け取る
    const { title, content, status, tags, thumbnail_url } = req.body;

    // 🛡️ [セキュリティ監査] SQLインジェクションを完全に防ぐプレースホルダ設計
    const sql = `INSERT INTO blogs (title, content, status, tags, thumbnail_url) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [title, content, status, tags, thumbnail_url], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("ブログの保存に失敗しました");
        }
        // 保存が成功したら、管理者用のブログ一覧ページへ戻す
        res.redirect('/admin/blog');
    });
});

module.exports = router;