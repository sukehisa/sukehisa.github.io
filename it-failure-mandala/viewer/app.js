/**
 * 【ITプロジェクト版】失敗原因マンダラ図 Viewer Application
 *
 * データ (`window.MANDALA_DATA`) と完全に分離されたレンダリング＆分析エンジン。
 * `data/mandala_data.js` の階層・定義を変更すると、SVGマンダラ図・一覧表・分析シートがすべて動的に再構築されます。
 */
(function () {
  "use strict";

  const STORAGE_KEY_CUSTOM_DATA = "it_failure_mandala_custom_data_v1";
  const STORAGE_KEY_RCA_STATE = "it_failure_mandala_rca_state_v1";
  const STORAGE_KEY_THEME = "it_failure_mandala_theme_v1";

  // 状態管理
  const state = {
    data: null,
    selectedNode: null, // { type: 'center' | 'domain' | 'category' | 'item', id: string }
    filterDomain: "all", // 'all' | domainId
    filterEdition: "all", // 'all' | '2014_original' | 'expanded_54'
    filterRcaOnly: false,
    searchQuery: "",
    activeTab: "mandala", // 'mandala' | 'dictionary' | 'rca' | 'editor'
    // ズーム＆パン状態 (SVG viewBox 1600 x 1200)
    transform: { x: 0, y: 0, scale: 1 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    // RCA振り返りワークシート状態
    rca: {
      projectName: "",
      analysisDate: new Date().toISOString().slice(0, 10),
      participants: "",
      summaryIncident: "",
      actionPlan: "",
      items: {} // itemId -> { status: 'none' | 'suspect' | 'root', comment: string }
    }
  };

  // 初期化
  function init() {
    loadTheme();
    loadData();
    loadRcaState();
    bindEvents();
    renderAll();
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === "light") {
      document.body.classList.add("theme-light");
    }
  }

  function toggleTheme() {
    document.body.classList.toggle("theme-light");
    const isLight = document.body.classList.contains("theme-light");
    localStorage.setItem(STORAGE_KEY_THEME, isLight ? "light" : "dark");
    renderMandalaSvg();
  }

  function loadData() {
    const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_DATA);
    if (savedCustom) {
      try {
        state.data = JSON.parse(savedCustom);
        return;
      } catch (e) {
        console.warn("Failed to parse custom mandala data from localStorage, falling back to default.", e);
      }
    }
    state.data = JSON.parse(JSON.stringify(window.MANDALA_DATA));
  }

  function saveCustomData(newData) {
    state.data = newData;
    localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(newData));
    renderAll();
  }

  function resetToDefaultData() {
    if (!confirm("ブラウザ上のカスタマイズを破棄し、`data/mandala_data.js` の初期定義に戻しますか？")) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
    state.data = JSON.parse(JSON.stringify(window.MANDALA_DATA));
    renderAll();
  }

  function loadRcaState() {
    const saved = localStorage.getItem(STORAGE_KEY_RCA_STATE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.rca = Object.assign(state.rca, parsed);
      } catch (e) {
        console.warn("Failed to parse RCA state", e);
      }
    }
  }

  function saveRcaState() {
    localStorage.setItem(STORAGE_KEY_RCA_STATE, JSON.stringify(state.rca));
    updateRcaBadgeCount();
  }

  // ヘルパー関数: IDからデータ要素を検索
  function getDomainMap() {
    const map = {};
    state.data.domains.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }

  function findNodeById(type, id) {
    const domainMap = getDomainMap();
    if (type === "center") {
      return { type: "center", data: state.data.meta };
    }
    if (type === "domain") {
      return { type: "domain", data: domainMap[id] };
    }
    for (const cat of state.data.categories) {
      if (type === "category" && cat.id === id) {
        return {
          type: "category",
          data: cat,
          domain: domainMap[cat.domainId]
        };
      }
      for (const item of cat.items) {
        if (type === "item" && item.id === id) {
          return {
            type: "item",
            data: item,
            category: cat,
            domain: domainMap[cat.domainId]
          };
        }
      }
    }
    return null;
  }

  // フィルタ判定
  function isItemVisible(item, cat) {
    if (state.filterDomain !== "all" && cat.domainId !== state.filterDomain) {
      return false;
    }
    if (state.filterEdition !== "all" && item.sourceEdition !== state.filterEdition) {
      return false;
    }
    if (state.filterRcaOnly) {
      const rcaEntry = state.rca.items[item.id];
      if (!rcaEntry || rcaEntry.status === "none") {
        return false;
      }
    }
    if (state.searchQuery.trim() !== "") {
      const q = state.searchQuery.trim().toLowerCase();
      const hay = [
        item.label,
        item.definition,
        cat.label,
        ...(item.examples || []),
        ...(item.countermeasures || [])
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) {
        return false;
      }
    }
    return true;
  }

  function isCategoryVisible(cat) {
    if (state.filterDomain !== "all" && cat.domainId !== state.filterDomain) {
      return false;
    }
    return cat.items.some((item) => isItemVisible(item, cat));
  }

  // =========================================================================
  // SVG マンダラ図の動的レイアウト＆レンダリング
  // =========================================================================
  function renderMandalaSvg() {
    const svg = document.getElementById("mandala-svg");
    if (!svg) return;

    const W = 1600;
    const H = 1200;
    const CX = 820;
    const CY = 580;

    const isLight = document.body.classList.contains("theme-light");
    const domainMap = getDomainMap();

    // 1. 背景セクター（個人 / プロジェクト / 組織 / 未知）のポリゴン描画
    // 元画像の幾何学的な斜め分割・4領域の構図を再現しつつカラーアクセントを付与
    const bgPolygons = [
      {
        domainId: "individual",
        points: `0,0 460,0 ${CX},${CY} 0,760`,
        fill: isLight ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.11)"
      },
      {
        domainId: "unknown",
        points: `0,760 ${CX},${CY} 0,1080`,
        fill: isLight ? "rgba(139, 92, 246, 0.09)" : "rgba(139, 92, 246, 0.12)"
      },
      {
        domainId: "project",
        points: `460,0 ${W},0 ${W},${H} 1480,${H} ${CX},${CY}`,
        fill: isLight ? "rgba(16, 185, 129, 0.06)" : "rgba(16, 185, 129, 0.08)"
      },
      {
        domainId: "organization",
        points: `0,1080 ${CX},${CY} 1480,${H} 0,${H}`,
        fill: isLight ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.11)"
      }
    ];

    let html = `<g id="mandala-viewport" transform="translate(${state.transform.x}, ${state.transform.y}) scale(${state.transform.scale})">`;

    // 背景セクター描画
    html += `<g class="layer-sectors">`;
    bgPolygons.forEach((sec) => {
      const dimmed = state.filterDomain !== "all" && state.filterDomain !== sec.domainId;
      html += `<polygon points="${sec.points}" fill="${sec.fill}" stroke="${
        isLight ? "#cbd5e1" : "#1e293b"
      }" stroke-width="1.5" opacity="${dimmed ? 0.25 : 1}" />`;
    });
    html += `</g>`;

    // 大分類（4領域）のコーナーラベル描画
    html += `<g class="layer-domain-badges">`;
    state.data.domains.forEach((dom) => {
      const pos = dom.badgePos || { x: 100, y: 80 };
      const isSelected = state.selectedNode && state.selectedNode.type === "domain" && state.selectedNode.id === dom.id;
      const dimmed = state.filterDomain !== "all" && state.filterDomain !== dom.id;
      const bw = Math.max(110, dom.label.length * 22 + 36);
      const bh = 44;
      html += `
        <g class="node-group ${isSelected ? "selected" : ""} ${dimmed ? "dimmed" : ""}"
           data-node-type="domain" data-node-id="${dom.id}"
           transform="translate(${pos.x}, ${pos.y})">
          <rect class="node-rect" x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="8"
                fill="${isLight ? "#ffffff" : "#1e293b"}"
                stroke="${dom.color}" stroke-width="2.5" />
          <text x="0" y="6" text-anchor="middle" fill="${isLight ? "#0f172a" : "#f8fafc"}"
                font-size="18" font-weight="700">${escapeHtml(dom.label)}</text>
        </g>
      `;
    });
    html += `</g>`;

    // ノード座標計算 + 衝突回避（重なりゼロ保証）レイアウトエンジン
    const catLayouts = [];
    const itemLayouts = [];

    const R1_X = 235;
    const R1_Y = 160;
    const R2_X = 520;
    const R2_Y = 390;

    state.data.categories.forEach((cat) => {
      const dom = domainMap[cat.domainId] || { color: "#64748b" };
      const rad = (cat.angle * Math.PI) / 180;
      const cx = CX + R1_X * Math.cos(rad);
      const cy = CY + R1_Y * Math.sin(rad);
      const catVisible = isCategoryVisible(cat);
      const cw = Math.max(114, cat.label.length * 14 + 24);
      const ch = 36;

      catLayouts.push({
        cat,
        dom,
        x: cx,
        y: cy,
        w: cw,
        h: ch,
        visible: catVisible
      });

      // 元図の並び順に合わせて放射角度順を整列
      const orderedItems = [...cat.items];
      if (["misjudgment", "carelessness", "ignorance", "unknown_cause", "poor_values"].includes(cat.id)) {
        orderedItems.reverse();
      }

      const count = orderedItems.length;
      const sinA = Math.sin(rad);
      const isTop = sinA < -0.65;
      const isBottom = sinA > 0.65;

      const stepDeg = isTop ? 6.2 : isBottom ? 5.2 : 5.6;
      const spreadDeg = (count - 1) * stepDeg;
      const startDeg = cat.angle - spreadDeg / 2;

      orderedItems.forEach((item, idx) => {
        const itemDeg = count === 1 ? cat.angle : startDeg + stepDeg * idx;
        const itemRad = (itemDeg * Math.PI) / 180;

        // 上下方向の扇（企画・計画不良、価値観不良、環境変化への対応不良など）は
        // 原典マンダラ図と同様にアーチ＋段差をつけて横長ラベルの水平衝突を回避
        let rBoost = 0;
        if (isTop || isBottom) {
          const norm = count > 1 ? (idx / (count - 1)) * 2 - 1 : 0; // -1 〜 +1
          const arch = (1 - norm * norm) * 90;
          const alt = (idx % 2) * 34;
          rBoost = arch + alt - 35;
        } else {
          rBoost = count >= 6 ? (idx % 2 === 0 ? -1 : 1) * 18 : 0;
        }

        const ix = CX + (R2_X + rBoost * 0.9) * Math.cos(itemRad);
        const iy = CY + (R2_Y + rBoost * 0.85) * Math.sin(itemRad);
        const iw = Math.max(104, item.label.length * 12.5 + 22);
        const ih = 28;
        const visible = isItemVisible(item, cat);

        itemLayouts.push({
          item,
          cat,
          dom,
          x: ix,
          y: iy,
          targetX: ix,
          targetY: iy,
          cx,
          cy,
          w: iw,
          h: ih,
          visible
        });
      });
    });

    // バウンディングボックスの重なり解消（カスタマイズで項目が増えても重ならないように自動調整）
    const PAD_X = 14;
    const PAD_Y = 8;
    for (let iter = 0; iter < 220; iter++) {
      for (let i = 0; i < itemLayouts.length; i++) {
        for (let j = i + 1; j < itemLayouts.length; j++) {
          const a = itemLayouts[i];
          const b = itemLayouts[j];
          const overlapX = (a.w + b.w) / 2 + PAD_X - Math.abs(a.x - b.x);
          const overlapY = (a.h + b.h) / 2 + PAD_Y - Math.abs(a.y - b.y);
          if (overlapX > 0 && overlapY > 0) {
            if (overlapY * 1.5 < overlapX) {
              const sign = a.y <= b.y ? -1 : 1;
              a.y += sign * (overlapY / 2 + 0.5);
              b.y -= sign * (overlapY / 2 + 0.5);
            } else {
              const sign = a.x <= b.x ? -1 : 1;
              a.x += sign * (overlapX / 2 + 0.5);
              b.x -= sign * (overlapX / 2 + 0.5);
            }
          }
        }
      }
      for (const a of itemLayouts) {
        for (const c of catLayouts) {
          const overlapX = (a.w + c.w) / 2 + PAD_X - Math.abs(a.x - c.x);
          const overlapY = (a.h + c.h) / 2 + PAD_Y - Math.abs(a.y - c.y);
          if (overlapX > 0 && overlapY > 0) {
            const vx = a.x - CX;
            const vy = a.y - CY;
            const len = Math.hypot(vx, vy) || 1;
            a.x += (vx / len) * 8;
            a.y += (vy / len) * 8;
          }
        }
        if (iter < 150) {
          a.x += (a.targetX - a.x) * 0.03;
          a.y += (a.targetY - a.y) * 0.03;
        }
      }
    }

    // 確定したノード座標からエッジ（接続線）を生成
    const edges = [];
    catLayouts.forEach((c) => {
      edges.push({
        x1: CX,
        y1: CY,
        x2: c.x,
        y2: c.y,
        color: c.dom.color,
        visible: c.visible,
        catId: c.cat.id
      });
    });
    itemLayouts.forEach((it) => {
      edges.push({
        x1: it.cx,
        y1: it.cy,
        x2: it.x,
        y2: it.y,
        color: it.dom.color,
        visible: it.visible,
        catId: it.cat.id,
        itemId: it.item.id
      });
    });

    // エッジ（接続線）描画
    html += `<g class="layer-edges">`;
    edges.forEach((e) => {
      const rcaEntry = e.itemId ? state.rca.items[e.itemId] : null;
      const isRoot = rcaEntry && rcaEntry.status === "root";
      const isSuspect = rcaEntry && rcaEntry.status === "suspect";
      const isHighlighted =
        (state.selectedNode &&
          ((state.selectedNode.type === "item" && state.selectedNode.id === e.itemId) ||
            (state.selectedNode.type === "category" && state.selectedNode.id === e.catId))) ||
        isRoot;

      const strokeColor = isRoot
        ? "#ef4444"
        : isSuspect
        ? "#f59e0b"
        : isHighlighted
        ? e.color
        : isLight
        ? "#64748b"
        : "#475569";

      html += `<line class="edge-line ${!e.visible ? "dimmed" : ""} ${isHighlighted ? "highlighted" : ""}"
                     x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}"
                     x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}"
                     stroke="${strokeColor}"
                     stroke-width="${isRoot ? 2.8 : isSuspect ? 2.2 : 1.5}" />`;
    });
    html += `</g>`;

    // 第2階層（54項目）ノード描画
    html += `<g class="layer-items">`;
    itemLayouts.forEach(({ item, dom, x, y, w, h, visible }) => {
      const isSelected = state.selectedNode && state.selectedNode.type === "item" && state.selectedNode.id === item.id;
      const rcaEntry = state.rca.items[item.id] || { status: "none", comment: "" };
      const statusClass =
        rcaEntry.status === "root"
          ? "checked-root"
          : rcaEntry.status === "suspect"
          ? "checked-suspect"
          : "";

      const boxW = w;
      const boxH = h;

      const fillBg =
        rcaEntry.status === "root"
          ? isLight
            ? "#fee2e2"
            : "#450a0a"
          : rcaEntry.status === "suspect"
          ? isLight
            ? "#fef3c7"
            : "#451a03"
          : isLight
          ? "#ffffff"
          : "#1e293b";

      const strokeCol = item.sourceEdition === "expanded_54" ? dom.color : isLight ? "#94a3b8" : "#475569";

      html += `
        <g class="node-group ${isSelected ? "selected" : ""} ${!visible ? "dimmed" : ""} ${statusClass}"
           data-node-type="item" data-node-id="${item.id}"
           transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
          <rect class="node-rect"
                x="${(-boxW / 2).toFixed(1)}" y="${(-boxH / 2).toFixed(1)}"
                width="${boxW}" height="${boxH}" rx="6"
                fill="${fillBg}"
                stroke="${strokeCol}"
                stroke-width="1.5" />
          <text x="0" y="4.5" text-anchor="middle"
                fill="${isLight ? "#0f172a" : "#f1f5f9"}"
                font-size="12" font-weight="600">${escapeHtml(item.label)}</text>
          ${
            rcaEntry.status === "root"
              ? `<circle cx="${boxW / 2 - 4}" cy="${-boxH / 2 + 4}" r="6" fill="#ef4444" />`
              : rcaEntry.status === "suspect"
              ? `<circle cx="${boxW / 2 - 4}" cy="${-boxH / 2 + 4}" r="6" fill="#f59e0b" />`
              : ""
          }
        </g>
      `;
    });
    html += `</g>`;

    // 第1階層（10分類）ノード描画
    html += `<g class="layer-categories">`;
    catLayouts.forEach(({ cat, dom, x, y, w, h, visible }) => {
      const isSelected =
        state.selectedNode && state.selectedNode.type === "category" && state.selectedNode.id === cat.id;
      const boxW = w;
      const boxH = h;

      html += `
        <g class="node-group ${isSelected ? "selected" : ""} ${!visible ? "dimmed" : ""}"
           data-node-type="category" data-node-id="${cat.id}"
           transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
          <rect class="node-rect"
                x="${(-boxW / 2).toFixed(1)}" y="${(-boxH / 2).toFixed(1)}"
                width="${boxW}" height="${boxH}" rx="8"
                fill="${dom.color}"
                stroke="${isLight ? "#ffffff" : "#0f172a"}"
                stroke-width="2" />
          <text x="0" y="5" text-anchor="middle"
                fill="#ffffff"
                font-size="13.5" font-weight="700">${escapeHtml(cat.label)}</text>
        </g>
      `;
    });
    html += `</g>`;

    // 中心コア楕円ノード描画
    const isCenterSelected = state.selectedNode && state.selectedNode.type === "center";
    html += `
      <g class="node-group ${isCenterSelected ? "selected" : ""}"
         data-node-type="center" data-node-id="center"
         transform="translate(${CX}, ${CY})">
        <ellipse class="node-rect" cx="0" cy="0" rx="145" ry="54"
                 fill="${isLight ? "#ffffff" : "#0f172a"}"
                 stroke="${isLight ? "#0f172a" : "#f8fafc"}"
                 stroke-width="3" />
        <text x="0" y="-8" text-anchor="middle"
              fill="${isLight ? "#0f172a" : "#f8fafc"}"
              font-size="16" font-weight="700">【ITプロジェクト版】</text>
        <text x="0" y="16" text-anchor="middle"
              fill="${isLight ? "#0f172a" : "#f8fafc"}"
              font-size="17" font-weight="700">失敗原因マンダラ図</text>
      </g>
    `;

    html += `</g>`; // end #mandala-viewport
    svg.innerHTML = html;

    // SVG内のノードクリックイベント
    svg.querySelectorAll(".node-group").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const type = el.getAttribute("data-node-type");
        const id = el.getAttribute("data-node-id");
        selectNode(type, id);
      });
      // ダブルクリックで候補/真因のクイック切替（itemノードのみ）
      el.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        const type = el.getAttribute("data-node-type");
        const id = el.getAttribute("data-node-id");
        if (type === "item") {
          cycleItemRcaStatus(id);
        }
      });
    });
  }

  function selectNode(type, id) {
    state.selectedNode = { type, id };
    renderMandalaSvg();
    renderDetailSidebar();
  }

  function cycleItemRcaStatus(itemId) {
    const current = state.rca.items[itemId] || { status: "none", comment: "" };
    const order = ["none", "suspect", "root"];
    const nextStatus = order[(order.indexOf(current.status) + 1) % order.length];
    setItemRcaStatus(itemId, nextStatus);
  }

  function setItemRcaStatus(itemId, status) {
    if (!state.rca.items[itemId]) {
      state.rca.items[itemId] = { status: "none", comment: "" };
    }
    state.rca.items[itemId].status = status;
    saveRcaState();
    renderMandalaSvg();
    renderDetailSidebar();
    if (state.activeTab === "rca") {
      renderRcaView();
    }
    if (state.activeTab === "dictionary") {
      renderDictionaryView();
    }
  }

  function setItemRcaComment(itemId, comment) {
    if (!state.rca.items[itemId]) {
      state.rca.items[itemId] = { status: "none", comment: "" };
    }
    state.rca.items[itemId].comment = comment;
    saveRcaState();
  }

  // =========================================================================
  // 右ペイン：詳細ドロワーのレンダリング
  // =========================================================================
  function renderDetailSidebar() {
    const container = document.getElementById("detail-sidebar-content");
    if (!container) return;

    if (!state.selectedNode) {
      // デフォルト表示: マンダラ図全体の概要
      selectNode("center", "center");
      return;
    }

    const found = findNodeById(state.selectedNode.type, state.selectedNode.id);
    if (!found) return;

    if (found.type === "center") {
      const totalCats = state.data.categories.length;
      const totalItems = state.data.categories.reduce((acc, c) => acc + c.items.length, 0);
      container.innerHTML = `
        <div class="detail-header">
          <div class="detail-breadcrumb">
            <span class="domain-pill" style="background:#3b82f6">全体概要</span>
            <span class="edition-pill">v${escapeHtml(state.data.meta.version)}</span>
          </div>
          <div class="detail-title">${escapeHtml(state.data.meta.title)}</div>
          <div class="detail-id">${escapeHtml(state.data.meta.subtitle)}</div>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <div class="detail-section-title">構造サマリ</div>
            <div class="detail-text">
              ・大分類（責任・起因領域）: <strong>${state.data.domains.length}領域</strong>（個人 / プロジェクト / 組織 / 未知）<br>
              ・第1階層（上位原因分類）: <strong>${totalCats}分類</strong><br>
              ・第2階層（再発防止策が考えられる粒度）: <strong>全${totalItems}項目</strong>
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">操作ガイド</div>
            <ul class="detail-list">
              <li><strong>クリック</strong>: 各要素の用語定義・具体例・再発防止策を表示</li>
              <li><strong>ダブルクリック（第2階層）</strong>: 振り返り分析の「該当なし → 候補(○) → 真因(★)」をワンタッチ切替</li>
              <li><strong>定義のカスタマイズ</strong>: 『データ定義・編集』タブまたは <code>data/mandala_data.js</code> を直接編集して項目や階層を自由に追加・変更可能</li>
            </ul>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">マンダラ図を使用した分析の5ステップ</div>
            <ul class="detail-list">
              ${state.data.meta.analysisSteps
                .map((s) => `<li><strong>Step${s.step}: ${escapeHtml(s.title)}</strong><br>${escapeHtml(s.description)}</li>`)
                .join("")}
            </ul>
          </div>
        </div>
      `;
      return;
    }

    if (found.type === "domain") {
      const dom = found.data;
      const cats = state.data.categories.filter((c) => c.domainId === dom.id);
      const itemCount = cats.reduce((acc, c) => acc + c.items.length, 0);
      container.innerHTML = `
        <div class="detail-header">
          <div class="detail-breadcrumb">
            <span class="domain-pill" style="background:${dom.color}">大分類（起因領域）</span>
          </div>
          <div class="detail-title">${escapeHtml(dom.fullLabel)}</div>
          <div class="detail-id">ID: ${escapeHtml(dom.id)} | 第1階層: ${cats.length}分類 / 第2階層: ${itemCount}項目</div>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <div class="detail-section-title">領域の定義</div>
            <div class="detail-text">${escapeHtml(dom.description)}</div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">含まれる第1階層カテゴリ</div>
            <ul class="detail-list">
              ${cats
                .map(
                  (c) =>
                    `<li><a href="#" class="inline-node-link" data-type="category" data-id="${c.id}" style="color:${dom.color};font-weight:700;text-decoration:none;">${escapeHtml(
                      c.label
                    )}</a>（${c.items.length}項目）: ${escapeHtml(c.definition)}</li>`
                )
                .join("")}
            </ul>
          </div>
        </div>
      `;
      bindInlineLinks(container);
      return;
    }

    if (found.type === "category") {
      const cat = found.data;
      const dom = found.domain;
      container.innerHTML = `
        <div class="detail-header">
          <div class="detail-breadcrumb">
            <span class="domain-pill" style="background:${dom.color}">${escapeHtml(dom.label)}</span>
            <span class="edition-pill">第1階層</span>
          </div>
          <div class="detail-title">${escapeHtml(cat.label)}</div>
          <div class="detail-id">ID: ${escapeHtml(cat.id)} | 配下アイテム: ${cat.items.length}件</div>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <div class="detail-section-title">
              <span>第1階層の定義（解説）</span>
            </div>
            <div class="detail-text">${escapeHtml(cat.definition)}</div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">
              <span>第2階層の失敗原因（${cat.items.length}項目）</span>
              <button class="btn" id="btn-add-item-to-cat" style="padding:2px 8px;font-size:11px;">＋ 項目追加</button>
            </div>
            <ul class="detail-list">
              ${cat.items
                .map(
                  (it) =>
                    `<li>
                      <a href="#" class="inline-node-link" data-type="item" data-id="${it.id}" style="color:${dom.color};font-weight:700;text-decoration:none;">
                        ${escapeHtml(it.label)}
                      </a>
                      <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">${escapeHtml(it.definition)}</div>
                    </li>`
                )
                .join("")}
            </ul>
          </div>
        </div>
      `;
      bindInlineLinks(container);
      const addBtn = container.querySelector("#btn-add-item-to-cat");
      if (addBtn) {
        addBtn.addEventListener("click", () => openItemModal("add", cat.id));
      }
      return;
    }

    if (found.type === "item") {
      const item = found.data;
      const cat = found.category;
      const dom = found.domain;
      const rcaEntry = state.rca.items[item.id] || { status: "none", comment: "" };
      const editionLabel =
        item.sourceEdition === "2014_original" ? "SAAJ 2015発表原典 (49項目)" : "54項目拡張版で追加";

      container.innerHTML = `
        <div class="detail-header">
          <div class="detail-breadcrumb">
            <span class="domain-pill" style="background:${dom.color}">${escapeHtml(dom.label)}</span>
            <span>›</span>
            <a href="#" class="inline-node-link" data-type="category" data-id="${cat.id}" style="color:var(--text-main);font-weight:600;text-decoration:none;">
              ${escapeHtml(cat.label)}
            </a>
            <span class="edition-pill">${editionLabel}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div class="detail-title">${escapeHtml(item.label)}</div>
            <button class="btn" id="btn-edit-current-item" style="padding:4px 8px;font-size:11px;flex-shrink:0;">編集</button>
          </div>
          <div class="detail-id">ID: ${escapeHtml(item.id)}</div>
        </div>

        <div class="detail-body">
          <div class="detail-section">
            <div class="detail-section-title">用語定義（システム開発における意味）</div>
            <div class="detail-text">${escapeHtml(item.definition)}</div>
          </div>

          ${
            item.examples && item.examples.length > 0
              ? `
            <div class="detail-section">
              <div class="detail-section-title">具体例・典型的シナリオ</div>
              <ul class="detail-list">
                ${item.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}
              </ul>
            </div>
          `
              : ""
          }

          ${
            item.countermeasures && item.countermeasures.length > 0
              ? `
            <div class="detail-section">
              <div class="detail-section-title">再発防止策・予防アプローチ（Step5参考）</div>
              <ul class="detail-list">
                ${item.countermeasures.map((cm) => `<li>${escapeHtml(cm)}</li>`).join("")}
              </ul>
            </div>
          `
              : ""
          }

          <div class="rca-action-box">
            <div class="detail-section-title">プロジェクト振り返り判定（Step1〜Step4）</div>
            <div class="rca-status-buttons">
              <button class="status-btn ${rcaEntry.status === "none" ? "active-none" : ""}" data-status="none">
                該当なし
              </button>
              <button class="status-btn ${rcaEntry.status === "suspect" ? "active-suspect" : ""}" data-status="suspect">
                ○ 抽出候補
              </button>
              <button class="status-btn ${rcaEntry.status === "root" ? "active-root" : ""}" data-status="root">
                ★ 真の原因
              </button>
            </div>
            <textarea class="rca-memo-input" id="detail-rca-memo"
                      placeholder="この原因を選定した理由・事実・コメントを記入（例：U氏のPM知識が不足しており情報連携の方法を確立できていなかった）">${escapeHtml(
                        rcaEntry.comment || ""
                      )}</textarea>
          </div>
        </div>
      `;

      bindInlineLinks(container);

      container.querySelectorAll(".status-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const st = btn.getAttribute("data-status");
          setItemRcaStatus(item.id, st);
        });
      });

      const memoEl = container.querySelector("#detail-rca-memo");
      if (memoEl) {
        memoEl.addEventListener("input", (e) => {
          setItemRcaComment(item.id, e.target.value);
        });
      }

      const editBtn = container.querySelector("#btn-edit-current-item");
      if (editBtn) {
        editBtn.addEventListener("click", () => openItemModal("edit", cat.id, item.id));
      }
    }
  }

  function bindInlineLinks(container) {
    container.querySelectorAll(".inline-node-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        selectNode(a.getAttribute("data-type"), a.getAttribute("data-id"));
      });
    });
  }

  // =========================================================================
  // タブ2: 用語定義辞書（一覧テーブルビュー）
  // =========================================================================
  function renderDictionaryView() {
    const container = document.getElementById("dictionary-view-content");
    if (!container) return;

    let html = `<div class="dict-grid">`;

    state.data.domains.forEach((dom) => {
      if (state.filterDomain !== "all" && state.filterDomain !== dom.id) return;

      const cats = state.data.categories.filter((c) => c.domainId === dom.id && isCategoryVisible(c));
      if (cats.length === 0) return;

      html += `
        <div class="domain-card">
          <div class="domain-card-header" style="border-left: 5px solid ${dom.color};">
            <div>
              <span>${escapeHtml(dom.fullLabel)}</span>
              <span style="font-size:12px;color:var(--text-muted);font-weight:400;margin-left:10px;">${escapeHtml(
                dom.description
              )}</span>
            </div>
          </div>
          <table class="dict-table">
            <thead>
              <tr>
                <th style="width:160px;">第1階層（解説）</th>
                <th style="width:190px;">第2階層（項目名）</th>
                <th>用語定義・具体例</th>
                <th style="width:280px;">再発防止策（参考）</th>
                <th style="width:90px;">分析状態</th>
              </tr>
            </thead>
            <tbody>
      `;

      cats.forEach((cat) => {
        const visibleItems = cat.items.filter((it) => isItemVisible(it, cat));
        visibleItems.forEach((item, idx) => {
          const rcaEntry = state.rca.items[item.id] || { status: "none" };
          const statusLabel =
            rcaEntry.status === "root"
              ? `<span style="color:#ef4444;font-weight:700;">★ 真因</span>`
              : rcaEntry.status === "suspect"
              ? `<span style="color:#f59e0b;font-weight:700;">○ 候補</span>`
              : `<span style="color:var(--text-muted);">-</span>`;

          html += `
            <tr data-item-id="${item.id}">
              ${
                idx === 0
                  ? `<td rowspan="${visibleItems.length}" style="background:var(--bg-app);border-right:1px solid var(--border-color);">
                      <div style="font-weight:700;color:${dom.color};margin-bottom:4px;">${escapeHtml(cat.label)}</div>
                      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">${escapeHtml(
                        cat.definition
                      )}</div>
                    </td>`
                  : ""
              }
              <td>
                <div style="font-weight:700;">${escapeHtml(item.label)}</div>
                ${
                  item.sourceEdition === "expanded_54"
                    ? `<span style="font-size:10px;color:var(--text-muted);border:1px solid var(--border-color);padding:1px 5px;border-radius:4px;">54項目拡張</span>`
                    : ""
                }
              </td>
              <td>
                <div style="line-height:1.55;">${escapeHtml(item.definition)}</div>
                ${
                  item.examples && item.examples.length > 0
                    ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">
                        ${item.examples.map((ex) => `<div>（例）${escapeHtml(ex)}</div>`).join("")}
                       </div>`
                    : ""
                }
              </td>
              <td>
                <ul style="padding-left:15px;font-size:12.5px;color:var(--text-muted);line-height:1.5;">
                  ${(item.countermeasures || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
                </ul>
              </td>
              <td>${statusLabel}</td>
            </tr>
          `;
        });
      });

      html += `</tbody></table></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll("tbody tr[data-item-id]").forEach((tr) => {
      tr.addEventListener("click", () => {
        const itemId = tr.getAttribute("data-item-id");
        selectNode("item", itemId);
      });
    });
  }

  // =========================================================================
  // タブ3: 振り返り分析・AARワークシート (Step1〜Step5)
  // =========================================================================
  function renderRcaView() {
    const container = document.getElementById("rca-view-content");
    if (!container) return;

    const domainMap = getDomainMap();
    const selectedItems = [];

    state.data.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const entry = state.rca.items[item.id];
        if (entry && (entry.status === "suspect" || entry.status === "root")) {
          selectedItems.push({
            domain: domainMap[cat.domainId],
            category: cat,
            item,
            entry
          });
        }
      });
    });

    const rootCount = selectedItems.filter((x) => x.entry.status === "root").length;
    const suspectCount = selectedItems.filter((x) => x.entry.status === "suspect").length;

    container.innerHTML = `
      <div class="rca-layout">
        <div class="rca-steps-banner">
          ${state.data.meta.analysisSteps
            .map(
              (s) => `
            <div class="step-card">
              <div class="step-num">Step ${s.step}</div>
              <div class="step-title">${escapeHtml(s.title)}</div>
              <div class="step-desc">${escapeHtml(s.description)}</div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="rca-project-meta">
          <div class="form-field">
            <label>対象プロジェクト / 事案名</label>
            <input type="text" id="rca-project-name" value="${escapeHtml(
              state.rca.projectName
            )}" placeholder="例：基幹システム再構築・WAN環境修理機器管理システム" />
          </div>
          <div class="form-field">
            <label>分析実施日 / 参加者</label>
            <input type="text" id="rca-participants" value="${escapeHtml(
              state.rca.participants
            )}" placeholder="例：2026-10-25 / PM、システム部門、ユーザ部門" />
          </div>
          <div class="form-field" style="grid-column: 1 / -1;">
            <label>AAR 1&2: 当初の目的と実際に起きた事象（事実のみ・犯人探しはしない）</label>
            <textarea id="rca-summary-incident" rows="2" placeholder="例：要件定義〜検収テストまで完了したが、通信テスト・本番移行段階でレスポンス問題や機能不足が判明した。">${escapeHtml(
              state.rca.summaryIncident
            )}</textarea>
          </div>
        </div>

        <div class="rca-summary-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div>
              <h3 style="font-size:16px;">抽出された失敗原因一覧（候補: ${suspectCount}件 / ★真の失敗原因: ${rootCount}件）</h3>
              <p style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                マンダラ図または一覧表から選択した項目が集約されます。議論を通じて最も影響度の高い『★真の原因』へ昇格させてください。
              </p>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn" id="btn-clear-rca">クリア</button>
              <button class="btn btn-primary" id="btn-export-markdown">Markdownレポート出力（コピー）</button>
            </div>
          </div>

          ${
            selectedItems.length === 0
              ? `<div style="padding:32px;text-align:center;color:var(--text-muted);border:1px dashed var(--border-color);border-radius:8px;">
                  まだ失敗原因が選択されていません。「マンダラ図」タブで項目をクリック（またはダブルクリック）して「○ 抽出候補」または「★ 真の原因」を選択してください。
                 </div>`
              : `
              <table class="dict-table">
                <thead>
                  <tr>
                    <th style="width:110px;">判定</th>
                    <th style="width:90px;">分類</th>
                    <th style="width:140px;">第1階層</th>
                    <th style="width:170px;">第2階層（失敗原因）</th>
                    <th>選定理由・コメント（Step2〜4）</th>
                    <th style="width:260px;">標準の再発防止策ヒント（Step5）</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedItems
                    .map(
                      ({ domain, category, item, entry }) => `
                    <tr>
                      <td>
                        <select class="rca-row-status" data-item-id="${item.id}" style="background:var(--bg-app);color:var(--text-main);border:1px solid var(--border-color);padding:4px 6px;border-radius:4px;font-weight:700;">
                          <option value="suspect" ${entry.status === "suspect" ? "selected" : ""}>○ 抽出候補</option>
                          <option value="root" ${entry.status === "root" ? "selected" : ""}>★ 真の原因</option>
                          <option value="none">除外</option>
                        </select>
                      </td>
                      <td><span class="domain-pill" style="background:${domain.color}">${escapeHtml(
                        domain.label
                      )}</span></td>
                      <td style="font-weight:600;">${escapeHtml(category.label)}</td>
                      <td style="font-weight:700;">${escapeHtml(item.label)}</td>
                      <td>
                        <textarea class="rca-row-comment" data-item-id="${
                          item.id
                        }" rows="2" style="width:100%;background:var(--bg-app);color:var(--text-main);border:1px solid var(--border-color);border-radius:4px;padding:6px;font-size:12.5px;" placeholder="選定理由・発生事実を記入">${escapeHtml(
                        entry.comment || ""
                      )}</textarea>
                      </td>
                      <td>
                        <ul style="padding-left:15px;font-size:12px;color:var(--text-muted);">
                          ${(item.countermeasures || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
                        </ul>
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            `
          }

          <div class="form-field" style="margin-top:18px;">
            <label>Step5 & AAR 4: 次回なすべきことは何か？（決定した具体的な再発防止策・アクションプラン）</label>
            <textarea id="rca-action-plan" rows="4" placeholder="真の失敗原因に対する具体的な対策（自分たちで出来る範囲の施策・仕組み化）を記述してください。">${escapeHtml(
              state.rca.actionPlan
            )}</textarea>
          </div>
        </div>
      </div>
    `;

    // イベントバインド
    const pName = container.querySelector("#rca-project-name");
    if (pName) {
      pName.addEventListener("input", (e) => {
        state.rca.projectName = e.target.value;
        saveRcaState();
      });
    }
    const pPart = container.querySelector("#rca-participants");
    if (pPart) {
      pPart.addEventListener("input", (e) => {
        state.rca.participants = e.target.value;
        saveRcaState();
      });
    }
    const pInc = container.querySelector("#rca-summary-incident");
    if (pInc) {
      pInc.addEventListener("input", (e) => {
        state.rca.summaryIncident = e.target.value;
        saveRcaState();
      });
    }
    const pAct = container.querySelector("#rca-action-plan");
    if (pAct) {
      pAct.addEventListener("input", (e) => {
        state.rca.actionPlan = e.target.value;
        saveRcaState();
      });
    }

    container.querySelectorAll(".rca-row-status").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        setItemRcaStatus(sel.getAttribute("data-item-id"), e.target.value);
      });
    });

    container.querySelectorAll(".rca-row-comment").forEach((ta) => {
      ta.addEventListener("input", (e) => {
        setItemRcaComment(ta.getAttribute("data-item-id"), e.target.value);
      });
    });

    const clearBtn = container.querySelector("#btn-clear-rca");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!confirm("選択中の失敗原因および振り返りシートの入力をすべてクリアしますか？")) return;
        state.rca = {
          projectName: "",
          analysisDate: new Date().toISOString().slice(0, 10),
          participants: "",
          summaryIncident: "",
          actionPlan: "",
          items: {}
        };
        saveRcaState();
        renderAll();
      });
    }

    const exportMdBtn = container.querySelector("#btn-export-markdown");
    if (exportMdBtn) {
      exportMdBtn.addEventListener("click", exportRcaMarkdown);
    }
  }

  function exportRcaMarkdown() {
    const domainMap = getDomainMap();
    const roots = [];
    const suspects = [];

    state.data.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const entry = state.rca.items[item.id];
        if (!entry || entry.status === "none") return;
        const row = { domain: domainMap[cat.domainId], cat, item, entry };
        if (entry.status === "root") roots.push(row);
        else if (entry.status === "suspect") suspects.push(row);
      });
    });

    let md = `# ITプロジェクト失敗原因マンダラ図 振り返り（AAR）レポート\n\n`;
    md += `- **対象案件**: ${state.rca.projectName || "（未記入）"}\n`;
    md += `- **実施日・参加者**: ${state.rca.participants || state.rca.analysisDate}\n\n`;
    md += `## 1. 当初の目的と実際に起きた事象\n\n${state.rca.summaryIncident || "（未記入）"}\n\n`;

    md += `## 2. 特定された「真の失敗原因」（${roots.length}件）\n\n`;
    if (roots.length === 0) {
      md += `（未特定）\n\n`;
    } else {
      md += `| 分類 | 第1階層 | 第2階層（真の失敗原因） | 選定理由・発生事実 |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      roots.forEach(({ domain, cat, item, entry }) => {
        md += `| ${domain.label} | ${cat.label} | **${item.label}** | ${(entry.comment || "").replace(/\n/g, " ")} |\n`;
      });
      md += `\n`;
    }

    md += `## 3. 抽出された失敗原因候補（${suspects.length}件）\n\n`;
    if (suspects.length === 0) {
      md += `（なし）\n\n`;
    } else {
      md += `| 分類 | 第1階層 | 第2階層 | コメント |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      suspects.forEach(({ domain, cat, item, entry }) => {
        md += `| ${domain.label} | ${cat.label} | ${item.label} | ${(entry.comment || "").replace(/\n/g, " ")} |\n`;
      });
      md += `\n`;
    }

    md += `## 4. 再発防止策・次回なすべきこと（AAR Action Plan）\n\n${state.rca.actionPlan || "（未記入）"}\n`;

    navigator.clipboard.writeText(md).then(
      () => alert("Markdownレポートをクリップボードにコピーしました。Obsidianのノート等にそのまま貼り付け可能です。"),
      () => alert("クリップボードへのコピーに失敗しました。")
    );
  }

  // =========================================================================
  // タブ4: データ定義・編集ビュー (Viewerと分離されたデータ構造の直接編集＆書き出し)
  // =========================================================================
  function renderEditorView() {
    const textarea = document.getElementById("json-editor-textarea");
    if (!textarea) return;
    textarea.value = JSON.stringify(state.data, null, 2);
  }

  function applyEditorJson() {
    const textarea = document.getElementById("json-editor-textarea");
    if (!textarea) return;
    try {
      const parsed = JSON.parse(textarea.value);
      if (!parsed.domains || !parsed.categories) {
        alert("データ形式エラー: `domains` および `categories` プロパティが必要です。");
        return;
      }
      saveCustomData(parsed);
      alert("データ定義を更新し、マンダラ図へ反映しました。");
    } catch (e) {
      alert("JSONの構文エラーです: " + e.message);
    }
  }

  function downloadMandalaDataJs() {
    const jsContent =
      `/**\n * 【ITプロジェクト版】失敗原因マンダラ図 データ定義\n * Generated by Mandala Viewer\n */\nwindow.MANDALA_DATA = ` +
      JSON.stringify(state.data, null, 2) +
      `;\n`;
    const blob = new Blob([jsContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mandala_data.js";
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // モーダル（項目の追加・編集）
  // =========================================================================
  let modalContext = null; // { mode: 'add' | 'edit', catId, itemId }

  function openItemModal(mode, catId, itemId = null) {
    modalContext = { mode, catId, itemId };
    const backdrop = document.getElementById("item-modal-backdrop");
    const titleEl = document.getElementById("modal-title");
    const catSelect = document.getElementById("modal-cat-select");
    const labelInput = document.getElementById("modal-item-label");
    const defInput = document.getElementById("modal-item-def");
    const exInput = document.getElementById("modal-item-examples");
    const cmInput = document.getElementById("modal-item-countermeasures");
    const deleteBtn = document.getElementById("btn-modal-delete");

    catSelect.innerHTML = state.data.categories
      .map((c) => `<option value="${c.id}" ${c.id === catId ? "selected" : ""}>${escapeHtml(c.label)}</option>`)
      .join("");

    if (mode === "edit" && itemId) {
      const found = findNodeById("item", itemId);
      if (!found) return;
      titleEl.textContent = `失敗原因の編集: ${found.data.label}`;
      labelInput.value = found.data.label;
      defInput.value = found.data.definition || "";
      exInput.value = (found.data.examples || []).join("\n");
      cmInput.value = (found.data.countermeasures || []).join("\n");
      deleteBtn.style.display = "inline-flex";
    } else {
      titleEl.textContent = "新しい失敗原因（第2階層）の追加";
      labelInput.value = "";
      defInput.value = "";
      exInput.value = "";
      cmInput.value = "";
      deleteBtn.style.display = "none";
    }

    backdrop.classList.add("open");
  }

  function closeItemModal() {
    const backdrop = document.getElementById("item-modal-backdrop");
    if (backdrop) backdrop.classList.remove("open");
    modalContext = null;
  }

  function saveModalItem() {
    if (!modalContext) return;
    const targetCatId = document.getElementById("modal-cat-select").value;
    const label = document.getElementById("modal-item-label").value.trim();
    const definition = document.getElementById("modal-item-def").value.trim();
    const examples = document
      .getElementById("modal-item-examples")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const countermeasures = document
      .getElementById("modal-item-countermeasures")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!label || !definition) {
      alert("項目名と定義文は必須です。");
      return;
    }

    const newData = JSON.parse(JSON.stringify(state.data));

    if (modalContext.mode === "edit" && modalContext.itemId) {
      // 既存アイテムを探して更新（カテゴリ移動にも対応）
      let itemObj = null;
      newData.categories.forEach((c) => {
        const idx = c.items.findIndex((it) => it.id === modalContext.itemId);
        if (idx !== -1) {
          itemObj = c.items.splice(idx, 1)[0];
        }
      });
      if (!itemObj) return;
      itemObj.label = label;
      itemObj.definition = definition;
      itemObj.examples = examples;
      itemObj.countermeasures = countermeasures;

      const destCat = newData.categories.find((c) => c.id === targetCatId);
      if (destCat) destCat.items.push(itemObj);
      saveCustomData(newData);
      selectNode("item", itemObj.id);
    } else {
      const newId = "custom_" + Date.now();
      const destCat = newData.categories.find((c) => c.id === targetCatId);
      if (!destCat) return;
      destCat.items.push({
        id: newId,
        label,
        definition,
        examples,
        countermeasures,
        sourceEdition: "custom"
      });
      saveCustomData(newData);
      selectNode("item", newId);
    }

    closeItemModal();
  }

  function deleteModalItem() {
    if (!modalContext || !modalContext.itemId) return;
    if (!confirm("この失敗原因項目を削除しますか？")) return;
    const newData = JSON.parse(JSON.stringify(state.data));
    newData.categories.forEach((c) => {
      c.items = c.items.filter((it) => it.id !== modalContext.itemId);
    });
    saveCustomData(newData);
    selectNode("center", "center");
    closeItemModal();
  }

  // =========================================================================
  // イベントバインド＆全体更新
  // =========================================================================
  function updateRcaBadgeCount() {
    const badge = document.getElementById("rca-badge-count");
    if (!badge) return;
    const count = Object.values(state.rca.items).filter(
      (v) => v && (v.status === "suspect" || v.status === "root")
    ).length;
    badge.textContent = count;
  }

  function renderAll() {
    updateRcaBadgeCount();
    renderMandalaSvg();
    renderDetailSidebar();
    renderDictionaryView();
    renderRcaView();
    renderEditorView();
  }

  function bindEvents() {
    // タブ切替
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        state.activeTab = tab;
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
        document.querySelectorAll(".view-panel").forEach((p) => {
          p.classList.toggle("active", p.id === `panel-${tab}`);
        });
        if (tab === "dictionary") renderDictionaryView();
        if (tab === "rca") renderRcaView();
        if (tab === "editor") renderEditorView();
      });
    });

    // 検索入力
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        renderMandalaSvg();
        renderDictionaryView();
      });
    }

    // ドメインフィルタチップ
    document.querySelectorAll("[data-filter-domain]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filterDomain = chip.getAttribute("data-filter-domain");
        document
          .querySelectorAll("[data-filter-domain]")
          .forEach((c) => c.classList.toggle("active", c === chip));
        renderMandalaSvg();
        renderDictionaryView();
      });
    });

    // エディションフィルタチップ
    document.querySelectorAll("[data-filter-edition]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filterEdition = chip.getAttribute("data-filter-edition");
        document
          .querySelectorAll("[data-filter-edition]")
          .forEach((c) => c.classList.toggle("active", c === chip));
        renderMandalaSvg();
        renderDictionaryView();
      });
    });

    // 選択中のみ表示トグル
    const rcaOnlyChip = document.getElementById("chip-rca-only");
    if (rcaOnlyChip) {
      rcaOnlyChip.addEventListener("click", () => {
        state.filterRcaOnly = !state.filterRcaOnly;
        rcaOnlyChip.classList.toggle("active", state.filterRcaOnly);
        renderMandalaSvg();
        renderDictionaryView();
      });
    }

    // テーマ切替
    const themeBtn = document.getElementById("btn-toggle-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
    }

    // 新規項目追加ボタン
    const addBtnHeader = document.getElementById("btn-open-add-modal");
    if (addBtnHeader) {
      addBtnHeader.addEventListener("click", () => {
        openItemModal("add", state.data.categories[0].id);
      });
    }

    // キャンバスのズーム＆パン
    const canvasWrap = document.getElementById("mandala-canvas-wrap");
    if (canvasWrap) {
      canvasWrap.addEventListener("mousedown", (e) => {
        if (e.target.closest(".node-group") || e.target.closest(".canvas-controls")) return;
        state.isDragging = true;
        state.dragStart = { x: e.clientX - state.transform.x, y: e.clientY - state.transform.y };
        canvasWrap.classList.add("grabbing");
      });

      window.addEventListener("mousemove", (e) => {
        if (!state.isDragging) return;
        state.transform.x = e.clientX - state.dragStart.x;
        state.transform.y = e.clientY - state.dragStart.y;
        const vp = document.getElementById("mandala-viewport");
        if (vp) {
          vp.setAttribute(
            "transform",
            `translate(${state.transform.x}, ${state.transform.y}) scale(${state.transform.scale})`
          );
        }
      });

      window.addEventListener("mouseup", () => {
        state.isDragging = false;
        canvasWrap.classList.remove("grabbing");
      });

      canvasWrap.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.08 : 0.92;
          const nextScale = Math.min(2.6, Math.max(0.45, state.transform.scale * factor));
          state.transform.scale = nextScale;
          const vp = document.getElementById("mandala-viewport");
          if (vp) {
            vp.setAttribute(
              "transform",
              `translate(${state.transform.x}, ${state.transform.y}) scale(${state.transform.scale})`
            );
          }
        },
        { passive: false }
      );
    }

    // キャンバスコントロールボタン
    document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
      state.transform.scale = Math.min(2.6, state.transform.scale * 1.15);
      renderMandalaSvg();
    });
    document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
      state.transform.scale = Math.max(0.45, state.transform.scale * 0.85);
      renderMandalaSvg();
    });
    document.getElementById("btn-zoom-reset")?.addEventListener("click", () => {
      state.transform = { x: 0, y: 0, scale: 1 };
      renderMandalaSvg();
    });

    // エディタボタン
    document.getElementById("btn-apply-json")?.addEventListener("click", applyEditorJson);
    document.getElementById("btn-download-data-js")?.addEventListener("click", downloadMandalaDataJs);
    document.getElementById("btn-reset-default-data")?.addEventListener("click", resetToDefaultData);

    // モーダルボタン
    document.getElementById("btn-modal-close")?.addEventListener("click", closeItemModal);
    document.getElementById("btn-modal-cancel")?.addEventListener("click", closeItemModal);
    document.getElementById("btn-modal-save")?.addEventListener("click", saveModalItem);
    document.getElementById("btn-modal-delete")?.addEventListener("click", deleteModalItem);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

