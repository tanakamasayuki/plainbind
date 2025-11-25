# PlainBind.js

> 📘 Looking for the English version? Read [README.md](README.md).

PlainBind.js はプレーン HTML + `data-*` 属性 + JSON だけで UI を構築できる
超軽量テンプレート / データバインドライブラリです。script タグを 1 本挿入するだけで
既存のマークアップがデータ駆動化され、ビルド工程や大型フレームワークは不要です。

> ⚠︎ 実装はまだ進行中です。  
> このドキュメントは npm 公開時に保証したい外部仕様をまとめたものです。

---

## インストール

環境に応じて script タグ読み込みまたは npm で利用できます。

```html
<!-- 公開後の CDN / ローカルバンドルを想定 -->
<script src="https://cdn.example.com/plainbind/latest/plainbind.min.js"></script>
```

```bash
npm install plainbind

# バンドラからの利用例
import "plainbind";
```

デフォルトビルドは読み込み完了時に自動で初期化され、追加設定は不要です。

---

## クイックスタート

```html
<h1 data-bind="title"></h1>

<ul>
  <li data-repeat="user in users" data-class-when="user.active:active">
    <span data-bind="user.name"></span>
    <span data-bind="user.age" data-format="number"></span>
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
```

1. `<script id="plainbind-data">` から JSON を取得。
2. DOM を 1 パスで走査し、data 属性に従って書き換え。
3. 描画完了後に `PlainBind.ready(cb)` と `plainbind:ready` イベントを発火。

---

## データ読み込み

PlainBind は次の優先順位でデータを探します。

1. `<script id="plainbind-data" type="application/json">`
2. 現在の HTML と同じ階層の `{ファイル名}.json`（例：`index.html.json`）

今後はフックでローダーを拡張できるようにする予定です。読み込み失敗時は空オブジェクトを渡すので、`ctx.data` が空でも動く実装にしてください。

---

## 利用可能な data 属性

| 属性                 | 役割                                               |
| -------------------- | -------------------------------------------------- |
| `data-bind`          | テキスト（エスケープ済み）を挿入                   |
| `data-bind-html`     | HTML として挿入（サニタイズは利用者責務）         |
| `data-bind-attr-*`   | 任意の属性へバインド                               |
| `data-show`          | 真値のとき表示                                     |
| `data-hide`          | 真値のとき非表示                                   |
| `data-repeat`        | 配列をループして要素を複製                         |
| `data-empty`         | 配列が空のとき代替要素を表示                       |
| `data-class-when`    | `式:class` 形式で複数クラスを切り替え              |
| `data-format`        | 事前登録したフォーマッタを適用                     |
| `data-placeholder`   | 値が空のとき代替文字列を表示                       |
| `data-link`          | a 要素の `href` をショートカットで設定             |

### サンプル

```html
<li data-repeat="item in products">
  <img data-bind-attr-src="item.image" data-placeholder="no-image.png">
  <span data-bind="item.name" data-format="uppercase"></span>
  <span data-bind="item.price" data-format="currency"></span>
</li>
<li data-empty="products">商品がありません</li>
```

---

## データ参照ルール

- ドット記法: `user.profile.name`
- 配列アクセス: `users[0].name`
- `data-repeat="item in items"` の `item` はそのループ内のみ有効。親スコープは参照可能。
- 取得できなかった値はテキストの場合は空文字、属性の場合は削除として扱う。

---

## JavaScript API

### `PlainBind.ready(callback)`

初期レンダリング後に呼ばれるコールバックを登録します。引数には `{ data, root, version }` が渡されます。

```js
PlainBind.ready(({ data }) => {
  console.log("Rendered with", data);
});
```

### `PlainBind.registerFormatter(name, fn)`

`data-format="name"` で利用できるフォーマッタを登録します。フォーマッタには生の値とコンテキストが渡されます。

```js
PlainBind.registerFormatter("currency", (value) => {
  return "¥" + Number(value || 0).toLocaleString("ja-JP");
});
```

v1 では同期関数のみサポートし、例外が発生した場合は元の値をそのまま表示します。

---

## イベント

レンダリング完了時にカスタムイベントを発火します。

```js
document.addEventListener("plainbind:ready", (event) => {
  console.log("PlainBind finished", event.detail);
});
```

`event.detail` の中身は `PlainBind.ready` と同じです。

---

## 対応ブラウザ

| 機能               | 目標サポート                            |
| ------------------ | --------------------------------------- |
| DOMParser / fetch  | モダンブラウザ                          |
| ES Modules         | 任意（UMD ビルドも提供予定）            |
| IE11               | ポリフィルなしでは非対応                |

ニーズがあればレガシービルドやポリフィルガイドを追記します。

---

## ロードマップ / 未確定事項

- 再描画フックや部分更新 API
- インライン JSON / `*.json` 以外の柔軟なデータローダー
- `data-bind-html` 用の強力なサニタイズ支援
- 開発時のみ出力される警告やデバッグログ

---

## コントリビュート方法

1. リポジトリを fork & clone。
2. 将来的に用意するテストを実行（`npm test` を予定）。
3. `main` ブランチへ PR。UI 変更時は before/after のスクリーンショットを添付してください。

---

## ライセンス

PlainBind.js は MIT License で提供されます。詳細は `LICENSE` を参照してください。
