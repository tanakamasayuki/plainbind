# PlainBind.js 仕様書

## 📌 コンセプト

PlainBind.js は **プレーン HTML + data-* 属性 + JSON** で UI を構築するための  
**超軽量テンプレートエンジン兼データバインダー** です。

### 特徴的なコンセプト

- **HTML-first**  
  HTML をそのままテンプレートとして扱い、独自タグや構文を導入しない。

- **Designer-friendly**  
  デザイナーは data- 属性だけ覚えればよく、HTML を崩さずに作業可能。

- **Framework-less / Vanilla JS only**  
  React / Vue / jQuery など一切不要。script タグ 1本で動作。

- **Zero-learning cost**  
  data-show, data-repeat などの直感的な命令名で学習コストを最小化。

- **Security-first**  
  HTML に JavaScript のコードを書く仕様を禁止し、eval も存在しない。

- **Server-agnostic**  
  JSON をページ内 script または `xxx.html.json` から自動読み込み。  
  ローカルサーバでもそのまま動作。

- **Single-pass rendering**  
  リアクティブではなく “初期表示を完成させること” を目的にした軽量処理。

---

## ✨ 特徴（初回実装に含まれる）

- ✔ プレーン HTML をテンプレート化  
- ✔ JSON 自動読み込み（script / .json）  
- ✔ data-* 属性で構造定義  
- ✔ 条件表示・繰り返し・属性置換  
- ✔ フォーマット、クラス条件、空データ対応  
- ✔ 自動 init（script 読み込みで即動作）  
- ✔ `PlainBind.ready(cb)` で後処理可能  
- ✔ カスタムイベント `plainbind:ready` 発火

---

## 📂 JSON データの読み込み仕様

優先順位：

1. `<script id="plainbind-data" type="application/json">`
2. `{htmlファイル名}.json`  
   例：`index.html` → `index.html.json`

---

## 🔧 初期化と自動実行

```html
<script src="plainbind.js"></script>
```

これだけで自動的に init が実行される。

---

# 🧩 data 属性コマンド一覧

## 1. data-bind（テキスト挿入）
```html
<span data-bind="user.name"></span>
```

## 2. data-bind-html（HTML 挿入）
```html
<div data-bind-html="article.body"></div>
```

## 3. data-bind-attr-*（属性バインド）
```html
<img data-bind-attr-src="product.image">
```

## 4. data-show（条件表示）
```html
<p data-show="user.isActive"></p>
```

## 5. data-hide（条件非表示）
```html
<p data-hide="user.isActive"></p>
```

## 6. data-repeat（繰り返し）
```html
<li data-repeat="item in items">
  <span data-bind="item.name"></span>
</li>
```

## 7. data-empty（空データ表示）
```html
<li data-empty="items">データがありません</li>
```
配列が空、または値が falsy のときに表示される。

## 8. data-class-when（条件クラス付与）
```html
<li data-class-when="item.active:active, item.new:new"></li>
```

## 9. data-format（フォーマット適用）
```html
<span data-bind="price" data-format="currency"></span>
```

フォーマッタ登録：
```js
PlainBind.registerFormatter("currency", (v)=>"¥"+Number(v).toLocaleString());
```
シグネチャは `(value, vars, arg)`。`vars` はそのスコープの変数（繰り返しの値や `$index` を含む）、`arg` は `data-format="name:arg"` の `arg` 部分。

ビルトインフォーマッタ

- `number` : 数値を桁区切りで表示（整数想定）
- `currency` : 円表記（¥ + toLocaleString("ja-JP")）
- `date` : 日付を `YYYY/MM/DD` 形式に整形（不正値はそのまま）
- `datetime` : 日時を `YYYY/MM/DD HH:mm` に整形
- `uppercase` / `lowercase` : 英字の大小変換
- `trim` : 前後の空白を除去
- `truncate` : 100 文字（またはオプション指定長）で省略記号付きに切り詰め
- `json` : オブジェクト/配列を JSON 文字列化（デバッグ用）

## 10. data-placeholder（値が空なら代替表示）
```html
<span data-bind="user.nickname" data-placeholder="未設定"></span>
```

## 11. data-link（リンクショートカット）
```html
<a data-link="product.url">詳細</a>
```

※ `data-bind` / `data-bind-html` を持つ要素では、その処理で打ち切られるため同じ要素の `data-bind-attr-*` や子要素のバインドは実行されない。

---

# 🔍 データ参照ルール

- `a.b.c` → ネストアクセス  
- `items[0].name` → 配列アクセス  
- `data-repeat` 内では繰り返し変数と `$index` が使える  
- 取得できない場合 → 空文字扱い

---

# 🧠 JavaScript API

## ✔ PlainBind.ready(callback)
置換完了後に実行。

```js
PlainBind.ready((ctx)=>{
  console.log("完成", ctx.data);
});
```

## ✔ PlainBind.registerFormatter(name, fn)
フォーマット関数の登録。

---

# ⚙ カスタムイベント

```js
document.addEventListener("plainbind:ready", (e)=>{
  console.log(e.detail);
});
```

---

# 🧪 最小サンプル

```html
<h1 data-bind="title"></h1>

<ul>
  <li data-repeat="u in users" data-class-when="u.active:active">
    <span data-bind="u.name"></span>
    <span data-bind="u.age" data-format="number"></span>
  </li>
  <li data-empty="users">データがありません</li>
</ul>

<script id="plainbind-data" type="application/json">
{
  "title": "ユーザー一覧",
  "users": [
    { "name": "田中", "age": 25, "active": true },
    { "name": "佐藤", "age": 30, "active": false }
  ]
}
</script>

<script src="plainbind.js"></script>
<script>
  PlainBind.ready((ctx)=>console.log("完了:", ctx));
</script>
```
