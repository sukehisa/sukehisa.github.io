/**
 * 【ITプロジェクト版】失敗原因マンダラ図 データ定義
 *
 * 出典・ベース資料:
 * - 日本システム監査人協会近畿支部 第152回定例研究会「失敗したITプロジェクトの真の原因に迫るマンダラ図の紹介」(2015/05/15, 松井秀雄氏 / 関西IBMユーザー研究会 IT研究会分科会)
 * - 佐伯徹『DX失敗学 なぜ成果を生まないのか』(日経BP) / 失敗学会「ITプロジェクト版 失敗原因マンダラ図」(全54項目版)
 *
 * カスタマイズ方法:
 * - `domains`: 大分類（個人 / プロジェクト / 組織 / 未知）の定義と配色・背景領域の設定
 * - `categories`: 第1階層（10分類）の定義。`angle`（中心からの角度: 度数法, 0=右, 90=下, 180=左, 270=上）でマンダラ上の配置方向を調整可能
 * - `items`: 第2階層（具体的な失敗原因アイテム）の定義。追加・削除・移動・定義文の編集がそのままViewerに反映されます
 */
window.MANDALA_DATA = {
  meta: {
    title: "【ITプロジェクト版】失敗原因マンダラ図",
    subtitle: "Root Cause Analysis IT360 — 失敗の真の原因を客観的かつ網羅的に把握する",
    version: "1.1.0",
    updatedAt: "2026-10-25",
    sources: [
      {
        title: "失敗したITプロジェクトの真の原因に迫るマンダラ図の紹介 (SAAJ近畿支部 第152回定例研究会)",
        url: "https://www.saajk.org/wp/wp-content/uploads/saaj20150515.pdf"
      },
      {
        title: "失敗学会 / 関西IBMユーザー研究会「ITプロジェクト版 失敗原因マンダラ図」",
        url: "https://www.shippai.org/"
      }
    ],
    analysisSteps: [
      {
        step: 1,
        title: "関係者各自がマンダラ図から失敗原因を抽出",
        description: "「もう一度、同じ案件を同じメンバーで実施する場合、気をつけること」という観点で、各自が第1階層・第2階層の項目から該当する失敗原因を探してチェックする。"
      },
      {
        step: 2,
        title: "関係者各自が抽出した失敗原因を集約",
        description: "各自が選定した失敗原因を一覧化し、選択者（○）と選択理由・コメントを集約する。"
      },
      {
        step: 3,
        title: "失敗原因を選定",
        description: "①全員が抽出した項目は無条件に選定。②一部が抽出した項目は仮選定し、抽出理由から議論して決定。③誰も抽出しなかった項目は理由を確認した上で対象外とする。"
      },
      {
        step: 4,
        title: "真の失敗原因の特定",
        description: "Step3で選定した全項目を関係者で議論し、最も影響度の高い『真の失敗原因（真因）』を特定する。"
      },
      {
        step: 5,
        title: "再発防止策の検討",
        description: "特定された『真の失敗原因』に対して、用語解説＆再発防止策の知見を参考にしながら具体的なアクションプランを検討する。"
      }
    ]
  },

  // 大分類（4領域）の定義
  domains: [
    {
      id: "individual",
      label: "個人",
      fullLabel: "「個人」に起因する失敗原因",
      description: "個人の知識・経験・注意力・判断・手順順守など、個人の行動や状態に起因する失敗原因。",
      color: "#3b82f6",
      bgTint: "rgba(59, 130, 246, 0.08)",
      borderColor: "#2563eb",
      badgePos: { x: 110, y: 70 }
    },
    {
      id: "project",
      label: "プロジェクト",
      fullLabel: "「プロジェクト」に起因する失敗原因",
      description: "当該プロジェクト特有の企画・計画、事前調査・要件検討、およびプロジェクト運営・管理に起因する失敗原因。",
      color: "#10b981",
      bgTint: "rgba(16, 185, 129, 0.07)",
      borderColor: "#059669",
      badgePos: { x: 1490, y: 70 }
    },
    {
      id: "organization",
      label: "組織",
      fullLabel: "「組織（プロジェクト外）」に起因する失敗原因",
      description: "企業風土・組織文化・標準化・教育体制・上位層の利権争いや外部環境変化への対応など、プロジェクト外の母体組織や環境に起因する失敗原因。",
      color: "#f59e0b",
      bgTint: "rgba(245, 158, 11, 0.08)",
      borderColor: "#d97706",
      badgePos: { x: 800, y: 1130 }
    },
    {
      id: "unknown",
      label: "未知",
      fullLabel: "「未知（どこにも属さない）」の失敗原因",
      description: "プロジェクト開始前には誰も想定できないような未知の事象や未曽有の災害・テロ等の異常現象。",
      color: "#8b5cf6",
      bgTint: "rgba(139, 92, 246, 0.08)",
      borderColor: "#7c3aed",
      badgePos: { x: 110, y: 890 }
    }
  ],

  // 第1階層（10分類）と第2階層（54項目）の階層定義
  categories: [
    // ==========================================
    // 1. 個人 (Individual)
    // ==========================================
    {
      id: "procedure_noncompliance",
      domainId: "individual",
      label: "手順の不順守",
      definition: "決められた手順を守らないこと。",
      angle: 230, // 左上
      items: [
        {
          id: "proc_ignore",
          label: "手順無視",
          definition: "手順があるにも関わらず、その手順がないがごとく振る舞い、過去の経験や勘で実施してしまうこと。",
          examples: [],
          countermeasures: [
            "手順が持つ目的・背景（なぜその手順が必要か）の教育と徹底",
            "相互レビューや証跡確認による独断作業の防止"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "proc_lack_awareness",
          label: "周知不足",
          definition: "関係者に広く知らせる必要がある情報・決まり事を知らせていないこと。新規メンバーに対して、手順やルールを知らせていないこと。",
          examples: [],
          countermeasures: [
            "新規参画者向けオンボーディング資料・ルールブックの整備と説明会の義務化",
            "ルール変更時の周知プロセスと既読・理解確認の仕組み化"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "proc_lack_imagination",
          label: "想像力不足",
          definition: "手順を守らなかった場合や、例外的な操作を行った場合にどのような悪影響・リスクが波及するかを想像できていないこと。",
          examples: [
            "手順を一部省略しても後続工程や本番環境に影響はないだろうと軽く考えて作業を進める。"
          ],
          countermeasures: [
            "過去のトラブル事例・ヒヤリハット共有によるリスク感度の向上",
            "作業前のリスク予知（KY活動）の実施"
          ],
          sourceEdition: "expanded_54"
        },
        {
          id: "proc_formalization",
          label: "形骸化",
          definition: "形式的に手順通り実施しているものの、手順の意味や内容を十分に理解していないこと。",
          examples: [
            "チェックリスト作成において、チェック項目が膨大で、一つ一つの項目を十分に確認せずにチェックしている。"
          ],
          countermeasures: [
            "形骸化した膨大なチェックリストの棚卸しと重要項目への絞り込み",
            "チェック結果だけでなく根拠（エビデンス）の記録を求める運用への見直し"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "misjudgment",
      domainId: "individual",
      label: "誤判断",
      definition: "誤った判断をすること。",
      angle: 198, // 左やや上
      items: [
        {
          id: "mis_narrow_vision",
          label: "狭い視野",
          definition: "広い知見が必要な場合でも自己の知識エリアで判断してしまうこと。",
          examples: [],
          countermeasures: [
            "異なる専門領域・他部門の有識者を交えた多角的な設計・判断レビュー",
            "一人で抱え込まずエスカレーション・相談する基準の明確化"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "mis_wrong_understanding",
          label: "誤った理解",
          definition: "意味・内容の解釈を誤って、判断を誤ること。",
          examples: [
            "工数見積り段階で削除の可否判断基準の理解が不足し、必要なリスク工数まで削減してしまう。"
          ],
          countermeasures: [
            "口頭伝達を避け、図表やプロトタイプを用いた認識合わせ（復唱・言語化）の実施",
            "判断基準・前提条件の明文化"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "mis_wrong_info",
          label: "誤った情報",
          definition: "収集した情報が適切ではなかったことから、判断を誤ること。",
          examples: [],
          countermeasures: [
            "一次情報（原典・実機・現場の事実）の直接確認と情報の裏付け（ファクトチェック）",
            "伝聞や古いドキュメントのみに依拠した意思決定の禁止"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "mis_lack_situation_grasp",
          label: "状況把握不足",
          definition: "現在の状況・状態の把握が不足し、判断を誤ること。",
          examples: [],
          countermeasures: [
            "現場の定量データ・実態の可視化（メトリクス監視、現地現物確認）",
            "問題の兆候を早期に吸い上げる定例報告・アラート体制の構築"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "carelessness",
      domainId: "individual",
      label: "不注意",
      definition: "十分に注意すれば防げた事象。",
      angle: 175, // 左
      items: [
        {
          id: "care_lack_attention",
          label: "注意不足",
          definition: "万一に備えての注意・警戒を怠りミスを犯すこと。",
          examples: [],
          countermeasures: [
            "人間の注意力だけに頼らないポカヨケ（自動化、フールプルーフ、警告表示）の導入",
            "本番作業時のダブルチェック（ペア作業）や指差し確認の実施"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "care_fatigue_poor_health",
          label: "疲労・体調不良",
          definition: "個人的理由・外的理由において、疲労がたまったり体調を崩し、作業能力が低下すること。",
          examples: [],
          countermeasures: [
            "稼働時間・残業時間のモニタリングと無理のないタスク配分",
            "深夜・休日作業後の代休取得徹底と、体調不良時に申告しやすいチーム作り"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "ignorance",
      domainId: "individual",
      label: "無知",
      definition: "個人の知識や経験等が不足していることから、対応や判断を誤ること。",
      angle: 154, // 左下寄り
      items: [
        {
          id: "ign_poor_handover",
          label: "引き継ぎ不良",
          definition: "引継ぎを忘れてしまうこと。引き継がれたことを忘れること。",
          examples: [],
          countermeasures: [
            "引き継ぎ標準テンプレートの用意と、ドキュメントに基づく引き継ぎ完了確認",
            "一定期間の並走期間（OJT・逆OJT）の設定"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ign_lack_experience",
          label: "経験不足",
          definition: "書籍や研修等で基本的な知識は習得しているが、実業務へ適応する応用力が欠けていること。",
          examples: [],
          countermeasures: [
            "経験豊富なメンター・レビュアーの配置と段階的なタスク付与",
            "過去の類似プロジェクト事例・トラブル事例の事前学習"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ign_lack_knowledge",
          label: "知識不足",
          definition: "知識が足りないために、判断・考慮が出来ないこと。",
          examples: [
            "ユーザ部門の業務知識や通信技術に関する知識が不足し、問題に気付けない。",
            "PMとしてのプロジェクトマネジメント知識が不足しているため、進め方や情報連携の方法を確立できない。"
          ],
          countermeasures: [
            "ユーザ部門・システム部門双方でのシステム技術・業務知識に関する勉強会の実施",
            "PM候補者を対象としたプロジェクトマネジメント研修の実施と有識者による支援"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },

    // ==========================================
    // 2. 未知 (Unknown)
    // ==========================================
    {
      id: "unknown_cause",
      domainId: "unknown",
      label: "未知",
      definition: "プロジェクト開始前には誰も想定できないような事象。",
      angle: 135, // 左下（個人と組織の境界領域）
      items: [
        {
          id: "unk_abnormal_phenomenon",
          label: "異常事象の発生",
          definition: "有史以来無かったような自然災害・テロ等の想定外の事象（旧表記：異常現象）。",
          examples: [
            "大規模自然災害、パンデミック、大規模停電や社会インフラの途絶など。"
          ],
          countermeasures: [
            "BCP（事業継続計画）およびコンティンジェンシープランの策定",
            "拠点やクラウドリージョンの冗長化・バックアップ体制の整備"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "unk_unknown_event",
          label: "未知の事象発生",
          definition: "誰も知らない事象（未知のバグ、世の中に前例のない技術的挙動など）。",
          examples: [],
          countermeasures: [
            "事象発生時の迅速なエスカレーションとベンダ・コミュニティ連携体制の構築",
            "段階的リリース（カナリアリリース）やフォールバック（切り戻し）手順の用意"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },

    // ==========================================
    // 3. プロジェクト (Project)
    // ==========================================
    {
      id: "poor_planning",
      domainId: "project",
      label: "企画・計画不良",
      definition: "プロジェクト立ち上げ段階での企画・計画が不十分であること。",
      angle: 282, // 上（やや右）
      items: [
        {
          id: "plan_poor_purpose",
          label: "目的不良",
          definition: "『なぜ、情報システムを変えるのか』、『新しい情報システムによって何を達成するのか』が曖昧で、情報システムを構築することそのものが目的化してしまっていること。",
          examples: [
            "システムが計画通りに完成したものの、現場の抵抗にあって導入に至らない、システム導入後の現場に混乱が生じてしまう、導入されても本来の使い方で使われない。",
            "機器の一元管理が第一目的であるにもかかわらず、UI（インターフェース）の充実化が目的になってしまう。"
          ],
          countermeasures: [
            "企画段階でのKGI/KPI（達成すべき業務目標）の明確化とステークホルダー間での合意",
            "スコープ変更や要件追加時に「本来の目的に合致するか」を立ち返る仕組みの徹底"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_misrecognized_importance",
          label: "重要性の認識誤り",
          definition: "プロジェクト失敗による経営や現場に対する波及効果や度合いが不明で、経営層とプロジェクト側でプロジェクトの重要性認識が相違すること。",
          examples: [
            "結果として、経営層の関与不足や能力の高いメンバーがアサインされないといったケースが発生する。"
          ],
          countermeasures: [
            "プロジェクト憲章（Project Charter）による経営上の位置づけ・ビジネスインパクトの明文化",
            "エグゼクティブスポンサーの特定と定期的なステアリングコミッティの開催"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_scope",
          label: "スコープ不良",
          definition: "プロジェクトの目標を達成するために必要な成果物とタスクが不明確であったり共通認識がされていないことにより、後に対応範囲を安易に広げることで、コスト・工期が計画をオーバーするケースが発生する。",
          examples: [],
          countermeasures: [
            "「やること（In Scope）」と「やらないこと（Out of Scope）」の境界線の明文化と合意",
            "WBSおよび成果物定義一覧によるスコープのベースライン管理"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_structure_roles",
          label: "体制・役割不良",
          definition: "顧客等ステークホルダーを含めたプロジェクトの体制が十分でなかったり、各々の役割が明確でないこと。",
          examples: [
            "ユーザ部門の参画不足や、誰にも着手されない「ポテンヒット」のタスクが多発する。",
            "能力の高いメンバーや業務に精通したメンバーがアサインされないで、業務要件漏れや不具合が多発する。"
          ],
          countermeasures: [
            "RACIチャート等を用いたユーザ部門・開発部門・ベンダ間の役割と責任分担の明確化",
            "ユーザ部門・システム部門の関係者での定例会議による体制・役割の機能状況確認"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_estimation",
          label: "見積もり不良",
          definition: "プロジェクト完成までどのくらいの月日が必要で、コストがいくらかかるかの見積もりミス（楽観的な見積もり）により、工程遅延やコスト超過を引き起こすこと。",
          examples: [],
          countermeasures: [
            "過去実績データや複数手法（類推見積もり、FP法、ボトムアップ見積もり）の組み合わせによる妥当性検証",
            "不確実性に応じた段階的見積もりとリスクバッファの明示的な計上"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_comm_plan",
          label: "コミュニケーション計画不良",
          definition: "多数のステークホルダーと効率的かつ確実にコミュニケーションをとる計画が不足していること。コミュニケーションロスの発生は、プロジェクトの進行に深い影響を及ぼす。",
          examples: [
            "各々のステークホルダーに配布する情報の内容、フォーマット、伝達手段、配布ルート、会議開催計画等が定められていない。"
          ],
          countermeasures: [
            "プロジェクト初期での会議体設計・報告ルート・エスカレーション基準の定義",
            "情報共有基盤（ドキュメント管理・課題管理ツール）の統一"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_schedule",
          label: "スケジュール不良",
          definition: "作業タスクの漏れや必要期間の見積もり漏れ、リスクのための予備を考慮していない、最初から残業を前提とした計画など、プロジェクト計画時に策定したスケジュールに不備があること。また、大きなスケジュールのみで、WBSの設定ができていないこと。",
          examples: [],
          countermeasures: [
            "クリティカルパスとタスク間の依存関係を明確にしたWBSの策定",
            "過度な並行作業や残業前提を排した現実的なカレンダーとバッファの設定"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_vendor_selection",
          label: "委託先選定不良",
          definition: "委託先の能力や実績などを評価せず、見積りコストや政治的圧力により委託先を選定したことにより、納期遅延やトラブルの多発を引き起こすこと。",
          examples: [],
          countermeasures: [
            "価格だけでなく技術力・ドメイン経験・体制・提案内容を多面的に評価する選定基準（評価表）の導入",
            "キーマン（PM・アーキテクト）の面談・スキル確認の実施"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "plan_poor_contract_terms",
          label: "契約条件不良",
          definition: "契約書が不明瞭（変更プロセス、中断の扱い、前提条件、納品成果物、瑕疵担保責任、役割分担など）なことにより、後にトラブルが発生すること。発注元から無理な契約条件を強いられ、結果として納期遅延やコスト超過を起こしてしまうこと。",
          examples: [],
          countermeasures: [
            "契約前の前提条件・役割分担・変更管理手続き・検収基準の徹底的なすり合わせ",
            "法務・審査部門を交えた契約リスクレビューの実施"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "insufficient_investigation",
      domainId: "project",
      label: "調査・検討不足",
      definition: "プロジェクト開始前・実行中に実施する、あらゆる検討不足。",
      angle: 332, // 右上
      items: [
        {
          id: "inv_business_flow",
          label: "現行業務フロー調査不足",
          definition: "現行業務フローの洗い出しが漏れていたり、誤っていることにより、システムの仕様漏れや仕様誤りが発生すること。",
          examples: [],
          countermeasures: [
            "現場担当者へのヒアリングだけでなく、実際の業務現場の観察・帳票/データの現物確認",
            "例外処理や月次・年次・繁忙期特有の業務フローの網羅的な洗い出し"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "inv_technology",
          label: "技術調査不足",
          definition: "プロジェクトで導入する新技術や開発手法、システム環境に関しての調査が不十分であることが原因で、想定していなかった不具合や工数増が発生すること。",
          examples: [
            "WAN環境での通信パフォーマンスやレスポンスに関する事前検証を行わず、終盤のテストで問題が発覚して頓挫する。"
          ],
          countermeasures: [
            "本格開発前のPoC（概念実証）・プロトタイプ検証による技術的制約や性能限界の確認",
            "非機能要件（性能・セキュリティ・可用性）の早期検証"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "inv_system_impact",
          label: "システム影響調査不足",
          definition: "プロジェクトでの開発内容が、自システム既存機能や他システムとどのような関係があるかの調査が不十分であることが原因で、想定していなかった不具合や工数増が発生すること。",
          examples: [
            "他システム連動データの確認不足、自システム変更要求への影響把握漏れ。"
          ],
          countermeasures: [
            "システム連関図・データフロー図・CRUDマトリクスを用いた影響範囲の体系的特定",
            "連携先システム担当者との早期インターフェース合意と合同テスト計画の策定"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "inv_business_review_accuracy",
          label: "業務検討精度不良",
          definition: "業務要件の漏れや曖昧さにより、その後の設計・製造フェーズでユーザ側への確認が多発したり、不具合が発生すること。",
          examples: [
            "システムを使用した実務（To-Be業務）を十分に想定できておらず、検証段階で要件不足に気付く。"
          ],
          countermeasures: [
            "業務シナリオ・ユースケースに基づく机上シミュレーション（仮想演習）の実施",
            "曖昧な表現を排除した要件定義レビューと画面・帳票プロトタイプによる実務確認"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "inv_migration_review",
          label: "移行検討不足",
          definition: "業務面およびシステム面での移行方法の検討が不十分であることが原因で、移行作業失敗や移行直後の業務の混乱が発生すること。",
          examples: [],
          countermeasures: [
            "要件定義・基本設計段階からの早期の移行計画（データ移行・業務移行・教育）の立案",
            "本番同等データを用いた移行リハーサルと切り戻し手順の実証"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "poor_project_operations",
      domainId: "project",
      label: "プロジェクト運営不良",
      definition: "プロジェクト自体の問題やプロジェクト運営上管理すべき事項について不良があること。",
      angle: 18, // 右下寄り
      items: [
        {
          id: "ops_poor_members",
          label: "構成員不良",
          definition: "開発側のプロジェクト体制においてプロジェクトスコープ、変更要求に見合ったスキル・知識・権限保有メンバーがアサインされていないこと。",
          examples: [],
          countermeasures: [
            "必要スキル定義に基づくアサインと、不足スキルを補う有識者・支援チームの配置",
            "キーマンの負荷集中・属人化の解消"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_comm_mgmt",
          label: "コミュニケーション管理不良",
          definition: "伝達が相手に理解されない、間違った情報を相手に与えてしまうなど、円滑な意思疎通が図れていないこと。",
          examples: [],
          countermeasures: [
            "決定事項・宿題事項の議事録化と双方での合意確認",
            "心理的安全性の確保と、悪い情報（懸念・遅延）ほど早く上げられる雰囲気づくり"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_quality_mgmt",
          label: "品質管理不良",
          definition: "作業結果の品質が適正かの判断ができないまたは、判断してないなど、品質の管理ができてないこと。",
          examples: [],
          countermeasures: [
            "各工程の完了基準（Exit Criteria）と品質メトリクス（レビュー密度・摘出欠陥数）の設定・分析",
            "形骸化しない第三者・有識者レビュー（ピアレビュー、品質ゲート）の実施"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_cost_mgmt",
          label: "コスト管理不良",
          definition: "承認された予算をオーバーするなど不必要なコストを発生させていること。",
          examples: [],
          countermeasures: [
            "EVM（アーンド・バリュー・マネジメント）等による予実対比と完了時総コスト見通し（EAC）の定期算出",
            "コスト超過の予兆段階での早期対策打診"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_progress_mgmt",
          label: "進捗管理不良",
          definition: "進捗遅れや未稼働のメンバーが発生するなど進捗が適切に管理されていないこと。",
          examples: [],
          countermeasures: [
            "自己申告の進捗率（90%症候群）ではなく、成果物の完了有無（0/100またはマイルストーン）による客観的進捗把握",
            "遅延タスクに対する原因分析とリカバリ施策の即時実行"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_risk_mgmt",
          label: "リスク管理不良",
          definition: "想定していなかった問題が発生するなど、リスクの想定や対応が不完全なこと。",
          examples: [],
          countermeasures: [
            "リスク管理表によるリスクの定期的な洗い出し・影響度/発生確率の評価・予防策の事前準備",
            "マンダラ図の過去統計を活用した類似案件リスクの事前ヘッジ"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_issue_mgmt",
          label: "課題管理不良",
          definition: "要員不足による納期遅れでプロジェクト運営に支障を発生させてしまうなど、課題の認識や解決がうまくいかないこと。",
          examples: [],
          countermeasures: [
            "課題管理台帳の一元化と、担当者・期限・優先度・エスカレーション基準の明確化",
            "期限超過課題の棚卸しと意思決定者による迅速な判断"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_change_mgmt",
          label: "変更管理不良",
          definition: "変更発生時の起案・承認・実施のプロセスが整備されていないこと。",
          examples: [],
          countermeasures: [
            "仕様変更要求に対する影響調査（QCDへの影響見積もり）と変更管理委員会（CCB）での正式承認プロセスの徹底",
            "口頭や現場判断でのなし崩し的な仕様変更の禁止"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "ops_poor_config_mgmt",
          label: "構成管理不良",
          definition: "新旧のファイルが混在するなど、成果物のバージョン管理や保存場所などが管理されていないこと。",
          examples: [
            "古い設計書をもとに実装してしまい手戻りが発生する、ソースコードの先祖返りが起きる。"
          ],
          countermeasures: [
            "Git等のバージョン管理システムやドキュメント単一情報源（SSOT）の徹底",
            "リリースビルド・環境構成の自動化と変更履歴の追跡性確保"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },

    // ==========================================
    // 4. 組織 (Organization)
    // ==========================================
    {
      id: "poor_env_adaptation",
      domainId: "organization",
      label: "環境変化への対応不良",
      definition: "様々な環境の変化に対して、適切に対応できていないこと。",
      angle: 64, // 下（やや右）
      items: [
        {
          id: "env_rigid_operations",
          label: "運営の硬直化",
          definition: "組織やプロジェクトの運営が形式的・前例踏襲的となり、環境変化に対して意思決定が迅速・柔軟に行えていないこと（2014年版では『プロジェクト運営不良』配下、54項目版では環境変化への対応不良にも位置づけ）。",
          examples: [],
          countermeasures: [
            "権限移譲とエスカレーションパスの簡素化による意思決定スピードの向上",
            "前提条件が変化した際に計画を見直すアジャイル的・適応的なガバナンスの導入"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "env_sw_hw_change",
          label: "ソフト・ハード環境変化",
          definition: "ソフトウェアのバージョンアップなど、システムを使用する環境が変化すること（旧表記：ソフトウェア・ハードウェアの環境変化）。",
          examples: [
            "端末のOSがWindows 7にかわることにより今まで使用できていたファイルやシステムが使用できなくなる。"
          ],
          countermeasures: [
            "OS・ミドルウェア・クラウドサービスのEOSL（サポート終了）ロードマップの継続的把握",
            "環境変化を見越した疎結合アーキテクチャ設計と早期互換性検証"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "env_system_usage_change",
          label: "システム使用方法の変化",
          definition: "ビジネスモデルや業務形態、ユーザーのシステム利用方法・利用頻度が当初の想定から変化したにもかかわらず、システムや運用が追随できていないこと。",
          examples: [
            "社内利用前提だったシステムを社外・モバイルから大量アクセスする使い方に変わったが、設計や運用を見直さず障害に至る。"
          ],
          countermeasures: [
            "利用実態・トラフィック・ユーザー行動の継続的モニタリング",
            "業務や利用形態の変化に応じたアーキテクチャ・運用ルールの定期的見直し"
          ],
          sourceEdition: "expanded_54"
        },
        {
          id: "env_economic_change",
          label: "経済環境変化",
          definition: "経済的な環境が変化することにより、プロジェクトの進行に影響があること。",
          examples: [
            "会社の経営悪化に伴い、費用が削減されること（自社／お客様）。",
            "お客様側の経営破たんによるプロジェクト中断／中止。"
          ],
          countermeasures: [
            "プロジェクトの段階的投資（フェーズ分割・MVPリリース）による投資リスクの分散",
            "契約時の中断・解約条項および精算条件の明確化"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "env_aging",
          label: "年齢（高齢化）",
          definition: "組織や現場の要員の高齢化・世代構成の変化により、新技術への適応遅れやレガシー技術者の退職による保守困難、世代間の認識ギャップが生じること。",
          examples: [
            "ベテラン社員の定年退職により既存システムのブラックボックス化が進み、刷新プロジェクトで仕様が解明できない。"
          ],
          countermeasures: [
            "レガシー資産の計画的なドキュメント化・可視化と次世代への技術伝承",
            "利用者の年齢層やITリテラシーに配慮したUI/UX設計と段階的な移行・教育支援"
          ],
          sourceEdition: "expanded_54"
        },
        {
          id: "env_law_change",
          label: "法令変化",
          definition: "法令が見直されることで、プロジェクト推進上、方向転換が必要になること。もしくはプロジェクトが中止になること。",
          examples: [],
          countermeasures: [
            "法改正・制度変更情報の早期キャッチアップと業務・システムへの影響評価",
            "税率や制度パラメータ等をハードコーディングせず設定変更可能な設計にする"
          ],
          sourceEdition: "2014_original"
        }
      ]
    },
    {
      id: "poor_values",
      domainId: "organization",
      label: "価値観不良",
      definition: "プロジェクトにかかわる人（お客様、協力会社、ベンダー）との価値観があわないこと、または組織の価値観・風土に歪みがあること。",
      angle: 106, // 下（やや左）
      items: [
        {
          id: "val_external_politics",
          label: "プロジェクト外の利権争い・駆け引き",
          definition: "上位層（管理職、経営層含め）の利権争いにより、正しいとは言えないプロジェクト方針を打ち出されたために、プロジェクトに悪影響が及ぶこと。",
          examples: [],
          countermeasures: [
            "プロジェクトの目的・評価基準の客観化と、ステアリングコミッティでの透明性のある意思決定",
            "第三者（システム監査・PMO）の関与による客観的な牽制機能の導入"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_result_supremacy",
          label: "成果至上主義",
          definition: "最終成果でのみ人事評価をする文化等が影響し、無理な受注や悪いことを隠す、他メンバーを助けない等の事象を引き起こすこと。",
          examples: [
            "営業担当者が営業成績を重視し、実現不可能な条件で無理なプロジェクトを受注する。"
          ],
          countermeasures: [
            "受注前のプロジェクト審査会（リスク審査・採算性/実現性チェック）による牽制",
            "個人の短期売上だけでなくプロセスやチーム貢献・品質を評価する人事評価制度への見直し"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_wrong_customer_orientation",
          label: "間違った顧客志向",
          definition: "ユーザ部門に言われたままに対応することが正しいと理解していることから、なし崩し的にスコープが広がり、コストや納期に影響を及ぼしてしまうこと。",
          examples: [
            "顧客作成のRFPに問題があることを察知しながら、それを顧客に伝えようとしない。",
            "顧客志向のあまり、性能やリスクのコントロールを考慮せず要望をすべて飲み込んでしまう。"
          ],
          countermeasures: [
            "「顧客の言いなりの御用聞き」ではなく「顧客の真の目的達成のためにダメなものはダメと提言するパートナー」という価値観の共有",
            "要望の追加・変更に対するトレードオフ（コスト・納期・品質への影響）の提示と合意形成"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_lack_security_awareness",
          label: "セキュリティー意識不足",
          definition: "関係者のセキュリティに対する意識が低いこと（2014年版表記：セキュリティ意識不足）。",
          examples: [
            "開発者が安易に本番環境システムにアクセスする、本番データを無断で開発環境へ持ち出す。"
          ],
          countermeasures: [
            "継続的なセキュリティ教育と、権限分離・アクセス制御による物理的/システム的な統制",
            "企画・設計段階からのセキュリティバイデザイン（脅威分析・セキュリティレビュー）の組み込み"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_poor_org_culture",
          label: "組織文化の不良",
          definition: "失敗を隠蔽する空気、悪い報告を上げにくい縦割り風土、丸投げ体質など、組織全体に根付いた不健全な企業文化・風土。",
          examples: [
            "トラブルの兆候に気づいていても「言い出しっぺが損をする」「怒られる」空気があり、問題が致命的になるまで表面化しない。"
          ],
          countermeasures: [
            "犯人探しをせず原因究明と学びに集中するAAR（After Action Review）/ ブレイムレス文化の醸成",
            "バッドニュース・ファースト（悪い報告ほど歓迎し評価する）の経営・マネジメント姿勢の徹底"
          ],
          sourceEdition: "expanded_54"
        },
        {
          id: "val_culture_common_sense_gap",
          label: "文化・常識の違い",
          definition: "お客様や協力会社との文化・意識の違いがあるために折り合いがつかないこと。",
          examples: [
            "要件定義はどちらの責任か、ユーザ部門の「承認」行為の意味の違いなど、暗黙の常識が異なる。"
          ],
          countermeasures: [
            "「暗黙の了解」に頼らず、用語・成果物の定義・責任分界点をプロジェクト初期に明文化してすり合わせる",
            "お互いの業界・組織の商習慣や背景の違いを理解するための対話の場を設ける"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_poor_safety_awareness",
          label: "安全意識の不良",
          definition: "システムの安全性・信頼性やリスクに対する組織としての危機意識が低く、「今まで大丈夫だったから今回も大丈夫だろう」と安全投資やリスク対策を軽視すること。",
          examples: [
            "リスク部分の予備工数を「無駄」とみなして親会社や上位層が削減してしまう。"
          ],
          countermeasures: [
            "システム障害や事故が社会・経営に与える損害コストの定量化と経営層への提示",
            "安全・品質・非機能要件に対する投資基準の組織的なルール化"
          ],
          sourceEdition: "expanded_54"
        },
        {
          id: "val_lack_knowhow_accumulation",
          label: "ノウハウ蓄積不足",
          definition: "ノウハウをためる文化がなく、同じ失敗を繰り返したり、自社に保有するスキルが低下すること。",
          examples: [
            "ユーザとシステム開発部門で過去の失敗事例から学んだノウハウの蓄積ができておらず、別プロジェクトで同じ失敗を繰り返す。"
          ],
          countermeasures: [
            "プロジェクト終了後の振り返り（AAR・マンダラ図分析）の制度化とナレッジベースへの蓄積",
            "新規プロジェクト立ち上げ時に過去の類似プロジェクトの失敗教訓を参照するプロセスの組み込み"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_lack_education",
          label: "教育不足",
          definition: "教育の重要性を軽視していること。",
          examples: [
            "作業手順の教育が不足しており、作業が遵守されない。",
            "教育が不足しているメンバーをそのままアサインし、プロジェクト推進が思うように進まない。"
          ],
          countermeasures: [
            "組織としての体系的な人材育成カリキュラム（PM教育、技術教育、品質教育）の整備",
            "マンダラ図を用いた若手社員の失敗振り返り・原因分析トレーニングの実施"
          ],
          sourceEdition: "2014_original"
        },
        {
          id: "val_lack_standardization",
          label: "標準化不足",
          definition: "開発プロセスが標準化されておらず、個々人がばらばらの方法で開発を進めることにより、生産性の悪化や品質が安定しないこと。",
          examples: [
            "開発時の各工程のフォーマット、記載ルールなどが標準化されておらず、担当者ごとに記載レベルが異なり、品質が安定しない。"
          ],
          countermeasures: [
            "開発標準プロセス・設計書テンプレート・コーディング規約・レビュー基準の整備と継続的改善",
            "ツール（Linter、CI/CD、テンプレート）による標準化の自動強制"
          ],
          sourceEdition: "2014_original"
        }
      ]
    }
  ]
};

