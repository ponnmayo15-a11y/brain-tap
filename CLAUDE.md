# brain-tap — 指でやる、短い脳トレ

フラッシュ暗算・逆唱・Nバックを、スマホのタップで短く行うウェブアプリ。
Googleログインすると点数はクラウドに残り、別の端末でも見られる。
これは医療ではない。頭の体操。

## コマンド一覧

```bash
npm start
```

ブラウザで `http://localhost:5175` を開く。公開ページは `https://ponnmayo15-a11y.github.io/brain-tap/` 。QRは `qr.html` 。

## プロジェクト構成

```
brain-tap/
├── CLAUDE.md
├── package.json
├── index.html
├── qr.html                 ← 公開ページのQRコード
├── qr.png
├── css/style.css
├── js/
│   ├── app.js              ← 画面の切り替え
│   ├── auth.js             ← Googleログイン
│   ├── scores.js           ← 点数の保存（クラウド / この端末）
│   ├── firebase-config.js  ← Firebaseの接続情報
│   ├── ui.js               ← 数字ボタン・マス
│   ├── wait.js
│   └── games/
│       ├── flash.js        ← フラッシュ暗算
│       ├── reverse.js      ← 逆唱
│       └── nback.js        ← Nバック（2バック）
├── setup/SETUP-FOR-CC.md   ← Firebaseセットアップ
├── firestore.rules
└── .cursor/skills/keep-brain-tap/
    └── SKILL.md
```

## 共通ルール

- ユーザーはプログラミング未経験者の場合がある。1ステップずつ案内する
- ユーザーにファイルを直接編集させない。必要な値はチャットで受け取り、エージェントが設定する
- エラーが起きたら、何が起きたか・次に何をすればいいかを平易に伝える
- 専門用語を使わず、平易な日本語で案内する

## やること / やらないこと

やること:
- 3つの課題（フラッシュ暗算 / 逆唱 / Nバック）
- スマホで大きなボタンをタップ（パソコンでも同じ）
- 1回は短く、終わったらすぐ点数
- Googleでログイン
- 点数をクラウドに保存（別端末でも同じ記録）
- 設定前は練習モード（この端末だけに記録）

やらないこと:
- メールアドレス＋パスワードのログイン
- 決済・販売の仕組み
- アプリ商店への出品
- 「ADHDが治る」といった医療の効果の宣伝

## 各ゲーム

- フラッシュ暗算: 1桁が5つ出る。合計を数字ボタンで入れる
- 逆唱: 4つの数字を覚えて、逆の順でタップ
- Nバック: 3×3のマス。2つ前と同じ位置なら「同じ」

---

## 起動スキル

```bash
npm start
```

完了の定義: ブラウザでトップ画面が開く。

---

## セットアップスキル（Googleログイン）

`setup/SETUP-FOR-CC.md` を読み、その手順に従って進行する。
一度に全部案内せず、次の1アクションだけを伝える。
接続情報はチャットで受け取り、`js/firebase-config.js` にエージェントが書く。

完了の定義:
- `js/firebase-config.js` に値が入っている
- Firebase で Google ログインが有効
- Firestore のルールが `firestore.rules` どおり
- 実際に Google でログインでき、点数がクラウドに残る

---

## 調整スキル

`.cursor/skills/keep-brain-tap/SKILL.md` を読んで実行する。
