// =========================================================================
// 1. 環境設定とライブラリ読み込み
// =========================================================================
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

//Resend追加分
// 一番上の設定部分に追加
const { Resend } = require('resend');
// .envファイルからAPIキーを読み込んでResendを準備
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// 💡 サーバーの基本設定
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 💡 セッション（ログイン維持）の設定
app.use(session({
    store: new SQLiteStore({ db: 'session.sqlite' }),
    secret: process.env.SESSION_SECRET || 'super-secret-key', // .env から読み込む
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1時間
}));

// =========================================================================
// 2. 分割したルーティング（機能）の合体（マウント）
// =========================================================================
// 💡 各ファイルからルートを呼び出して、Expressに登録する
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const blogRouter = require('./routes/blog');

app.use(contactRouter); // 一般ユーザー向け（お問い合わせフォームなど）
app.use(adminRouter);   // 管理者向け（CRUD操作、ステータス変更、削除）
app.use(authRouter); // ※ ログイン・ログアウトの処理（auth）も、今後 routes/auth.js に分ければここに **app.use(authRouter) と足すだけ！**
app.use(blogRouter);



// 🎯 [POST] /contact : お問い合わせフォームの送信処理
app.post('/contact', async (req, res) => {
    // フォームから送られてきた名前、メールアドレス、本文を受け取る
    const { name, email, message, job, budget } = req.body;

    try {
        // ResendのAPIを叩いてメールを送信
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev', // 無料枠の固定アドレス
            to: 'takehiro.ogura@gmail.com', // ★必ずResendに登録した自分のGmailにする★
            subject: `【ミニCRM】${name}様より新規お問い合わせ`,
            html: `
                <h3>新しいお問い合わせが届きました</h3>
                <p><strong>お名前:</strong> ${name}</p>
                <p><strong>返信用Email:</strong> ${email}</p>
                <p><strong>お仕事:</strong> ${job}</p>
                <p><strong>ご予算l:</strong> ${budget}</p>
                <p><strong>メッセージ内容:</strong></p>
                <div style="background: #f4f4f4; padding: 15px;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            `
        });

        // 送信が成功したら、完了画面や元のページにリダイレクト
        console.log("メール送信成功:", data);
        res.send("お問い合わせを送信しました！"); // 実際は完了ページのEJSをrenderするのがオススメです

    } catch (error) {
        console.error("メール送信エラー:", error);
        res.status(500).send("エラーが発生しました。");
    }
});

// =========================================================================
// 3. サーバー起動
// =========================================================================
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🚀 CRM System がポート ${PORT} で正常に起動しました！`);
});