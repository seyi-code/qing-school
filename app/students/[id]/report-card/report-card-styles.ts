export const REPORT_CARD_CSS = `
        .rc-page { max-width: 820px; margin: 0 auto; background: #fffefb; border: 1px solid #dedacd; box-shadow: 0 4px 24px rgba(26,58,110,.06); overflow: hidden; }
        .rc-header { background: linear-gradient(160deg,#0f2748 0%,#1a3a6e 100%); color:#fff; padding:1.25rem 1.25rem 1.1rem; position:relative; }
        .rc-header::after { content:""; position:absolute; bottom:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#c9a227,#e8d48b,#c9a227); }
        .rc-header-row { display:flex; align-items:flex-start; gap:0.85rem; }
        .rc-logo { width:72px; height:72px; flex-shrink:0; background:rgba(255,255,255,.12); border-radius:50%; padding:4px; object-fit:contain; }
        .rc-header-mid { flex:1; min-width:0; text-align:left; }
        .rc-school { font-family:var(--font-fraunces),Georgia,serif; font-size:1.25rem; font-weight:600; letter-spacing:-.01em; line-height:1.2; }
        .rc-motto { font-size:.7rem; opacity:.85; font-style:italic; margin-top:2px; }
        .rc-contact { font-size:.62rem; opacity:.7; margin-top:.4rem; line-height:1.35; }
        .rc-doc-title { margin-top:.65rem; font-size:.68rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:#c9a227; text-align:center; }
        .rc-photo-box { width:78px; height:92px; flex-shrink:0; border:2px solid rgba(255,255,255,.45); background:rgba(255,255,255,.08); border-radius:2px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .rc-photo-box img { width:100%; height:100%; object-fit:cover; }
        .rc-photo-placeholder { font-size:.55rem; text-align:center; color:rgba(255,255,255,.55); line-height:1.3; padding:0.25rem; }
        .rc-meta { display:grid; grid-template-columns:1fr 1fr; gap:.35rem 1.5rem; padding:1rem 1.5rem; border-bottom:1px solid #dedacd; font-size:.8125rem; background:#faf8f3; }
        .rc-meta-item { display:flex; gap:.4rem; }
        .rc-meta-item > span:first-child { color:#4a5265; min-width:5.5rem; flex-shrink:0; }
        .rc-section { padding:1.1rem 1.5rem .25rem; }
        .rc-section-title { font-family:var(--font-fraunces),Georgia,serif; font-size:.95rem; font-weight:600; color:#1a3a6e; border-bottom:2px solid #1a3a6e; padding-bottom:.3rem; margin-bottom:.75rem; }
        .rc-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        table.rc-scores { width:100%; border-collapse:collapse; font-size:.78rem; min-width:560px; }
        table.rc-scores thead th { background:#1a3a6e; color:#fff; font-weight:600; text-align:center; padding:.5rem .4rem; white-space:nowrap; }
        table.rc-scores thead th:first-child { text-align:left; padding-left:.6rem; }
        table.rc-scores tbody td { border-bottom:1px solid #dedacd; padding:.4rem; text-align:center; }
        table.rc-scores tbody td:first-child { text-align:left; padding-left:.6rem; font-weight:500; }
        table.rc-scores tbody tr:nth-child(even) { background:#f9f7f1; }
        .grade-pill { display:inline-block; font-size:.68rem; font-weight:700; padding:.1rem .4rem; border-radius:3px; }
        .g-a1 { background:#d4edda; color:#155724; }
        .g-b2 { background:#cce5ff; color:#004085; }
        .g-c { background:#fff3cd; color:#856404; }
        .g-d { background:#f8d7da; color:#721c24; }
        .g-e { background:#e2e3e5; color:#383d41; }
        .g-f { background:#f5c6cb; color:#721c24; }
        .rc-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem; padding:.9rem 1.5rem; background:#faf8f3; border-top:1px solid #dedacd; border-bottom:1px solid #dedacd; }
        .rc-summary-item { text-align:center; }
        .rc-summary-item .label { font-size:.65rem; text-transform:uppercase; letter-spacing:.06em; color:#4a5265; margin-bottom:.15rem; }
        .rc-summary-item .value { font-family:var(--font-fraunces),Georgia,serif; font-size:1.25rem; font-weight:600; color:#1a3a6e; font-variant-numeric:tabular-nums; }
        .rc-summary-item .sub { font-size:.65rem; color:#4a5265; }
        .rc-domains { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; padding:1rem 1.5rem; }
        .rc-domain-card { border:1px solid #dedacd; border-radius:4px; overflow:hidden; }
        .rc-domain-card h3 { background:#1a3a6e; color:#fff; font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; padding:.4rem .7rem; }
        .rc-domain-list { padding:.5rem .7rem; font-size:.75rem; }
        .rc-domain-row { display:flex; justify-content:space-between; align-items:center; padding:.28rem 0; border-bottom:1px solid #f0ede3; }
        .rc-domain-row:last-child { border-bottom:none; }
        .rc-rating { display:flex; gap:3px; }
        .rc-dot { width:14px; height:14px; border-radius:50%; border:1.5px solid #dedacd; font-size:.55rem; display:flex; align-items:center; justify-content:center; color:transparent; }
        .rc-dot.on { background:#c9a227; border-color:#c9a227; color:#fff; font-weight:700; }
        .rc-rating-key { font-size:.65rem; color:#4a5265; padding:.5rem 1.5rem .25rem; line-height:1.5; }
        .rc-attendance { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; padding:.75rem 1.5rem 1rem; font-size:.78rem; }
        .rc-att-item span:first-child { color:#4a5265; display:block; font-size:.65rem; }
        .rc-remark-box { border:1px solid #dedacd; border-radius:4px; padding:.75rem 1rem; margin-bottom:.75rem; font-size:.8rem; background:#faf8f3; }
        .rc-remark-box .who { font-size:.65rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#1a3a6e; margin-bottom:.3rem; }
        .rc-remark-box .sign { margin-top:.6rem; font-size:.7rem; color:#4a5265; border-top:1px dashed #dedacd; padding-top:.4rem; display:flex; justify-content:space-between; }
        .rc-grade-scale { padding:.5rem 1.5rem 1rem; font-size:.7rem; }
        .rc-grade-scale table { width:100%; border-collapse:collapse; }
        .rc-grade-scale td { padding:.2rem .4rem; border-bottom:1px solid #f0ede3; }
        .rc-grade-scale td:first-child { font-weight:700; width:2.5rem; color:#1a3a6e; }
        .rc-footer { background:#0f2748; color:rgba(255,255,255,.7); text-align:center; padding:.75rem 1.5rem; font-size:.65rem; }
        .rc-footer strong { color:#c9a227; }
        @media print {
          body { background:white !important; }
          .no-print { display:none !important; }
          .rc-page { box-shadow:none; border:none; max-width:100%; }
        }
        @media (max-width:640px) {
          .rc-meta { grid-template-columns:1fr; }
          .rc-summary { grid-template-columns:1fr 1fr; }
          .rc-domains { grid-template-columns:1fr; }
          .rc-attendance { grid-template-columns:1fr 1fr; }
          .rc-school { font-size:1.05rem; }
          .rc-logo { width:56px; height:56px; }
          .rc-photo-box { width:64px; height:76px; }
          .rc-header-row { gap:0.5rem; }
        }
`;
