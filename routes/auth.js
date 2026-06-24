const express = require('express');
const router = express.Router();
// 💡 パスワードのハッシュ化（暗号化）に使う実務標準ライブラリ（後ほど登録します）
// const bcrypt = require('bcrypt'); 

// 🎯 [GET] /login : ログイン画面を表示する
router.get('/login', (req, res) => {
    // セッションにエラーがあれば取得し、画面に渡した後は消去する
    const error = req.session.error;
    delete req.session.error; 
    res.render('pages/login', { error: error || null });
});

// 🎯 [POST] /login : 門番を突破するための検証（B案の実装）
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // 🛡️ [監査ポイント] 今回はテスト用に環境変数や固定値で簡易検証します
    // ※実務ではここでデータベース（SQLite）からユーザー情報を検索します
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "secure1234"; // 本来は暗号化されたハッシュ値

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // ⭕ 認証成功：セッション（通行証）にユーザー情報を刻む
        req.session.userId = username;
        
        // セッションを保存して管理画面へリダイレクト
        req.session.save((err) => {
            if (err) return next(err);
            res.redirect('/admin');
        });
    } else {
        // ❌ 認証失敗：アカウント列挙を防ぐため、曖昧なエラーメッセージを返す（B案）
        req.session.error = "ユーザーIDまたはパスワードが正しくありません。";
        res.redirect('/login');
    }
});

// 🎯 [GET] /logout : 安全に通行証を破棄する
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('ログアウトエラー:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;