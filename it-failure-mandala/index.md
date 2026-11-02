---
type: Project
title: "ITプロジェクト失敗原因マンダラ図"
description: "失敗したITプロジェクトの真の原因を客観的かつ網羅的に把握するためのデータ分離型マンダラ図アセット"
tags: [project, project-management, root-cause-analysis, mandala, rca, aar]
status: active
generated:
  by: "reference_agent/create_project"
  at: 2026-11-03
sources:
  - id: saaj20150515
    title: "失敗したITプロジェクトの真の原因に迫るマンダラ図の紹介"
    resource: "https://www.saajk.org/wp/wp-content/uploads/saaj20150515.pdf"
  - id: shippai-gakkai
    title: "失敗学会 / 関西IBMユーザー研究会"
    resource: "https://www.shippai.org/"
---
# ITプロジェクト失敗原因マンダラ図

## 概要・背景
ITプロジェクトが失敗した際、表面的な現象や個人の責任追及にとどまることなく、失敗事例から体系立てられた失敗原因を網羅的にたどり、「真の原因（真因）」を突き止めて再発防止やリスク管理に活かすためのフレームワーク。
畑村洋太郎氏提唱の「失敗まんだら」をベースに、佐伯徹氏・関西IBMユーザー研究会およびSAAJ（日本システム監査人協会）でまとめられた「【ITプロジェクト版】失敗原因マンダラ図（全54項目）」を、データ定義とViewerを分離したWebアセットとして構築・管理する。

## ゴール・成果物
- **データ層 (`data/mandala_data.js`)**: 4大領域 × 第1階層（10分類） × 第2階層（全54項目）の階層構造、用語定義、具体例、再発防止策データを管理。
- **表示層 (`viewer/app.js`, `viewer/styles.css`)**: 放射状SVGマンダラ図自動レイアウト（重なりゼロ保証）、用語定義辞書、AAR（事後検証）ワークシート機能。
- **エントリポイント (`index.html`)**: ローカルでもブラウザ単体で起動可能。
- **公開ホスティング**: GitHub Pages (`https://sukehisa.github.io/it-failure-mandala/`) での配信。

## TODOs
- [[TODOs/TODO|プロジェクトTODO]]

## 関連リンク
- [[TODOs/TODO|TODO]]
- [README](./README.md)
- [Web Viewer (index.html)](./index.html)
- [SAAJ近畿支部 発表資料 (PDF)](https://www.saajk.org/wp/wp-content/uploads/saaj20150515.pdf)
- 公開先URL: [https://sukehisa.github.io/it-failure-mandala/](https://sukehisa.github.io/it-failure-mandala/)

## ログ・進捗メモ
- **2026-10-25**: 初期構築。SAAJ 2015年発表の49項目と54項目拡張版を統合。衝突解消アルゴリズムを導入し重なりゼロレイアウトを達成。
- **2026-11-03**: `sandbox/` から `05_Projects/it-failure-mandala/` へ昇格・移行。`sukehisa.github.io` への公開アセット配置を実施。
