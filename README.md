# ニュースダイジェスト（公開版）

NHKニュースのRSSをカテゴリ別に要約表示するWebアプリの、GitHub Pages公開用バージョンです。

- ローカル版（`../news-ranking-app`）はNode.jsサーバーがRSSを都度取得しますが、GitHub Pagesはサーバーを実行できません。
- 代わりに **GitHub Actions** が20分おきに `scripts/fetch-news.js` を実行してNHK RSSを取得し、結果を `data/news.json` としてリポジトリにコミットします。
- アプリ本体（`app/`）は静的ファイルのみで、`data/news.json` を読み込んで表示します。サーバーやAPIキーは不要です。

## 構成

```
index.html          … 紹介ページ（ランディングページ）
app/                 … アプリ本体（静的版）
  index.html
  app.js
  style.css
data/
  news.json          … GitHub Actionsが自動更新するニュースデータ
scripts/
  fetch-news.js       … RSS取得・JSON生成スクリプト
.github/workflows/
  fetch-news.yml       … 20分おきに実行されるスケジュールジョブ
```

## GitHub Pagesでの公開手順

1. https://github.com/new で新しいリポジトリを作成（Public、READMEなどは追加しない）
2. このフォルダの内容をpush
   ```bash
   git init
   git add -A
   git commit -m "Initial commit: news digest public site"
   git remote add origin <あなたのリポジトリURL>
   git branch -M main
   git push -u origin main
   ```
3. リポジトリの **Settings → Actions → General → Workflow permissions** で
   「Read and write permissions」を選択して保存（Actionsが `data/news.json` をコミットするために必要）
4. リポジトリの **Settings → Pages** で Source を「Deploy from a branch」、Branch を `main` / `/(root)` にして保存
5. 数分待ってから `https://<ユーザー名>.github.io/<リポジトリ名>/` にアクセス

初回はActionsが1回動くまで `data/news.json` は手元で生成した初期データのままです。
`Actions` タブから `Fetch NHK News` ワークフローを手動実行（workflow_dispatch）すると、すぐに最新化できます。

## ローカルでの確認

```bash
node scripts/fetch-news.js   # data/news.json を更新
npx serve .                   # または任意の静的サーバーで確認
```
