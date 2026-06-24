// routes/contact.js
const express = require('express');
const router = express.Router();
const db = require('../config/database.js'); // 💡前章で作ったセキュアなDB接続を呼び出す
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── [GET] お問い合わせフォームの表示 ──
router.get('/contact', (req, res) => {
    res.render('pages/contact', { error: null }); // pages/の中に配置
});

// ── [POST] フォーム送信の処理（★【C】reate） ──
router.post('/contact', async (req, res) => {
    // 1. データを受け取る
    let { name, email, job, budget, message } = req.body;

    // 🛡️ バックエンド防衛①：文字列の前後にある「嫌がらせの空白」を自動で削る
    name = name ? name.trim() : '';
    email = email ? email.trim() : '';
    message = message ? message.trim() : '';

    // 🛡️ バックエンド防衛②：JavaScriptをオフにして送られてきた「空データ」を検閲
    if (!name || !email || !job || !budget || !message) {
        console.log('====== ⚠️ バックエンド検閲により不正な空データを弾きました ======');
        return res.render('pages/contact', { error: 'すべての項目を正しく入力してください。' });
    }

    // 🛡️ バックエンド防衛③：文字数オーバーの検閲（データベースの肥大化・フリーズ防止）
    if (name.length > 50 || message.length > 1000) {
        return res.render('pages/contact', { error: '文字数が制限を超えています。' });
    }

    // 2. 厳重な検閲を突破したら、安全にデータベースへ保存（SQLインジェクション対策の ? を使用）
    const sql = `
        INSERT INTO contacts (name, email, job, budget, message) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [name, email, job, budget, message], async function(err) {
        if (err) {
            console.error('❌ DB追加エラー:', err.message);
            return res.render('pages/contact', { error: 'システムエラーが発生しました。時間をおいて再度お試しください。' });
        }

        console.log(`📦 【C】reate成功：お問い合わせをDBに保存しました (ID: ${this.lastID})`);

        // 3. DB保存に成功したら、Resendでお客様へ自動返信メールを飛ばす
        try {
            await resend.emails.send({
                // from: 'Portfolio Contact <onboarding@resend.dev>',
                // to: email, // お客様のアドレスへ自動送信
                // subject: `【受付完了】お問い合わせありがとうございます`,
                // html: `<p>${name}様</p><p>お問い合わせを受け付けました。内容を確認の上、追ってご連絡いたします。</p>`
                from: 'onboarding@resend.dev', // 無料枠の固定アドレス
                to: 'xxbayonettaxx@gmail.com', // ★必ずResendに登録した自分のGmailにする★
                subject: `【ミニCRM】${name}様より新規お問い合わせ`,
                html: `
                    <h3>新しいお問い合わせが届きました</h3>
                    <p><strong>お名前:</strong> ${name}</p>
                    <p><strong>返信用Email:</strong> ${email}</p>
                    <p><strong>ご職業:</strong> ${job}</p>
                    <p><strong>ご予算:</strong> ${budget}</p>
                    <p><strong>メッセージ内容:</strong></p>
                    <div style="background: #f4f4f4; padding: 15px;">
                    ${message.replace(/\n/g, '<br>')}
                    </div>
            `
            });
            
            // 4. すべて完了したら成功画面へリダイレクト
            res.redirect('/contact-success');

        } catch (mailError) {
            console.error('❌ Resend送信エラー:', mailError);
            // 💡実務テクニック：メールが失敗してもDBには保存できているので、
            // 最悪管理者は確認できる。そのため画面自体は成功画面へ進めてあげる設計にするケースも多いです。
            res.redirect('/contact-success');
        }
    });
});

// ── [GET] お問い合わせ完了画面 ──
router.get('/contact-success', (req, res) => {
    res.render('pages/contact-success');
});

module.exports = router;