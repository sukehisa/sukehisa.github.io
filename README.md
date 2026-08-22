# sukehisa / reports

MEMOs（個人ナレッジベース）で生成した HTML レポートを GitHub Pages で公開するための静的サイトです。

- 公開URL: https://sukehisa.github.io/
- レポート一覧: https://sukehisa.github.io/reports/

## このリポジトリの中身は自動生成です

`index.html` / `reports/**` / `assets/site.css` は **MEMOs 側のスクリプトが生成**します。
このリポジトリを直接編集しても次回の公開時に上書きされます。編集は生成元で行ってください。

```
MEMOs/scripts/publish_reports.py           生成・同期スクリプト
MEMOs/scripts/publish_reports.config.json  公開対象カテゴリの定義
```

## 公開手順（MEMOs リポジトリ側で実行）

```bash
python3 scripts/publish_reports.py            # 反映（ローカル）
python3 scripts/publish_reports.py --dry-run  # 差分確認のみ
python3 scripts/publish_reports.py --push     # commit & push（GitHub Pages へ反映）
```

## 注意

公開リポジトリのため、ここに置いたファイルは URL を知る誰でも閲覧できます。
検索エンジン向けには `robots.txt` と各ページの `noindex` を設定していますが、非公開化の手段ではありません。

最終生成: 2026-08-22 22:22 JST
