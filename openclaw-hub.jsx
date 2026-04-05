import { useState, useEffect, useRef } from "react";

// ── Claw SVG mark ──────────────────────────────────────────────
const ClawMark = ({ size = 24, color = "#f97316" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M8 28 C8 28 10 18 16 14 C14 20 15 26 18 28" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M14 28 C14 28 14 16 20 10 C19 17 20 23 23 28" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M20 28 C20 28 18 15 26 8 C24 16 25 22 28 28" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

// ── Toast ──────────────────────────────────────────────────────
let toastFn = null;
const Toast = () => {
  const [toasts, setToasts] = useState([]);
  toastFn = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#3a1a1a" : "#1a2a1a",
          border: `1px solid ${t.type === "error" ? "#f97316" : "#22c55e"}`,
          color: t.type === "error" ? "#f97316" : "#22c55e",
          padding:"10px 16px", borderRadius:8, fontSize:13,
          fontFamily:"'Courier New', monospace",
          animation:"slideIn 0.3s ease",
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)"
        }}>{t.type === "error" ? "✕ " : "✓ "}{t.msg}</div>
      ))}
    </div>
  );
};

// ── Model Data ─────────────────────────────────────────────────
const MODELS = [
  { id:"gpt4o", name:"GPT-4o", org:"OpenAI", icon:"⬡", type:"closed", tags:["text","vision","code"], free:false,
    desc:"OpenAI's flagship multimodal model.", params:"~200B", context:"128K",
    mmlu:88.7, humaneval:90.2, mtbench:9.1, cost:"$5/1M in",
    endpoint:"https://api.openai.com/v1/chat/completions",
    model:"gpt-4o", envKey:"OPENAI_API_KEY",
    docsUrl:"https://platform.openai.com/docs",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"gpt-4o", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
  { id:"claude", name:"Claude Sonnet 4", org:"Anthropic", icon:"◈", type:"closed", tags:["text","vision","code"], free:true,
    desc:"Anthropic's intelligent model for complex tasks.", params:"~100B", context:"200K",
    mmlu:88.3, humaneval:92.0, mtbench:9.0, cost:"$3/1M in",
    endpoint:"https://api.anthropic.com/v1/messages",
    model:"claude-sonnet-4-20250514", envKey:"ANTHROPIC_API_KEY",
    docsUrl:"https://docs.anthropic.com",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:512, messages:[{role:"user",content:msg}] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.content[0].text;
    }
  },
  { id:"llama", name:"Llama 3.1 405B", org:"Meta AI", icon:"⬟", type:"open", tags:["text","code"], free:true,
    desc:"Meta's largest open-weights model.", params:"405B", context:"128K",
    mmlu:87.3, humaneval:89.0, mtbench:8.7, cost:"Free (self-host)",
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://docs.together.ai",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
  { id:"gemini", name:"Gemini 1.5 Pro", org:"Google", icon:"◇", type:"closed", tags:["text","vision","code"], free:true,
    desc:"Google's model with 1M token context.", params:"~340B", context:"1M",
    mmlu:85.9, humaneval:84.1, mtbench:8.9, cost:"$3.5/1M in",
    endpoint:"https://generativelanguage.googleapis.com/v1beta/models",
    model:"gemini-1.5-pro", envKey:"GOOGLE_API_KEY",
    docsUrl:"https://ai.google.dev/docs",
    callFn: async (key, msg) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:msg}]}] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.candidates[0].content.parts[0].text;
    }
  },
  { id:"mistral", name:"Mistral Large 2", org:"Mistral AI", icon:"◬", type:"closed", tags:["text","code"], free:false,
    desc:"Mistral's flagship multilingual model.", params:"~123B", context:"128K",
    mmlu:84.0, humaneval:92.1, mtbench:8.7, cost:"$2/1M in",
    endpoint:"https://api.mistral.ai/v1/chat/completions",
    model:"mistral-large-latest", envKey:"MISTRAL_API_KEY",
    docsUrl:"https://docs.mistral.ai",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"mistral-large-latest", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
  { id:"deepseek", name:"DeepSeek-V3", org:"DeepSeek", icon:"⬡", type:"open", tags:["text","code"], free:true,
    desc:"671B MoE model, low cost top performance.", params:"671B MoE", context:"64K",
    mmlu:88.5, humaneval:89.9, mtbench:9.0, cost:"$0.27/1M in",
    endpoint:"https://api.deepseek.com/v1/chat/completions",
    model:"deepseek-chat", envKey:"DEEPSEEK_API_KEY",
    docsUrl:"https://platform.deepseek.com/docs",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"deepseek-chat", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
  { id:"qwen", name:"Qwen2.5-72B", org:"Alibaba", icon:"◈", type:"open", tags:["text","code"], free:true,
    desc:"Top open-weight model for coding & math.", params:"72B", context:"128K",
    mmlu:86.1, humaneval:87.2, mtbench:8.8, cost:"Free (self-host)",
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"Qwen/Qwen2.5-72B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://huggingface.co/Qwen",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"Qwen/Qwen2.5-72B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
  { id:"phi4", name:"Phi-4", org:"Microsoft", icon:"◻", type:"open", tags:["text","code"], free:true,
    desc:"14B model that punches above its weight.", params:"14B", context:"16K",
    mmlu:84.8, humaneval:82.6, mtbench:8.5, cost:"Free (self-host)",
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"microsoft/phi-4", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://huggingface.co/microsoft/phi-4",
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"microsoft/phi-4", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      return d.choices[0].message.content;
    }
  },
];

// ── Styles ─────────────────────────────────────────────────────
const S = {
  app: {
    background:"#0d0a06", color:"#e8dcc8", minHeight:"100vh",
    fontFamily:"'Courier New', 'Courier', monospace",
    position:"relative", overflow:"hidden"
  },
  // Nav
  nav: {
    position:"sticky", top:0, zIndex:200,
    background:"rgba(13,10,6,0.92)", backdropFilter:"blur(20px)",
    borderBottom:"1px solid #2a1f0e",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"0 32px", height:60
  },
  navLogo: {
    display:"flex", alignItems:"center", gap:10,
    fontFamily:"'Georgia', serif", fontWeight:700,
    fontSize:20, letterSpacing:"-0.5px", cursor:"pointer"
  },
  navLinks: { display:"flex", gap:4 },
  navLink: (active) => ({
    background: active ? "rgba(249,115,22,0.12)" : "transparent",
    border: active ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
    color: active ? "#f97316" : "#8a7a62",
    padding:"6px 14px", borderRadius:6, cursor:"pointer",
    fontSize:12, letterSpacing:"0.06em", transition:"all 0.15s",
    fontFamily:"'Courier New', monospace"
  }),
  // Layout
  main: { maxWidth:1280, margin:"0 auto", padding:"32px 32px" },
  // Cards
  card: (hover) => ({
    background:"#120e08", border:`1px solid ${hover?"#f97316":"#2a1f0e"}`,
    borderRadius:12, padding:24, transition:"all 0.2s", cursor:"pointer",
    position:"relative", overflow:"hidden"
  }),
  // Inputs
  input: {
    background:"#1a1208", border:"1px solid #2a1f0e",
    color:"#e8dcc8", padding:"10px 14px", borderRadius:8,
    fontFamily:"'Courier New', monospace", fontSize:13, width:"100%",
    outline:"none", transition:"border 0.15s"
  },
  btn: (variant="primary") => ({
    background: variant==="primary" ? "#f97316" : variant==="ghost" ? "transparent" : "#1a1208",
    color: variant==="primary" ? "#0d0a06" : "#e8dcc8",
    border: variant==="ghost" ? "1px solid #2a1f0e" : "none",
    padding:"9px 18px", borderRadius:7, cursor:"pointer",
    fontFamily:"'Courier New', monospace", fontWeight:700,
    fontSize:12, letterSpacing:"0.05em", transition:"all 0.15s",
    display:"inline-flex", alignItems:"center", gap:6
  }),
  badge: (type) => {
    const map = {
      open:{bg:"rgba(34,197,94,0.1)",color:"#22c55e",border:"rgba(34,197,94,0.25)"},
      closed:{bg:"rgba(249,115,22,0.1)",color:"#f97316",border:"rgba(249,115,22,0.25)"},
      free:{bg:"rgba(234,179,8,0.1)",color:"#eab308",border:"rgba(234,179,8,0.25)"},
      new:{bg:"rgba(239,68,68,0.1)",color:"#ef4444",border:"rgba(239,68,68,0.25)"},
      vision:{bg:"rgba(139,92,246,0.1)",color:"#8b5cf6",border:"rgba(139,92,246,0.25)"},
    };
    const c = map[type]||map.open;
    return { background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      padding:"2px 8px", borderRadius:4, fontSize:10, letterSpacing:"0.08em", fontWeight:600 };
  },
  sectionTitle: { fontFamily:"'Georgia', serif", fontSize:22, fontWeight:700, marginBottom:4, color:"#f4e4c4" },
  muted: { color:"#6b5c42", fontSize:13 },
  grid2: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 },
  grid3: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 },
  flex: (gap=12,align="center",justify="flex-start") => ({display:"flex",alignItems:align,justifyContent:justify,gap}),
  tag: { background:"#1a1208", border:"1px solid #2a1f0e", color:"#8a7a62",
    padding:"3px 8px", borderRadius:4, fontSize:11 },
};

// ── Scratch/Claw bg decoration ─────────────────────────────────
const BgDecor = () => (
  <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:0.03,zIndex:0}} viewBox="0 0 800 600">
    <path d="M0 150 C200 100 300 200 500 120 S700 180 800 140" stroke="#f97316" strokeWidth="1" fill="none"/>
    <path d="M0 300 C150 250 350 350 550 270 S750 330 800 290" stroke="#f97316" strokeWidth="1" fill="none"/>
    <path d="M0 450 C100 400 400 500 600 420 S780 480 800 440" stroke="#f97316" strokeWidth="1" fill="none"/>
    <path d="M100 0 C80 150 120 300 90 450 S110 550 100 600" stroke="#f97316" strokeWidth="0.5" fill="none"/>
    <path d="M400 0 C380 200 420 350 390 500 S410 580 400 600" stroke="#f97316" strokeWidth="0.5" fill="none"/>
    <path d="M700 0 C680 180 720 320 690 470 S710 560 700 600" stroke="#f97316" strokeWidth="0.5" fill="none"/>
  </svg>
);

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("explore");
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oc_keys")||"{}"); } catch { return {}; }
  });
  const [usageLogs, setUsageLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oc_logs")||"[]"); } catch { return []; }
  });
  const [savedModels, setSavedModels] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oc_saved")||"[]"); } catch { return []; }
  });
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [compareList, setCompareList] = useState([]);
  const [testModal, setTestModal] = useState(null);
  const [keyModal, setKeyModal] = useState(null);
  const [hovered, setHovered] = useState(null);

  // Persist
  useEffect(() => { localStorage.setItem("oc_keys", JSON.stringify(apiKeys)); }, [apiKeys]);
  useEffect(() => { localStorage.setItem("oc_logs", JSON.stringify(usageLogs)); }, [usageLogs]);
  useEffect(() => { localStorage.setItem("oc_saved", JSON.stringify(savedModels)); }, [savedModels]);

  const logUsage = (modelId, prompt, success, tokens) => {
    setUsageLogs(p => [{
      id: Date.now(), modelId, prompt: prompt.slice(0,60),
      success, tokens, ts: new Date().toISOString()
    }, ...p].slice(0, 200));
  };

  const toggleSave = (id) => {
    setSavedModels(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  };

  const toggleCompare = (id) => {
    setCompareList(p => p.includes(id) ? p.filter(x=>x!==id) : p.length < 3 ? [...p, id] : p);
  };

  // Filter models
  const filtered = MODELS.filter(m => {
    if (filterType === "open" && m.type !== "open") return false;
    if (filterType === "closed" && m.type !== "closed") return false;
    if (filterType === "saved" && !savedModels.includes(m.id)) return false;
    if (filterTag !== "all" && !m.tags.includes(filterTag)) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.org.toLowerCase().includes(q) && !m.tags.some(t=>t.includes(q))) return false;
    }
    return true;
  });

  const pages = [
    { id:"explore", label:"EXPLORE" },
    { id:"leaderboard", label:"LEADERBOARD" },
    { id:"playground", label:"PLAYGROUND" },
    { id:"compare", label:`COMPARE${compareList.length>0?` (${compareList.length})`:""}` },
    { id:"dashboard", label:"DASHBOARD" },
  ];

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0d0a06; }
        ::-webkit-scrollbar-thumb { background:#2a1f0e; border-radius:3px; }
        input:focus { border-color:#f97316 !important; }
        textarea:focus { border-color:#f97316 !important; }
        select:focus { outline:none; border-color:#f97316 !important; }
        @keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scratch { from { strokeDashoffset: 100; } to { strokeDashoffset: 0; } }
        .page-enter { animation: fadeIn 0.35s ease; }
        .hov-card:hover { border-color:#f97316 !important; transform:translateY(-2px); }
        .hov-btn:hover { opacity:0.82; transform:translateY(-1px); }
      `}</style>

      <BgDecor />
      <Toast />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo} onClick={() => setPage("explore")}>
          <ClawMark size={28} />
          <span style={{color:"#f4e4c4"}}>Open</span>
          <span style={{color:"#f97316"}}>Claw</span>
        </div>
        <div style={S.navLinks}>
          {pages.map(p => (
            <button key={p.id} style={S.navLink(page===p.id)} onClick={()=>setPage(p.id)}
              className="hov-btn">{p.label}</button>
          ))}
        </div>
        <button style={{...S.btn("primary"), fontSize:11}} className="hov-btn" onClick={()=>setPage("dashboard")}>
          <span>⚙</span> API Keys
        </button>
      </nav>

      <div style={{position:"relative", zIndex:1}}>
        {page === "explore" && (
          <ExplorePage
            filtered={filtered} models={MODELS} apiKeys={apiKeys}
            filterType={filterType} setFilterType={setFilterType}
            filterTag={filterTag} setFilterTag={setFilterTag}
            searchQ={searchQ} setSearchQ={setSearchQ}
            savedModels={savedModels} toggleSave={toggleSave}
            compareList={compareList} toggleCompare={toggleCompare}
            setTestModal={setTestModal} setKeyModal={setKeyModal}
            setPage={setPage}
          />
        )}
        {page === "leaderboard" && <LeaderboardPage models={MODELS} apiKeys={apiKeys} setTestModal={setTestModal} />}
        {page === "playground" && <PlaygroundPage models={MODELS} apiKeys={apiKeys} logUsage={logUsage} />}
        {page === "compare" && <ComparePage compareList={compareList} models={MODELS} apiKeys={apiKeys} setCompareList={setCompareList} toggleCompare={toggleCompare} />}
        {page === "dashboard" && <DashboardPage apiKeys={apiKeys} setApiKeys={setApiKeys} usageLogs={usageLogs} savedModels={savedModels} models={MODELS} setPage={setPage} />}
      </div>

      {/* Test Modal */}
      {testModal && (
        <TestModal model={testModal} apiKeys={apiKeys} logUsage={logUsage}
          onClose={() => setTestModal(null)} onAddKey={() => { setKeyModal(testModal); setTestModal(null); }} />
      )}
      {/* Key Modal */}
      {keyModal && (
        <KeyModal model={keyModal} apiKeys={apiKeys} setApiKeys={setApiKeys}
          onClose={() => setKeyModal(null)} />
      )}
    </div>
  );
}

// ══ EXPLORE PAGE ═══════════════════════════════════════════════
function ExplorePage({ filtered, models, apiKeys, filterType, setFilterType, filterTag, setFilterTag,
  searchQ, setSearchQ, savedModels, toggleSave, compareList, toggleCompare, setTestModal, setKeyModal, setPage }) {

  return (
    <div style={S.main} className="page-enter">
      {/* Hero */}
      <div style={{padding:"48px 0 40px", borderBottom:"1px solid #1e1508", marginBottom:32}}>
        <div style={{...S.flex(8,"center"), marginBottom:16}}>
          <ClawMark size={36} />
          <div>
            <div style={{fontFamily:"Georgia,serif", fontSize:40, fontWeight:700, lineHeight:1.1, color:"#f4e4c4", letterSpacing:"-1px"}}>
              Every AI Model. <span style={{color:"#f97316"}}>Clawed Open.</span>
            </div>
            <div style={{color:"#6b5c42", fontSize:15, marginTop:8}}>
              Discover, compare, test and access APIs for open & closed AI models — all in one hunt.
            </div>
          </div>
        </div>
        <div style={S.flex(12,"center")}>
          {[
            {n:"127+", l:"Models Tracked"},
            {n:"48", l:"Open Source"},
            {n:"79", l:"Closed / API"},
            {n:"14", l:"Benchmarks"},
          ].map(s => (
            <div key={s.l} style={{background:"#120e08", border:"1px solid #2a1f0e", borderRadius:10,
              padding:"14px 24px", textAlign:"center"}}>
              <div style={{fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:"#f97316"}}>{s.n}</div>
              <div style={{color:"#6b5c42", fontSize:11, marginTop:2, letterSpacing:"0.06em"}}>{s.l}</div>
            </div>
          ))}
          <button style={{...S.btn("ghost"), marginLeft:"auto"}} onClick={() => setPage("compare")}
            className="hov-btn">
            {compareList.length > 0 ? `⊞ Compare (${compareList.length})` : "⊞ Compare Models"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{...S.flex(12,"flex-start","flex-start"), flexDirection:"column", marginBottom:24, gap:12}}>
        <div style={S.flex(8)}>
          <div style={{position:"relative", flex:1, maxWidth:360}}>
            <span style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#6b5c42", fontSize:14}}>⌕</span>
            <input style={{...S.input, paddingLeft:34}} placeholder="Search models, orgs, tags..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
          </div>
          <span style={{color:"#6b5c42", fontSize:12}}>{filtered.length} models</span>
        </div>
        <div style={S.flex(6)}>
          {[["all","All"],["open","Open Source"],["closed","Closed / API"],["saved","Saved"]].map(([v,l]) => (
            <button key={v} style={{
              ...S.btn("ghost"),
              borderColor: filterType===v ? "#f97316" : "#2a1f0e",
              color: filterType===v ? "#f97316" : "#8a7a62",
              background: filterType===v ? "rgba(249,115,22,0.08)" : "#120e08"
            }} onClick={() => setFilterType(v)} className="hov-btn">{l}</button>
          ))}
          <div style={{width:1, height:24, background:"#2a1f0e"}} />
          {["all","text","code","vision"].map(t => (
            <button key={t} style={{
              ...S.btn("ghost"), fontSize:11,
              borderColor: filterTag===t ? "#f97316" : "#2a1f0e",
              color: filterTag===t ? "#f97316" : "#6b5c42"
            }} onClick={() => setFilterTag(t)} className="hov-btn">{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={S.grid2}>
        {filtered.map(m => (
          <ModelCard key={m.id} model={m} apiKeys={apiKeys}
            saved={savedModels.includes(m.id)} onToggleSave={() => toggleSave(m.id)}
            comparing={compareList.includes(m.id)} onToggleCompare={() => toggleCompare(m.id)}
            onTest={() => setTestModal(m)} onAddKey={() => setKeyModal(m)} />
        ))}
        {filtered.length === 0 && (
          <div style={{gridColumn:"1/-1", textAlign:"center", padding:60, color:"#6b5c42"}}>
            <ClawMark size={48} color="#2a1f0e" />
            <div style={{marginTop:16, fontSize:14}}>No models match your filters.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══ MODEL CARD ════════════════════════════════════════════════
function ModelCard({ model:m, apiKeys, saved, onToggleSave, comparing, onToggleCompare, onTest, onAddKey }) {
  const hasKey = !!apiKeys[m.id];
  const [hover, setHover] = useState(false);

  return (
    <div className="hov-card" style={{
      background:"#120e08", border:`1px solid ${hover?"#f97316":comparing?"rgba(249,115,22,0.4)":"#2a1f0e"}`,
      borderRadius:12, padding:20, transition:"all 0.2s", position:"relative", overflow:"hidden"
    }} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      {/* Top accent line */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background: m.type==="open" ? "#22c55e" : "#f97316",
        transform:`scaleX(${hover?1:0})`, transformOrigin:"left", transition:"transform 0.3s"}} />

      <div style={S.flex(12,"flex-start","space-between")}>
        <div style={S.flex(10)}>
          <div style={{width:40,height:40,background:"rgba(249,115,22,0.08)",border:"1px solid #2a1f0e",
            borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,color:"#f97316"}}>
            {m.icon}
          </div>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:15,color:"#f4e4c4"}}>{m.name}</div>
            <div style={{color:"#6b5c42",fontSize:11,marginTop:2}}>{m.org}</div>
          </div>
        </div>
        <div style={S.flex(6)}>
          <button style={{background:"none",border:"none",cursor:"pointer",
            fontSize:16, color: saved?"#f97316":"#3a2a1a", padding:4}}
            onClick={onToggleSave} title="Save model">
            {saved ? "★" : "☆"}
          </button>
          <button style={{background:comparing?"rgba(249,115,22,0.12)":"none",
            border:comparing?"1px solid #f97316":"1px solid #2a1f0e",
            color:comparing?"#f97316":"#6b5c42",
            borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:"'Courier New',monospace"}}
            onClick={onToggleCompare}>
            {comparing ? "⊟" : "⊞"}
          </button>
        </div>
      </div>

      <div style={{...S.flex(6), marginTop:10, flexWrap:"wrap"}}>
        <span style={S.badge(m.type)}>{m.type==="open"?"OPEN":"CLOSED"}</span>
        {m.free && <span style={S.badge("free")}>FREE TIER</span>}
        {m.tags.includes("vision") && <span style={S.badge("vision")}>VISION</span>}
        {m.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}
      </div>

      <div style={{color:"#8a7a62",fontSize:12,lineHeight:1.6,margin:"12px 0"}}>{m.desc}</div>

      <div style={{...S.flex(0,"stretch","space-between"), flexDirection:"column", gap:6, marginBottom:14}}>
        {[["MMLU", m.mmlu, 100], ["HumanEval", m.humaneval, 100]].map(([label, val, max]) => (
          <div key={label}>
            <div style={{...S.flex(0,"center","space-between"), marginBottom:3}}>
              <span style={{fontSize:10,color:"#6b5c42",letterSpacing:"0.05em"}}>{label}</span>
              <span style={{fontSize:11,color:"#e8dcc8"}}>{val}%</span>
            </div>
            <div style={{height:3,background:"#1a1208",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${val/max*100}%`,
                background:"linear-gradient(90deg,#f97316,#fbbf24)",borderRadius:2,
                transition:"width 1s ease"}} />
            </div>
          </div>
        ))}
      </div>

      <div style={{...S.flex(6,"center","space-between"), paddingTop:12, borderTop:"1px solid #1e1508"}}>
        <div style={{fontSize:11,color:"#6b5c42"}}>
          <span style={{color:"#e8dcc8"}}>{m.params}</span> · <span style={{color:"#e8dcc8"}}>{m.context} ctx</span> · {m.cost}
        </div>
        <div style={S.flex(6)}>
          {hasKey ? (
            <button style={S.btn("primary")} onClick={onTest} className="hov-btn">▶ Test</button>
          ) : (
            <button style={{...S.btn("ghost"), borderColor:"#f97316", color:"#f97316"}}
              onClick={onAddKey} className="hov-btn">+ Add Key</button>
          )}
          <a href={m.docsUrl} target="_blank" rel="noreferrer"
            style={{...S.btn("ghost"), textDecoration:"none"}}>Docs ↗</a>
        </div>
      </div>
    </div>
  );
}

// ══ LEADERBOARD PAGE ══════════════════════════════════════════
function LeaderboardPage({ models, apiKeys, setTestModal }) {
  const [sortBy, setSortBy] = useState("overall");
  const [bench, setBench] = useState("all");

  const scored = models.map(m => ({
    ...m,
    overall: ((m.mmlu + m.humaneval + m.mtbench*10) / 3).toFixed(1),
    score: sortBy==="mmlu" ? m.mmlu : sortBy==="humaneval" ? m.humaneval : sortBy==="mtbench" ? m.mtbench*10 : ((m.mmlu + m.humaneval + m.mtbench*10)/3)
  })).sort((a,b)=>b.score-a.score);

  return (
    <div style={S.main} className="page-enter">
      <div style={{marginBottom:32}}>
        <div style={S.sectionTitle}>Performance Leaderboard</div>
        <div style={S.muted}>Live rankings across MMLU, HumanEval and MT-Bench evaluations</div>
      </div>

      <div style={S.flex(8,"center","space-between",{marginBottom:24})}>
        <div style={S.flex(6)}>
          {[["overall","Overall"],["mmlu","MMLU"],["humaneval","HumanEval"],["mtbench","MT-Bench"]].map(([v,l]) => (
            <button key={v} style={{
              ...S.btn("ghost"), fontSize:11,
              borderColor:sortBy===v?"#f97316":"#2a1f0e",
              color:sortBy===v?"#f97316":"#6b5c42",
              background:sortBy===v?"rgba(249,115,22,0.08)":"#120e08"
            }} onClick={()=>setSortBy(v)} className="hov-btn">{l}</button>
          ))}
        </div>
        <div style={{color:"#6b5c42",fontSize:12}}>{scored.length} models ranked</div>
      </div>

      <div style={{background:"#120e08", border:"1px solid #2a1f0e", borderRadius:12, overflow:"hidden"}}>
        {/* Header */}
        <div style={{display:"grid", gridTemplateColumns:"48px 1fr 110px 110px 110px 100px 120px",
          padding:"12px 20px", background:"#1a1208", borderBottom:"1px solid #2a1f0e",
          fontSize:10, color:"#6b5c42", letterSpacing:"0.08em"}}>
          <div>#</div><div>MODEL</div><div>MMLU</div><div>HUMANEVAL</div><div>MT-BENCH</div>
          <div>OVERALL</div><div style={{textAlign:"right"}}>ACTION</div>
        </div>

        {scored.map((m, i) => {
          const rankColors = ["#ffd700","#c0c0c0","#cd7f32"];
          const hasKey = !!apiKeys[m.id];
          return (
            <div key={m.id} style={{display:"grid",
              gridTemplateColumns:"48px 1fr 110px 110px 110px 100px 120px",
              padding:"14px 20px", borderBottom:"1px solid #1a1208",
              alignItems:"center", transition:"background 0.15s",
              cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1a1208"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:16,
                color:rankColors[i]||"#6b5c42"}}>{i+1}</div>
              <div style={S.flex(10)}>
                <div style={{width:32,height:32,background:"rgba(249,115,22,0.08)",border:"1px solid #2a1f0e",
                  borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,color:"#f97316"}}>{m.icon}</div>
                <div>
                  <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:13,color:"#f4e4c4"}}>{m.name}</div>
                  <div style={{fontSize:11,color:"#6b5c42"}}>{m.org}</div>
                </div>
                <span style={S.badge(m.type)}>{m.type==="open"?"OPEN":"CLOSED"}</span>
              </div>
              {[m.mmlu, m.humaneval, m.mtbench*10].map((v,idx) => (
                <div key={idx}>
                  <div style={{fontSize:13,color:"#e8dcc8",fontWeight:600}}>{v.toFixed(1)}</div>
                  <div style={{height:2,background:"#1a1208",borderRadius:1,marginTop:4,width:70,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${v}%`,background:"linear-gradient(90deg,#f97316,#fbbf24)",borderRadius:1}} />
                  </div>
                </div>
              ))}
              <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:16,
                color: i===0?"#f97316":"#e8dcc8"}}>{m.overall}</div>
              <div style={{textAlign:"right"}}>
                {hasKey ? (
                  <button style={{...S.btn("primary"),fontSize:10}} onClick={()=>setTestModal(m)} className="hov-btn">▶ Test</button>
                ) : (
                  <span style={{fontSize:11,color:"#6b5c42"}}>No key</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Benchmark info */}
      <div style={{...S.grid3, marginTop:24}}>
        {[
          {name:"MMLU",desc:"57-subject multiple choice test measuring broad knowledge across STEM, humanities, and more.",source:"papers.nips.cc"},
          {name:"HumanEval",desc:"164 hand-crafted Python programming problems evaluating code synthesis from docstrings.",source:"github.com/openai"},
          {name:"MT-Bench",desc:"Multi-turn conversation benchmark with GPT-4 as judge, scored 0–10.",source:"lmsys.org"},
        ].map(b => (
          <div key={b.name} style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:10,padding:16}}>
            <div style={{fontFamily:"Georgia,serif",fontWeight:700,color:"#f97316",marginBottom:6}}>{b.name}</div>
            <div style={{color:"#8a7a62",fontSize:12,lineHeight:1.6}}>{b.desc}</div>
            <div style={{color:"#6b5c42",fontSize:10,marginTop:8}}>Source: {b.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══ PLAYGROUND PAGE ═══════════════════════════════════════════
function PlaygroundPage({ models, apiKeys, logUsage }) {
  const [selectedId, setSelectedId] = useState("claude");
  const [prompt, setPrompt] = useState("");
  const [sysPrompt, setSysPrompt] = useState("You are a helpful assistant.");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [temp, setTemp] = useState(0.7);
  const [showConfig, setShowConfig] = useState(false);
  const endRef = useRef(null);

  const model = models.find(m=>m.id===selectedId);
  const hasKey = !!apiKeys[selectedId];

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const send = async () => {
    if (!prompt.trim() || loading || !hasKey) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages(p => [...p, {role:"user", content:userMsg}]);
    setLoading(true);
    try {
      const resp = await model.callFn(apiKeys[selectedId], userMsg);
      setMessages(p => [...p, {role:"assistant", content:resp, modelId:selectedId}]);
      logUsage(selectedId, userMsg, true, Math.floor(resp.length/4));
      toastFn?.(`Response from ${model.name}`, "success");
    } catch(e) {
      setMessages(p => [...p, {role:"error", content:`Error: ${e.message}`}]);
      logUsage(selectedId, userMsg, false, 0);
      toastFn?.(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div style={{...S.main, display:"grid", gridTemplateColumns:"260px 1fr", gap:20, height:"calc(100vh - 100px)"}} className="page-enter">
      {/* Sidebar */}
      <div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
        <div style={S.sectionTitle}>Playground</div>
        <div style={{color:"#6b5c42",fontSize:12,marginBottom:4}}>Select Model</div>
        {models.map(m => {
          const hk = !!apiKeys[m.id];
          return (
            <div key={m.id} style={{
              background: selectedId===m.id ? "rgba(249,115,22,0.1)" : "#120e08",
              border: `1px solid ${selectedId===m.id?"#f97316":"#2a1f0e"}`,
              borderRadius:8, padding:"10px 14px", cursor:"pointer",
              transition:"all 0.15s"
            }} onClick={() => setSelectedId(m.id)}>
              <div style={{...S.flex(8,"center","space-between")}}>
                <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:13,color:"#f4e4c4"}}>{m.name}</div>
                <span style={{fontSize:10,color:hk?"#22c55e":"#6b5c42"}}>{hk?"●":"○"}</span>
              </div>
              <div style={{fontSize:11,color:"#6b5c42",marginTop:2}}>{m.org} · {m.context}</div>
            </div>
          );
        })}

        <div style={{marginTop:8, borderTop:"1px solid #1e1508", paddingTop:12}}>
          <button style={{...S.btn("ghost"),width:"100%",justifyContent:"center",fontSize:11}}
            onClick={()=>setShowConfig(!showConfig)} className="hov-btn">
            {showConfig?"▲ Hide Config":"▼ Config"}
          </button>
          {showConfig && (
            <div style={{marginTop:12, display:"flex", flexDirection:"column", gap:10}}>
              <div>
                <div style={{fontSize:11,color:"#6b5c42",marginBottom:4}}>SYSTEM PROMPT</div>
                <textarea value={sysPrompt} onChange={e=>setSysPrompt(e.target.value)}
                  style={{...S.input, height:80, resize:"vertical", fontSize:11}} />
              </div>
              <div>
                <div style={{...S.flex(0,"center","space-between"), marginBottom:4}}>
                  <span style={{fontSize:11,color:"#6b5c42"}}>TEMPERATURE</span>
                  <span style={{fontSize:11,color:"#f97316"}}>{temp}</span>
                </div>
                <input type="range" min={0} max={2} step={0.1} value={temp}
                  onChange={e=>setTemp(parseFloat(e.target.value))}
                  style={{width:"100%",accentColor:"#f97316"}} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div style={{display:"flex",flexDirection:"column",background:"#120e08",
        border:"1px solid #2a1f0e",borderRadius:12,overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"14px 20px",borderBottom:"1px solid #1e1508",
          ...S.flex(10,"center","space-between")}}>
          <div style={S.flex(10)}>
            <div style={{width:32,height:32,background:"rgba(249,115,22,0.08)",border:"1px solid #2a1f0e",
              borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,color:"#f97316"}}>{model.icon}</div>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#f4e4c4"}}>{model.name}</div>
              <div style={{fontSize:11,color:"#6b5c42"}}>{model.org} · {model.context} context</div>
            </div>
          </div>
          <div style={S.flex(8)}>
            {!hasKey && (
              <span style={{fontSize:11,color:"#f97316",border:"1px solid rgba(249,115,22,0.3)",
                padding:"3px 10px",borderRadius:4}}>⚠ No API key</span>
            )}
            <button style={{...S.btn("ghost"),fontSize:11}} onClick={()=>setMessages([])} className="hov-btn">
              ↺ Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflow:"auto",padding:20,display:"flex",flexDirection:"column",gap:16}}>
          {messages.length === 0 && (
            <div style={{textAlign:"center",padding:60,color:"#6b5c42"}}>
              <ClawMark size={40} color="#2a1f0e" />
              <div style={{marginTop:12,fontSize:13}}>Start a conversation with {model.name}</div>
              {!hasKey && (
                <div style={{marginTop:8,fontSize:12,color:"#f97316"}}>
                  Add an API key in Dashboard to enable testing
                </div>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:"flex", justifyContent: msg.role==="user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth:"75%",
                background: msg.role==="user" ? "rgba(249,115,22,0.12)" :
                            msg.role==="error" ? "rgba(239,68,68,0.1)" : "#1a1208",
                border: `1px solid ${msg.role==="user"?"rgba(249,115,22,0.3)":msg.role==="error"?"rgba(239,68,68,0.3)":"#2a1f0e"}`,
                borderRadius: msg.role==="user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding:"12px 16px",
                color: msg.role==="error" ? "#ef4444" : "#e8dcc8",
                fontSize:13, lineHeight:1.7,
                fontFamily:"'Courier New',monospace", whiteSpace:"pre-wrap"
              }}>
                {msg.role==="assistant" && (
                  <div style={{fontSize:10,color:"#6b5c42",marginBottom:6,letterSpacing:"0.06em"}}>
                    {models.find(m=>m.id===msg.modelId)?.name || "Assistant"}
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{...S.flex(8), color:"#f97316", fontSize:12}}>
              <span style={{animation:"pulse 1s infinite"}}>●</span>
              <span style={{animation:"pulse 1s infinite 0.2s"}}>●</span>
              <span style={{animation:"pulse 1s infinite 0.4s"}}>●</span>
              <span style={{marginLeft:8,color:"#6b5c42"}}>Generating…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{padding:"14px 20px",borderTop:"1px solid #1e1508"}}>
          <div style={S.flex(8)}>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={hasKey ? `Message ${model.name}… (Enter to send, Shift+Enter for newline)` : "Add an API key to start chatting…"}
              disabled={!hasKey || loading}
              style={{...S.input, height:50, resize:"none", flex:1, fontSize:13}} />
            <button style={{...S.btn("primary"), height:50, padding:"0 20px"}}
              onClick={send} disabled={!hasKey||loading||!prompt.trim()} className="hov-btn">
              ↑ Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ COMPARE PAGE ══════════════════════════════════════════════
function ComparePage({ compareList, models, apiKeys, setCompareList, toggleCompare }) {
  const compared = compareList.map(id => models.find(m=>m.id===id)).filter(Boolean);
  const all = models;

  if (compareList.length === 0) return (
    <div style={{...S.main, textAlign:"center", padding:"80px 0"}} className="page-enter">
      <ClawMark size={48} color="#2a1f0e" />
      <div style={{fontFamily:"Georgia,serif",fontSize:22,color:"#6b5c42",marginTop:16}}>No models selected</div>
      <div style={{color:"#6b5c42",fontSize:13,marginTop:8}}>Go to Explore and click ⊞ on up to 3 models to compare them.</div>
    </div>
  );

  const metrics = [
    {label:"Parameters", key:"params"},
    {label:"Context Window", key:"context"},
    {label:"Cost", key:"cost"},
    {label:"MMLU (%)", key:"mmlu"},
    {label:"HumanEval (%)", key:"humaneval"},
    {label:"MT-Bench (/10)", key:"mtbench"},
    {label:"Type", key:"type"},
    {label:"Free Tier", fn: m => m.free ? "✓ Yes" : "✗ No"},
    {label:"Vision", fn: m => m.tags.includes("vision") ? "✓ Yes" : "✗ No"},
    {label:"Code", fn: m => m.tags.includes("code") ? "✓ Yes" : "✗ No"},
  ];

  return (
    <div style={S.main} className="page-enter">
      <div style={{...S.flex(0,"center","space-between"), marginBottom:28}}>
        <div>
          <div style={S.sectionTitle}>Side-by-Side Compare</div>
          <div style={S.muted}>Comparing {compared.length} models</div>
        </div>
        <button style={S.btn("ghost")} onClick={()=>setCompareList([])} className="hov-btn">
          ✕ Clear All
        </button>
      </div>

      {/* Add more */}
      {compareList.length < 3 && (
        <div style={{background:"rgba(249,115,22,0.04)",border:"1px dashed #2a1f0e",borderRadius:10,
          padding:16, marginBottom:20}}>
          <div style={{fontSize:12,color:"#6b5c42",marginBottom:10}}>Add another model to compare:</div>
          <div style={S.flex(8,undefined,undefined,{flexWrap:"wrap"})}>
            {all.filter(m=>!compareList.includes(m.id)).map(m => (
              <button key={m.id} style={{...S.btn("ghost"),fontSize:11}} onClick={()=>toggleCompare(m.id)} className="hov-btn">
                + {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:12,overflow:"hidden"}}>
        {/* Header */}
        <div style={{display:"grid",gridTemplateColumns:`180px repeat(${compared.length},1fr)`,
          background:"#1a1208",borderBottom:"1px solid #2a1f0e"}}>
          <div style={{padding:"14px 20px",fontSize:11,color:"#6b5c42",letterSpacing:"0.06em"}}>METRIC</div>
          {compared.map(m => (
            <div key={m.id} style={{padding:"14px 20px",borderLeft:"1px solid #2a1f0e"}}>
              <div style={S.flex(8)}>
                <span style={{color:"#f97316",fontSize:18}}>{m.icon}</span>
                <div>
                  <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:13,color:"#f4e4c4"}}>{m.name}</div>
                  <div style={{fontSize:11,color:"#6b5c42"}}>{m.org}</div>
                </div>
                <button style={{marginLeft:"auto",background:"none",border:"none",
                  color:"#6b5c42",cursor:"pointer",fontSize:14}} onClick={()=>toggleCompare(m.id)}>✕</button>
              </div>
              <div style={{...S.flex(4), marginTop:8, flexWrap:"wrap"}}>
                <span style={S.badge(m.type)}>{m.type==="open"?"OPEN":"CLOSED"}</span>
                {m.free && <span style={S.badge("free")}>FREE</span>}
              </div>
            </div>
          ))}
        </div>

        {metrics.map((mt, ri) => {
          const vals = compared.map(m => mt.fn ? mt.fn(m) : m[mt.key]);
          const numVals = vals.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
          const maxVal = numVals.length > 0 ? Math.max(...numVals) : null;

          return (
            <div key={mt.label} style={{display:"grid",
              gridTemplateColumns:`180px repeat(${compared.length},1fr)`,
              borderBottom:"1px solid #1a1208",
              background: ri%2===0 ? "transparent" : "rgba(255,255,255,0.01)"}}>
              <div style={{padding:"12px 20px",fontSize:12,color:"#6b5c42",letterSpacing:"0.04em",
                display:"flex",alignItems:"center"}}>{mt.label}</div>
              {compared.map(m => {
                const val = mt.fn ? mt.fn(m) : m[mt.key];
                const numVal = parseFloat(val);
                const isBest = maxVal !== null && numVal === maxVal;
                return (
                  <div key={m.id} style={{padding:"12px 20px",borderLeft:"1px solid #1e1508",
                    display:"flex",alignItems:"center"}}>
                    <span style={{
                      fontFamily:"Georgia,serif",fontWeight:isBest?700:400,
                      fontSize:13, color: isBest?"#f97316":"#e8dcc8"
                    }}>
                      {isBest && "★ "}{val}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══ DASHBOARD PAGE ════════════════════════════════════════════
function DashboardPage({ apiKeys, setApiKeys, usageLogs, savedModels, models, setPage }) {
  const [editKey, setEditKey] = useState({});
  const [showKey, setShowKey] = useState({});
  const [activeTab, setActiveTab] = useState("keys");

  const saveKey = (modelId) => {
    const val = editKey[modelId]?.trim();
    if (!val) return;
    setApiKeys(p => ({...p, [modelId]: val}));
    setEditKey(p => ({...p, [modelId]: ""}));
    toastFn?.(`Key saved for ${models.find(m=>m.id===modelId)?.name}`);
  };

  const removeKey = (modelId) => {
    setApiKeys(p => { const n={...p}; delete n[modelId]; return n; });
    toastFn?.(`Key removed`, "error");
  };

  const keyCount = Object.keys(apiKeys).length;
  const totalCalls = usageLogs.length;
  const successCalls = usageLogs.filter(l=>l.success).length;
  const totalTokens = usageLogs.reduce((a,l)=>a+(l.tokens||0),0);

  // Usage by model
  const byModel = models.map(m => ({
    ...m,
    calls: usageLogs.filter(l=>l.modelId===m.id).length,
    success: usageLogs.filter(l=>l.modelId===m.id && l.success).length,
    tokens: usageLogs.filter(l=>l.modelId===m.id).reduce((a,l)=>a+(l.tokens||0),0),
  })).filter(m=>m.calls>0).sort((a,b)=>b.calls-a.calls);

  const tabs = [
    {id:"keys", label:"API Keys"},
    {id:"usage", label:"Usage Analytics"},
    {id:"logs", label:"Call Logs"},
    {id:"saved", label:"Saved Models"},
  ];

  return (
    <div style={S.main} className="page-enter">
      <div style={{marginBottom:28}}>
        <div style={S.sectionTitle}>User Dashboard</div>
        <div style={S.muted}>Manage your API keys, track usage, and review history</div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[
          {n:keyCount,l:"API Keys Stored",icon:"🔑",c:"#f97316"},
          {n:totalCalls,l:"Total API Calls",icon:"⚡",c:"#22c55e"},
          {n:`${successCalls}/${totalCalls}`,l:"Success Rate",icon:"✓",c:"#eab308"},
          {n:totalTokens.toLocaleString(),l:"Tokens Used",icon:"◈",c:"#8b5cf6"},
        ].map(s => (
          <div key={s.l} style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:10,padding:"16px 20px"}}>
            <div style={{...S.flex(8,"center","space-between"),marginBottom:6}}>
              <span style={{fontSize:20}}>{s.icon}</span>
              <span style={{fontSize:10,color:"#6b5c42",letterSpacing:"0.06em"}}>{s.l}</span>
            </div>
            <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:24,color:s.c}}>{s.n}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{...S.flex(4), marginBottom:20, borderBottom:"1px solid #1e1508", paddingBottom:0}}>
        {tabs.map(t => (
          <button key={t.id} style={{
            ...S.btn("ghost"), borderRadius:"6px 6px 0 0",
            borderBottom:"none", marginBottom:-1,
            borderColor: activeTab===t.id ? "#f97316" : "transparent",
            color: activeTab===t.id ? "#f97316" : "#6b5c42",
            background: activeTab===t.id ? "rgba(249,115,22,0.06)" : "transparent"
          }} onClick={()=>setActiveTab(t.id)} className="hov-btn">{t.label}</button>
        ))}
      </div>

      {/* API KEYS */}
      {activeTab==="keys" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.2)",
            borderRadius:8,padding:"10px 16px",fontSize:12,color:"#8a7a62",lineHeight:1.6}}>
            🔐 Keys are stored locally in your browser only. They are never sent to OpenClaw servers.
          </div>
          {models.map(m => {
            const hasKey = !!apiKeys[m.id];
            return (
              <div key={m.id} style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:10,padding:"16px 20px"}}>
                <div style={{...S.flex(12,"flex-start","space-between"), flexWrap:"wrap", gap:12}}>
                  <div style={S.flex(10)}>
                    <div style={{width:36,height:36,background:"rgba(249,115,22,0.08)",border:"1px solid #2a1f0e",
                      borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:16,color:"#f97316"}}>{m.icon}</div>
                    <div>
                      <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#f4e4c4"}}>{m.name}</div>
                      <div style={{fontSize:11,color:"#6b5c42"}}>{m.org} · env: <span style={{color:"#f97316"}}>{m.envKey}</span></div>
                    </div>
                  </div>
                  <div style={{...S.flex(8), flex:1, minWidth:280}}>
                    {hasKey ? (
                      <>
                        <input
                          type={showKey[m.id]?"text":"password"}
                          value={showKey[m.id] ? apiKeys[m.id] : "•".repeat(Math.min(apiKeys[m.id].length, 32))}
                          readOnly
                          style={{...S.input, flex:1, fontSize:12, color:"#22c55e"}} />
                        <button style={{...S.btn("ghost"),fontSize:11}}
                          onClick={()=>setShowKey(p=>({...p,[m.id]:!p[m.id]}))} className="hov-btn">
                          {showKey[m.id]?"Hide":"Show"}
                        </button>
                        <button style={{...S.btn("ghost"),fontSize:11,borderColor:"#ef4444",color:"#ef4444"}}
                          onClick={()=>removeKey(m.id)} className="hov-btn">Remove</button>
                      </>
                    ) : (
                      <>
                        <input
                          type="password"
                          placeholder={`Paste ${m.envKey} here…`}
                          value={editKey[m.id]||""}
                          onChange={e=>setEditKey(p=>({...p,[m.id]:e.target.value}))}
                          onKeyDown={e=>e.key==="Enter"&&saveKey(m.id)}
                          style={{...S.input, flex:1, fontSize:12}} />
                        <button style={S.btn("primary")} onClick={()=>saveKey(m.id)} className="hov-btn">
                          Save Key
                        </button>
                        <a href={m.docsUrl} target="_blank" rel="noreferrer"
                          style={{...S.btn("ghost"),textDecoration:"none",fontSize:11}}>Get Key ↗</a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USAGE ANALYTICS */}
      {activeTab==="usage" && (
        <div>
          {byModel.length === 0 ? (
            <div style={{textAlign:"center",padding:60,color:"#6b5c42"}}>
              <ClawMark size={40} color="#2a1f0e" />
              <div style={{marginTop:12,fontSize:14}}>No usage yet. Start testing models in Playground!</div>
              <button style={{...S.btn("primary"),marginTop:16}} onClick={()=>setPage("playground")} className="hov-btn">
                Go to Playground
              </button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {byModel.map(m => (
                <div key={m.id} style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:10,padding:"16px 20px"}}>
                  <div style={{...S.flex(12,"center","space-between"),marginBottom:12}}>
                    <div style={S.flex(10)}>
                      <span style={{color:"#f97316",fontSize:18}}>{m.icon}</span>
                      <div>
                        <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#f4e4c4"}}>{m.name}</div>
                        <div style={{fontSize:11,color:"#6b5c42"}}>{m.org}</div>
                      </div>
                    </div>
                    <div style={S.flex(20)}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#f97316"}}>{m.calls}</div>
                        <div style={{fontSize:10,color:"#6b5c42"}}>CALLS</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#22c55e"}}>{m.success}</div>
                        <div style={{fontSize:10,color:"#6b5c42"}}>SUCCESS</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#eab308"}}>{m.tokens.toLocaleString()}</div>
                        <div style={{fontSize:10,color:"#6b5c42"}}>TOKENS</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{height:6,background:"#1a1208",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(m.calls/totalCalls)*100}%`,
                        background:"linear-gradient(90deg,#f97316,#fbbf24)",borderRadius:3}} />
                    </div>
                    <div style={{fontSize:10,color:"#6b5c42",marginTop:4}}>
                      {((m.calls/totalCalls)*100).toFixed(0)}% of all calls
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CALL LOGS */}
      {activeTab==="logs" && (
        <div>
          {usageLogs.length === 0 ? (
            <div style={{textAlign:"center",padding:60,color:"#6b5c42"}}>
              <ClawMark size={40} color="#2a1f0e" />
              <div style={{marginTop:12,fontSize:14}}>No logs yet.</div>
            </div>
          ) : (
            <div style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"120px 1fr 80px 80px 100px",
                padding:"10px 16px",background:"#1a1208",borderBottom:"1px solid #2a1f0e",
                fontSize:10,color:"#6b5c42",letterSpacing:"0.06em"}}>
                <div>TIME</div><div>PROMPT</div><div>MODEL</div><div>STATUS</div><div>TOKENS</div>
              </div>
              {usageLogs.slice(0,50).map(log => {
                const m = models.find(x=>x.id===log.modelId);
                return (
                  <div key={log.id} style={{display:"grid",gridTemplateColumns:"120px 1fr 80px 80px 100px",
                    padding:"10px 16px",borderBottom:"1px solid #1a1208",fontSize:12,alignItems:"center"}}>
                    <div style={{color:"#6b5c42",fontSize:10}}>{new Date(log.ts).toLocaleTimeString()}</div>
                    <div style={{color:"#8a7a62",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.prompt}…</div>
                    <div style={{fontSize:11,color:"#f97316"}}>{m?.name?.split(" ")[0]||log.modelId}</div>
                    <div style={{color:log.success?"#22c55e":"#ef4444",fontSize:11}}>{log.success?"✓ ok":"✕ err"}</div>
                    <div style={{color:"#eab308",fontSize:11}}>{log.tokens} tok</div>
                  </div>
                );
              })}
            </div>
          )}
          {usageLogs.length > 0 && (
            <button style={{...S.btn("ghost"),marginTop:12,fontSize:11,borderColor:"#ef4444",color:"#ef4444"}}
              onClick={()=>{
                if(window.confirm("Clear all logs?")) {
                  localStorage.setItem("oc_logs","[]");
                  window.location.reload();
                }
              }} className="hov-btn">✕ Clear All Logs</button>
          )}
        </div>
      )}

      {/* SAVED */}
      {activeTab==="saved" && (
        <div style={S.grid2}>
          {savedModels.length === 0 ? (
            <div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:"#6b5c42"}}>
              <ClawMark size={40} color="#2a1f0e" />
              <div style={{marginTop:12,fontSize:14}}>No saved models yet. Star models in Explore!</div>
              <button style={{...S.btn("primary"),marginTop:16}} onClick={()=>setPage("explore")} className="hov-btn">
                Explore Models
              </button>
            </div>
          ) : (
            models.filter(m=>savedModels.includes(m.id)).map(m => (
              <div key={m.id} style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:10,padding:16}}>
                <div style={S.flex(10)}>
                  <span style={{color:"#f97316",fontSize:20}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#f4e4c4"}}>{m.name}</div>
                    <div style={{fontSize:11,color:"#6b5c42"}}>{m.org} · {m.params}</div>
                  </div>
                  <span style={S.badge(m.type)}>{m.type==="open"?"OPEN":"CLOSED"}</span>
                </div>
                <div style={{color:"#8a7a62",fontSize:12,margin:"10px 0",lineHeight:1.6}}>{m.desc}</div>
                <div style={{...S.flex(6,"center","space-between"),paddingTop:10,borderTop:"1px solid #1e1508"}}>
                  <span style={{fontSize:11,color:"#6b5c42"}}>MMLU: <strong style={{color:"#e8dcc8"}}>{m.mmlu}%</strong> · HE: <strong style={{color:"#e8dcc8"}}>{m.humaneval}%</strong></span>
                  <a href={m.docsUrl} target="_blank" rel="noreferrer" style={{...S.btn("ghost"),fontSize:11,textDecoration:"none"}}>Docs ↗</a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ══ TEST MODAL ════════════════════════════════════════════════
function TestModal({ model:m, apiKeys, logUsage, onClose, onAddKey }) {
  const [prompt, setPrompt] = useState("Say hello and describe yourself in 2 sentences.");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const hasKey = !!apiKeys[m.id];

  const run = async () => {
    if (!prompt.trim() || loading || !hasKey) return;
    setLoading(true); setResponse("");
    try {
      const resp = await m.callFn(apiKeys[m.id], prompt);
      setResponse(resp);
      logUsage(m.id, prompt, true, Math.floor(resp.length/4));
      toastFn?.("Response received!");
    } catch(e) {
      setResponse(`Error: ${e.message}`);
      logUsage(m.id, prompt, false, 0);
      toastFn?.(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:14,
        width:"100%",maxWidth:600,maxHeight:"80vh",overflow:"auto",padding:28}}>
        <div style={{...S.flex(12,"center","space-between"),marginBottom:20}}>
          <div style={S.flex(10)}>
            <div style={{width:40,height:40,background:"rgba(249,115,22,0.08)",border:"1px solid #2a1f0e",
              borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,color:"#f97316"}}>{m.icon}</div>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:16,color:"#f4e4c4"}}>Test {m.name}</div>
              <div style={{fontSize:11,color:"#6b5c42"}}>{m.org} · {m.context}</div>
            </div>
          </div>
          <button style={{background:"none",border:"none",color:"#6b5c42",cursor:"pointer",fontSize:20}}
            onClick={onClose}>✕</button>
        </div>

        {!hasKey ? (
          <div style={{textAlign:"center",padding:32}}>
            <div style={{color:"#f97316",fontSize:14,marginBottom:16}}>⚠ No API key configured</div>
            <button style={S.btn("primary")} onClick={onAddKey} className="hov-btn">+ Add API Key</button>
          </div>
        ) : (
          <>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"#6b5c42",marginBottom:6,letterSpacing:"0.05em"}}>PROMPT</div>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                style={{...S.input,height:80,resize:"vertical"}} />
            </div>
            <button style={{...S.btn("primary"),width:"100%",justifyContent:"center",marginBottom:16}}
              onClick={run} disabled={loading} className="hov-btn">
              {loading ? "⏳ Generating…" : "▶ Run Test"}
            </button>
            {response && (
              <div style={{background:"#0d0a06",border:"1px solid #2a1f0e",borderRadius:8,
                padding:16,fontSize:13,color:"#e8dcc8",lineHeight:1.7,
                fontFamily:"'Courier New',monospace",whiteSpace:"pre-wrap",maxHeight:280,overflow:"auto"}}>
                <div style={{fontSize:10,color:"#6b5c42",marginBottom:8,letterSpacing:"0.06em"}}>RESPONSE</div>
                {response}
              </div>
            )}
          </>
        )}

        {/* API snippet */}
        <div style={{marginTop:16,background:"#0d0a06",border:"1px solid #2a1f0e",borderRadius:8,padding:14}}>
          <div style={{fontSize:10,color:"#6b5c42",marginBottom:6,letterSpacing:"0.06em"}}>QUICK SNIPPET</div>
          <pre style={{fontSize:11,color:"#7c9af4",overflow:"auto",lineHeight:1.6}}>
{`fetch("${m.endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + YOUR_KEY
  },
  body: JSON.stringify({
    model: "${m.model}",
    messages: [{ role: "user", content: "..." }]
  })
})`}
          </pre>
          <button style={{...S.btn("ghost"),marginTop:8,fontSize:10}} onClick={() => {
            navigator.clipboard.writeText(`fetch("${m.endpoint}", {\n  method: "POST",\n  headers: { "Authorization": "Bearer YOUR_KEY" },\n  body: JSON.stringify({ model: "${m.model}", messages: [{role:"user",content:"Hello"}] })\n})`).catch(()=>{});
            toastFn?.("Snippet copied!");
          }} className="hov-btn">Copy Snippet</button>
        </div>
      </div>
    </div>
  );
}

// ══ KEY MODAL ═════════════════════════════════════════════════
function KeyModal({ model:m, apiKeys, setApiKeys, onClose }) {
  const [val, setVal] = useState(apiKeys[m.id]||"");

  const save = () => {
    if (!val.trim()) return;
    setApiKeys(p=>({...p,[m.id]:val.trim()}));
    toastFn?.(`Key saved for ${m.name}`);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#120e08",border:"1px solid #2a1f0e",borderRadius:14,width:"100%",maxWidth:480,padding:28}}>
        <div style={{...S.flex(12,"center","space-between"),marginBottom:20}}>
          <div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:18,color:"#f4e4c4"}}>
            Add API Key — {m.name}
          </div>
          <button style={{background:"none",border:"none",color:"#6b5c42",cursor:"pointer",fontSize:20}} onClick={onClose}>✕</button>
        </div>

        <div style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.2)",
          borderRadius:8,padding:"10px 14px",fontSize:12,color:"#8a7a62",lineHeight:1.6,marginBottom:16}}>
          🔐 Key is stored in <strong style={{color:"#f97316"}}>localStorage</strong> only — never sent to any server.
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"#6b5c42",marginBottom:6}}>Environment variable: <span style={{color:"#f97316"}}>{m.envKey}</span></div>
          <input type="password" value={val} onChange={e=>setVal(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&save()}
            placeholder={`sk-... or your ${m.envKey}`}
            style={S.input} />
        </div>
        <div style={{fontSize:11,color:"#6b5c42",marginBottom:16}}>
          Get your key at: <a href={m.docsUrl} target="_blank" rel="noreferrer"
            style={{color:"#f97316"}}>{m.docsUrl} ↗</a>
        </div>
        <div style={S.flex(8)}>
          <button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={save} className="hov-btn">
            Save & Enable
          </button>
          <button style={{...S.btn("ghost")}} onClick={onClose} className="hov-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}
