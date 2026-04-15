import { useState, useEffect, useRef } from "react";

// ── Brand mark ────────────────────────────────────────────────
const GripMark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="5" height="20" rx="2.5" fill="#e8550a"/>
    <rect x="11" y="3" width="5" height="26" rx="2.5" fill="#f97316"/>
    <rect x="18" y="8" width="5" height="16" rx="2.5" fill="#fbbf24"/>
    <rect x="25" y="11" width="4" height="10" rx="2" fill="#fde68a" opacity="0.6"/>
  </svg>
);

// ── Toast ─────────────────────────────────────────────────────
let toastFn = null;
const Toast = () => {
  const [toasts, setToasts] = useState([]);
  toastFn = (msg, type = "ok") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:6 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:"#18130b", border:`1px solid ${t.type==="err"?"#dc2626":"#4b5563"}`,
          color: t.type==="err" ? "#f87171" : "#d1d5db",
          padding:"9px 14px", borderRadius:7, fontSize:12.5,
          fontFamily:"ui-monospace, monospace", boxShadow:"0 4px 16px rgba(0,0,0,0.6)",
          animation:"toastIn .25s ease"
        }}>{t.type==="err"?"✕  ":"✓  "}{t.msg}</div>
      ))}
    </div>
  );
};

// ── Real model data ───────────────────────────────────────────
const MODELS = [
  { id:"gpt4o", name:"GPT-4o", org:"OpenAI", icon:"⬡", type:"closed",
    tags:["text","vision","code"], free:false, tier:"S",
    desc:"OpenAI's flagship multimodal model. Strong all-rounder for reasoning, vision, and code.",
    params:"~200B (est.)", context:"128K", cost:"$2.50/1M in",
    mmlu:88.7, humaneval:90.2, mtbench:9.1, math500:76.6,
    endpoint:"https://api.openai.com/v1/chat/completions",
    model:"gpt-4o", envKey:"OPENAI_API_KEY", docsUrl:"https://platform.openai.com/docs",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"gpt-4o", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"gpt4omini", name:"GPT-4o Mini", org:"OpenAI", icon:"⬡", type:"closed",
    tags:["text","code"], free:true, tier:"B",
    desc:"Lightweight and cheap. Great for high-volume simple tasks. Free tier available.",
    params:"~8B (est.)", context:"128K", cost:"$0.15/1M in",
    mmlu:82.0, humaneval:87.2, mtbench:8.2, math500:70.2,
    endpoint:"https://api.openai.com/v1/chat/completions",
    model:"gpt-4o-mini", envKey:"OPENAI_API_KEY", docsUrl:"https://platform.openai.com/docs",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"claude_opus", name:"Claude Opus 4.6", org:"Anthropic", icon:"◈", type:"closed",
    tags:["text","vision","code","reasoning"], free:false, tier:"S",
    desc:"Anthropic's most intelligent model. Best for complex agents, deep reasoning, and hard coding tasks. 1M token context.",
    params:"Unknown", context:"1M", cost:"$5/1M in · $25/1M out",
    mmlu:89.5, humaneval:93.0, mtbench:9.3, math500:85.0,
    endpoint:"https://api.anthropic.com/v1/messages",
    model:"claude-opus-4-6", envKey:"ANTHROPIC_API_KEY", docsUrl:"https://docs.anthropic.com",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({ model:"claude-opus-4-6", max_tokens:512, messages:[{role:"user",content:msg}] })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.content[0].text;
    }
  },
  { id:"claude_sonnet", name:"Claude Sonnet 4.6", org:"Anthropic", icon:"◈", type:"closed",
    tags:["text","vision","code"], free:true, tier:"S",
    desc:"Best balance of speed and intelligence. Preferred by 70% of devs over previous Opus. 1M context. Recommended default.",
    params:"Unknown", context:"1M", cost:"$3/1M in · $15/1M out",
    mmlu:88.3, humaneval:92.0, mtbench:9.0, math500:78.2,
    endpoint:"https://api.anthropic.com/v1/messages",
    model:"claude-sonnet-4-6", envKey:"ANTHROPIC_API_KEY", docsUrl:"https://docs.anthropic.com",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:512, messages:[{role:"user",content:msg}] })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.content[0].text;
    }
  },
  { id:"claude_haiku", name:"Claude Haiku 4.5", org:"Anthropic", icon:"◈", type:"closed",
    tags:["text","vision","code"], free:true, tier:"B",
    desc:"Fastest Claude model. Near-frontier quality at $1/1M tokens. Ideal for high-volume tasks, agents, and sub-agents.",
    params:"Unknown", context:"200K", cost:"$1/1M in · $5/1M out",
    mmlu:79.0, humaneval:80.0, mtbench:8.2, math500:65.0,
    endpoint:"https://api.anthropic.com/v1/messages",
    model:"claude-haiku-4-5-20251001", envKey:"ANTHROPIC_API_KEY", docsUrl:"https://docs.anthropic.com",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:512, messages:[{role:"user",content:msg}] })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.content[0].text;
    }
  },
  { id:"gemini15pro", name:"Gemini 1.5 Pro", org:"Google", icon:"◇", type:"closed",
    tags:["text","vision","code"], free:true, tier:"A",
    desc:"Industry-leading 1M token context. Strong at long documents and multimodal tasks.",
    params:"~340B (est.)", context:"1M", cost:"$3.50/1M in",
    mmlu:85.9, humaneval:84.1, mtbench:8.9, math500:67.7,
    endpoint:"https://generativelanguage.googleapis.com/v1beta/models",
    model:"gemini-1.5-pro", envKey:"GOOGLE_API_KEY", docsUrl:"https://ai.google.dev/docs",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:msg}]}] })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.candidates[0].content.parts[0].text;
    }
  },
  { id:"mistral_large", name:"Mistral Large 2", org:"Mistral AI", icon:"◬", type:"closed",
    tags:["text","code"], free:false, tier:"A",
    desc:"Mistral's flagship closed model. Excellent multilingual and instruction following.",
    params:"~123B (est.)", context:"128K", cost:"$2/1M in",
    mmlu:84.0, humaneval:92.1, mtbench:8.7, math500:73.0,
    endpoint:"https://api.mistral.ai/v1/chat/completions",
    model:"mistral-large-latest", envKey:"MISTRAL_API_KEY", docsUrl:"https://docs.mistral.ai",
    ollamaId:null, ramQ4gb:null, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"mistral-large-latest", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"deepseek_v3", name:"DeepSeek V3", org:"DeepSeek", icon:"◉", type:"open",
    tags:["text","code"], free:true, tier:"S",
    desc:"671B MoE. Near-GPT-4 quality at a fraction of the cost. Outstanding for coding.",
    params:"671B MoE (37B active)", context:"64K", cost:"$0.27/1M in (API)",
    mmlu:88.5, humaneval:89.9, mtbench:9.0, math500:90.2,
    endpoint:"https://api.deepseek.com/v1/chat/completions",
    model:"deepseek-chat", envKey:"DEEPSEEK_API_KEY", docsUrl:"https://platform.deepseek.com/docs",
    ollamaId:"deepseek-v3", ramQ4gb:400, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"deepseek-chat", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"deepseek_r1", name:"DeepSeek R1", org:"DeepSeek", icon:"◉", type:"open",
    tags:["text","code","reasoning"], free:true, tier:"S",
    desc:"Chain-of-thought reasoning model. Best open-source option for math and logic.",
    params:"671B MoE", context:"128K", cost:"$0.55/1M in (API)",
    mmlu:90.8, humaneval:90.2, mtbench:8.9, math500:97.3,
    endpoint:"https://api.deepseek.com/v1/chat/completions",
    model:"deepseek-reasoner", envKey:"DEEPSEEK_API_KEY", docsUrl:"https://platform.deepseek.com/docs",
    ollamaId:"deepseek-r1:32b", ramQ4gb:20, vramQ4gb:20, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"deepseek-reasoner", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"llama33_70b", name:"Llama 3.3 70B", org:"Meta AI", icon:"⬟", type:"open",
    tags:["text","code"], free:true, tier:"A",
    desc:"Best overall local model in 2026. Matches GPT-4 (2023) on MMLU. Needs ~40GB RAM at Q4.",
    params:"70B", context:"128K", cost:"Free (self-host)",
    mmlu:82.0, humaneval:88.0, mtbench:8.7, math500:77.0,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"meta-llama/Llama-3.3-70B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/llama3.3",
    ollamaId:"llama3.3:70b", ramQ4gb:40, vramQ4gb:40, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"meta-llama/Llama-3.3-70B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"llama32_8b", name:"Llama 3.2 8B", org:"Meta AI", icon:"⬟", type:"open",
    tags:["text","code"], free:true, tier:"B",
    desc:"Runs on almost any modern PC with 8GB RAM. Best entry-level local model.",
    params:"8B", context:"128K", cost:"Free (self-host)",
    mmlu:73.0, humaneval:72.6, mtbench:7.8, math500:58.0,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"meta-llama/Llama-3.2-8B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/llama3.2",
    ollamaId:"llama3.2:8b", ramQ4gb:5, vramQ4gb:5, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"meta-llama/Llama-3.2-8B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"llama32_3b", name:"Llama 3.2 3B", org:"Meta AI", icon:"⬟", type:"open",
    tags:["text"], free:true, tier:"C",
    desc:"Tiny but usable. 2GB RAM. Good for offline Q&A and note-taking on old hardware.",
    params:"3B", context:"128K", cost:"Free (self-host)",
    mmlu:63.0, humaneval:55.0, mtbench:7.0, math500:44.0,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"meta-llama/Llama-3.2-3B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/llama3.2",
    ollamaId:"llama3.2:3b", ramQ4gb:2.0, vramQ4gb:2.0, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"meta-llama/Llama-3.2-3B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"qwen25_72b", name:"Qwen 2.5 72B", org:"Alibaba", icon:"◈", type:"open",
    tags:["text","code"], free:true, tier:"A",
    desc:"Best local coding model. 87% HumanEval. Supports 29 languages. Needs ~40GB RAM.",
    params:"72B", context:"128K", cost:"Free (self-host)",
    mmlu:86.1, humaneval:87.2, mtbench:8.8, math500:83.1,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"Qwen/Qwen2.5-72B-Instruct-Turbo", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/qwen2.5",
    ollamaId:"qwen2.5:72b", ramQ4gb:40, vramQ4gb:40, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"Qwen/Qwen2.5-72B-Instruct-Turbo", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"qwen3_235b", name:"Qwen 3 235B", org:"Alibaba", icon:"◈", type:"open",
    tags:["text","code","reasoning"], free:true, tier:"S",
    desc:"235B MoE. Chatbot Arena 1422. Exceptional reasoning — too large for consumer hardware.",
    params:"235B MoE", context:"32K", cost:"Free (self-host)",
    mmlu:89.5, humaneval:91.0, mtbench:9.1, math500:92.3,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"Qwen/Qwen3-235B-A22B", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/qwen3",
    ollamaId:"qwen3:235b", ramQ4gb:140, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"Qwen/Qwen3-235B-A22B", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"mistral_small", name:"Mistral Small 3.1", org:"Mistral AI", icon:"◬", type:"open",
    tags:["text","code"], free:true, tier:"B",
    desc:"24B. Best step-up from 7B models. Fits in 16GB RAM, 128K context.",
    params:"24B", context:"128K", cost:"Free (self-host)",
    mmlu:79.0, humaneval:74.0, mtbench:8.3, math500:65.0,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"mistralai/Mistral-Small-Instruct-2409", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/mistral-small3.1",
    ollamaId:"mistral-small3.1", ramQ4gb:14, vramQ4gb:14, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"mistralai/Mistral-Small-Instruct-2409", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"gemma3_9b", name:"Gemma 3 9B", org:"Google", icon:"◇", type:"open",
    tags:["text","vision","code"], free:true, tier:"B",
    desc:"Best quality-per-GB at 9B class. Runs on 8GB RAM. Has a vision-capable multimodal variant.",
    params:"9B", context:"128K", cost:"Free (self-host)",
    mmlu:73.0, humaneval:68.0, mtbench:7.9, math500:59.6,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"google/gemma-3-9b-it", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/gemma3",
    ollamaId:"gemma3:9b", ramQ4gb:6, vramQ4gb:6, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"google/gemma-3-9b-it", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"phi4mini", name:"Phi-4 Mini", org:"Microsoft", icon:"◻", type:"open",
    tags:["text","code"], free:true, tier:"B",
    desc:"3.8B. Best model under 4GB RAM. 68% MMLU — punches above its size. 30–50 tok/s on CPU.",
    params:"3.8B", context:"16K", cost:"Free (self-host)",
    mmlu:68.0, humaneval:72.0, mtbench:7.5, math500:59.2,
    endpoint:"https://api.together.xyz/v1/chat/completions",
    model:"microsoft/phi-4", envKey:"TOGETHER_API_KEY",
    docsUrl:"https://ollama.com/library/phi4-mini",
    ollamaId:"phi4-mini", ramQ4gb:2.5, vramQ4gb:2.5, localFeasible:true,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"microsoft/phi-4", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
  { id:"kimi_k2", name:"Kimi K2.5", org:"Moonshot AI", icon:"◑", type:"open",
    tags:["text","code","reasoning"], free:true, tier:"S",
    desc:"Highest HumanEval tracked: 99.0. Leads MMLU at 92.0. 1T params, 32B active per token.",
    params:"1T MoE (32B active)", context:"262K", cost:"Free (self-host)",
    mmlu:92.0, humaneval:99.0, mtbench:9.2, math500:98.0,
    endpoint:"https://api.moonshot.cn/v1/chat/completions",
    model:"kimi-k2", envKey:"MOONSHOT_API_KEY",
    docsUrl:"https://platform.moonshot.cn/docs",
    ollamaId:null, ramQ4gb:600, vramQ4gb:null, localFeasible:false,
    callFn: async (key, msg) => {
      const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({ model:"kimi-k2", messages:[{role:"user",content:msg}], max_tokens:512 })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message||"API error");
      return d.choices[0].message.content;
    }
  },
];

// ── Colors + shared styles ────────────────────────────────────
const C = {
  bg:"#0f0d0a", surface:"#161209", surface2:"#1c1710",
  border:"#2c2318", borderH:"#5c3d1e",
  text:"#e2d5c3", muted:"#7a6a55", faint:"#3a2f22",
  orange:"#f97316", orangeL:"#fb923c", orangeDim:"rgba(249,115,22,0.12)",
  green:"#22c55e", yellow:"#eab308", red:"#ef4444", purple:"#a78bfa",
};
const fl = (gap=12,a="center",j="flex-start") => ({display:"flex",alignItems:a,justifyContent:j,gap});
const btn = (v="fill") => ({
  background:v==="fill"?C.orange:v==="dim"?C.orangeDim:"transparent",
  color:v==="fill"?"#111":v==="dim"?C.orange:C.muted,
  border:v==="line"?`1px solid ${C.border}`:v==="dim"?`1px solid rgba(249,115,22,0.25)`:"none",
  padding:"7px 14px", borderRadius:7, cursor:"pointer",
  fontFamily:"inherit", fontWeight:v==="fill"?700:500,
  fontSize:13, transition:"all 0.15s",
  display:"inline-flex", alignItems:"center", gap:6
});
const card = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, transition:"all 0.15s" };
const inp = { background:C.surface2, border:`1px solid ${C.border}`, color:C.text,
  padding:"9px 12px", borderRadius:7, fontFamily:"ui-monospace,monospace",
  fontSize:13, outline:"none", transition:"border 0.15s", width:"100%" };
const badge = (t) => {
  const m={S:{bg:"rgba(251,191,36,0.12)",c:"#fbbf24",b:"rgba(251,191,36,0.3)"},A:{bg:"rgba(249,115,22,0.12)",c:"#f97316",b:"rgba(249,115,22,0.3)"},B:{bg:"rgba(34,197,94,0.1)",c:"#22c55e",b:"rgba(34,197,94,0.25)"},C:{bg:"rgba(107,114,128,0.1)",c:"#9ca3af",b:"rgba(107,114,128,0.25)"},open:{bg:"rgba(34,197,94,0.08)",c:"#22c55e",b:"rgba(34,197,94,0.2)"},closed:{bg:"rgba(167,139,250,0.08)",c:"#a78bfa",b:"rgba(167,139,250,0.2)"},free:{bg:"rgba(234,179,8,0.08)",c:"#eab308",b:"rgba(234,179,8,0.2)"}};
  const x=m[t]||m.C;
  return {background:x.bg,color:x.c,border:`1px solid ${x.b}`,padding:"2px 7px",borderRadius:4,fontSize:10.5,fontWeight:600,letterSpacing:"0.04em"};
};
const main = { maxWidth:1200, margin:"0 auto", padding:"28px 24px" };
const grid2 = { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 };

export default function App() {
  const [page, setPage] = useState("explore");
  const [apiKeys, setApiKeys] = useState(() => { try{return JSON.parse(localStorage.getItem("grip_keys")||"{}");}catch{return {};} });
  const [logs, setLogs] = useState(() => { try{return JSON.parse(localStorage.getItem("grip_logs")||"[]");}catch{return [];} });
  const [saved, setSaved] = useState(() => { try{return JSON.parse(localStorage.getItem("grip_saved")||"[]");}catch{return [];} });
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");
  const [compareList, setCompareList] = useState([]);
  const [testModal, setTestModal] = useState(null);
  const [keyModal, setKeyModal] = useState(null);

  useEffect(()=>{ localStorage.setItem("grip_keys",JSON.stringify(apiKeys)); },[apiKeys]);
  useEffect(()=>{ localStorage.setItem("grip_logs",JSON.stringify(logs)); },[logs]);
  useEffect(()=>{ localStorage.setItem("grip_saved",JSON.stringify(saved)); },[saved]);

  const addLog = (modelId,prompt,ok,tokens) =>
    setLogs(p=>[{id:Date.now(),modelId,prompt:prompt.slice(0,60),ok,tokens,ts:new Date().toISOString()},...p].slice(0,200));

  const filtered = MODELS.filter(m => {
    if (filterType==="open"&&m.type!=="open") return false;
    if (filterType==="closed"&&m.type!=="closed") return false;
    if (filterType==="saved"&&!saved.includes(m.id)) return false;
    if (filterTag!=="all"&&!m.tags.includes(filterTag)) return false;
    if (search){const q=search.toLowerCase();if(!m.name.toLowerCase().includes(q)&&!m.org.toLowerCase().includes(q)&&!m.tags.some(t=>t.includes(q)))return false;}
    return true;
  });

  const nav = [
    {id:"explore",l:"Models"},
    {id:"leaderboard",l:"Leaderboard"},
    {id:"playground",l:"Playground"},
    {id:"compare",l:compareList.length>0?`Compare (${compareList.length})`:"Compare"},
    {id:"hardware",l:"Can I Run It?"},
    {id:"claude_skills",l:"Claude Skills"},
    {id:"dashboard",l:"Dashboard"},
  ];

  return (
    <div style={{background:C.bg,color:C.text,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.faint};border-radius:3px;}
        input:focus,textarea:focus{border-color:${C.orange}!important;}
        @keyframes toastIn{from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .fade{animation:fadeUp 0.3s ease;}
        .hov:hover{opacity:0.8;}
        .ch:hover{border-color:${C.borderH}!important;transform:translateY(-1px);}
      `}</style>
      <Toast />

      <nav style={{position:"sticky",top:0,zIndex:200,height:54,background:"rgba(15,13,10,0.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 26px"}}>
        <div style={{...fl(8),cursor:"pointer"}} onClick={()=>setPage("explore")}>
          <GripMark size={22}/>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:"-0.3px"}}>Gr<span style={{color:C.orange}}>(I)</span>p</span>
        </div>
        <div style={fl(2)}>
          {nav.map(n=>(
            <button key={n.id} style={{background:page===n.id?C.orangeDim:"transparent",border:page===n.id?`1px solid rgba(249,115,22,0.25)`:"1px solid transparent",color:page===n.id?C.orange:C.muted,padding:"5px 11px",borderRadius:6,cursor:"pointer",fontSize:12.5,fontFamily:"inherit",transition:"all 0.12s"}} onClick={()=>setPage(n.id)} className="hov">{n.l}</button>
          ))}
        </div>
        <button style={btn("fill")} className="hov" onClick={()=>setPage("dashboard")}>⚙ Keys</button>
      </nav>

      <div style={{position:"relative",zIndex:1}}>
        {page==="explore"&&<ExplorePage filtered={filtered} apiKeys={apiKeys} filterType={filterType} setFilterType={setFilterType} filterTag={filterTag} setFilterTag={setFilterTag} search={search} setSearch={setSearch} saved={saved} setSaved={setSaved} compareList={compareList} setCompareList={setCompareList} setTestModal={setTestModal} setKeyModal={setKeyModal} setPage={setPage}/>}
        {page==="leaderboard"&&<LeaderboardPage models={MODELS} apiKeys={apiKeys} setTestModal={setTestModal}/>}
        {page==="playground"&&<PlaygroundPage models={MODELS} apiKeys={apiKeys} addLog={addLog}/>}
        {page==="compare"&&<ComparePage compareList={compareList} models={MODELS} setCompareList={setCompareList}/>}
        {page==="hardware"&&<HardwarePage models={MODELS}/>}
        {page==="claude_skills"&&<ClaudeSkillsPage apiKeys={apiKeys} addLog={addLog}/>}
        {page==="dashboard"&&<DashboardPage apiKeys={apiKeys} setApiKeys={setApiKeys} logs={logs} setLogs={setLogs} saved={saved} models={MODELS} setPage={setPage}/>}
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 26px",marginTop:48,display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1}}>
        <div style={fl(8)}>
          <GripMark size={16}/>
          <span style={{fontSize:12.5,color:C.muted}}>Gr<span style={{color:C.orange}}>(I)</span>p &nbsp;·&nbsp; by <strong style={{color:C.orangeL}}>projectAdnan</strong></span>
        </div>
        <span style={{fontSize:11,color:C.faint}}>Benchmarks from public evaluations · Keys stay local</span>
      </div>

      {testModal&&<TestModal model={testModal} apiKeys={apiKeys} addLog={addLog} onClose={()=>setTestModal(null)} onKey={()=>{setKeyModal(testModal);setTestModal(null);}}/>}
      {keyModal&&<KeyModal model={keyModal} apiKeys={apiKeys} setApiKeys={setApiKeys} onClose={()=>setKeyModal(null)}/>}
    </div>
  );
}

function ExplorePage({filtered,apiKeys,filterType,setFilterType,filterTag,setFilterTag,search,setSearch,saved,setSaved,compareList,setCompareList,setTestModal,setKeyModal,setPage}) {
  return (
    <div style={main} className="fade">
      <div style={{padding:"34px 0 26px",borderBottom:`1px solid ${C.border}`,marginBottom:22}}>
        <div style={{fontSize:30,fontWeight:700,letterSpacing:"-0.7px",color:C.text,marginBottom:8,lineHeight:1.2}}>
          Every AI model,<br/><span style={{color:C.orange}}>one place.</span>
        </div>
        <div style={{color:C.muted,fontSize:14,maxWidth:460}}>Browse open and closed models, real benchmarks, API snippets, live testing. No fluff.</div>
        <div style={{...fl(12),marginTop:18,flexWrap:"wrap"}}>
          {[{n:MODELS.length,l:"models"},{n:MODELS.filter(m=>m.type==="open").length,l:"open source"},{n:MODELS.filter(m=>m.type==="closed").length,l:"closed"},{n:"4",l:"benchmarks"}].map(s=>(
            <div key={s.l} style={{...card,padding:"10px 16px",minWidth:80}}>
              <div style={{fontSize:19,fontWeight:700,color:C.orange}}>{s.n}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div>
            </div>
          ))}
          {compareList.length>0&&<button style={{...btn("dim"),marginLeft:"auto"}} onClick={()=>setPage("compare")} className="hov">⊞ Compare ({compareList.length})</button>}
        </div>
      </div>

      <div style={{...fl(8),marginBottom:14,flexWrap:"wrap",gap:7}}>
        <div style={{position:"relative",flex:1,minWidth:180,maxWidth:320}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13}}>⌕</span>
          <input style={{...inp,paddingLeft:28}} placeholder="Search models…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={fl(5,undefined,undefined,{flexWrap:"wrap"})}>
          {[["all","All"],["open","Open"],["closed","Closed"],["saved","Saved"]].map(([v,l])=>(
            <button key={v} style={{...btn(filterType===v?"dim":"line"),fontSize:12}} onClick={()=>setFilterType(v)} className="hov">{l}</button>
          ))}
          <div style={{width:1,height:18,background:C.border}}/>
          {["all","text","code","vision","reasoning"].map(t=>(
            <button key={t} style={{...btn(filterTag===t?"dim":"line"),fontSize:11,padding:"5px 9px"}} onClick={()=>setFilterTag(t)} className="hov">{t}</button>
          ))}
        </div>
        <span style={{color:C.muted,fontSize:11.5,alignSelf:"center"}}>{filtered.length} shown</span>
      </div>

      <div style={grid2}>
        {filtered.map(m=>(
          <ModelCard key={m.id} model={m} apiKeys={apiKeys}
            saved={saved.includes(m.id)} onSave={()=>setSaved(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])}
            comparing={compareList.includes(m.id)} onCompare={()=>setCompareList(p=>p.includes(m.id)?p.filter(x=>x!==m.id):p.length<3?[...p,m.id]:p)}
            onTest={()=>setTestModal(m)} onKey={()=>setKeyModal(m)}/>
        ))}
        {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:56,color:C.muted}}><div style={{fontSize:28,marginBottom:10}}>◫</div><div>No models match.</div></div>}
      </div>
    </div>
  );
}

function ModelCard({model:m,apiKeys,saved,onSave,comparing,onCompare,onTest,onKey}) {
  const [hov,setHov]=useState(false);
  const hasKey=!!apiKeys[m.id];
  return (
    <div className="ch" style={{...card,padding:19,borderColor:comparing?"rgba(249,115,22,0.5)":hov?C.borderH:C.border,boxShadow:hov?"0 4px 20px rgba(0,0,0,0.3)":"none"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{...fl(0,"flex-start","space-between"),marginBottom:13}}>
        <div style={fl(9)}>
          <div style={{width:36,height:36,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.orange,flexShrink:0}}>{m.icon}</div>
          <div>
            <div style={{fontWeight:700,fontSize:14.5,color:C.text}}>{m.name}</div>
            <div style={{fontSize:11.5,color:C.muted}}>{m.org}</div>
          </div>
        </div>
        <div style={fl(6)}>
          <button style={{background:"none",border:"none",cursor:"pointer",color:saved?C.orange:C.faint,fontSize:17,padding:3}} onClick={onSave}>{saved?"★":"☆"}</button>
          <button style={{...btn(comparing?"dim":"line"),padding:"3px 7px",fontSize:11}} onClick={onCompare}>{comparing?"⊟":"⊞"}</button>
        </div>
      </div>

      <div style={{...fl(5),flexWrap:"wrap",marginBottom:11}}>
        <span style={badge(m.tier)}>{m.tier}-tier</span>
        <span style={badge(m.type)}>{m.type==="open"?"open src":"closed"}</span>
        {m.free&&<span style={badge("free")}>free tier</span>}
        {m.tags.map(t=><span key={t} style={{background:C.surface2,border:`1px solid ${C.border}`,color:C.muted,padding:"2px 6px",borderRadius:4,fontSize:10.5}}>{t}</span>)}
      </div>

      <div style={{color:C.muted,fontSize:12.5,lineHeight:1.65,marginBottom:13}}>{m.desc}</div>

      <div style={{marginBottom:13}}>
        {[["MMLU",m.mmlu],["HumanEval",m.humaneval]].map(([l,v])=>(
          <div key={l} style={{marginBottom:6}}>
            <div style={{...fl(0,"center","space-between"),marginBottom:3}}>
              <span style={{fontSize:11,color:C.muted}}>{l}</span>
              <span style={{fontSize:11.5,color:C.text,fontWeight:600}}>{v}%</span>
            </div>
            <div style={{height:3,background:C.faint,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${C.orange},#fbbf24)`,borderRadius:2}}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",marginBottom:13,fontFamily:"ui-monospace,monospace",fontSize:11}}>
        <span style={{color:"#7c9af4"}}>model</span><span style={{color:C.muted}}>: </span><span style={{color:"#f87171"}}>"{m.model}"</span><br/>
        <span style={{color:"#7c9af4"}}>endpoint</span><span style={{color:C.muted}}>: </span><span style={{color:"#86efac"}}>{m.endpoint.replace("https://","").slice(0,35)}…</span>
      </div>

      <div style={{...fl(0,"center","space-between"),paddingTop:11,borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:11.5,color:C.muted}}><span style={{color:C.text}}>{m.params}</span> · <span style={{color:C.text}}>{m.context}</span></div>
        <div style={fl(6)}>
          {hasKey?<button style={btn("fill")} onClick={onTest} className="hov">▶ Test</button>:<button style={btn("dim")} onClick={onKey} className="hov">+ Key</button>}
          <a href={m.docsUrl} target="_blank" rel="noreferrer" style={{...btn("line"),textDecoration:"none",fontSize:12}}>Docs ↗</a>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage({models,apiKeys,setTestModal}) {
  const [sort,setSort]=useState("overall");
  const scored=[...models].map(m=>({...m,overall:((m.mmlu+m.humaneval+m.mtbench*10+m.math500)/4).toFixed(1)})).sort((a,b)=>sort==="mmlu"?b.mmlu-a.mmlu:sort==="he"?b.humaneval-a.humaneval:sort==="math"?b.math500-a.math500:parseFloat(b.overall)-parseFloat(a.overall));
  return (
    <div style={main} className="fade">
      <div style={{marginBottom:22}}>
        <div style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:3}}>Performance Leaderboard</div>
        <div style={{color:C.muted,fontSize:13}}>Scores sourced from public 2026 evaluations — MMLU, HumanEval, MATH-500, MT-Bench.</div>
      </div>
      <div style={{...fl(6),marginBottom:18}}>
        {[["overall","Overall"],["mmlu","MMLU"],["he","HumanEval"],["math","MATH-500"]].map(([v,l])=>(
          <button key={v} style={{...btn(sort===v?"dim":"line"),fontSize:12}} onClick={()=>setSort(v)} className="hov">{l}</button>
        ))}
      </div>
      <div style={{...card,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"42px 1fr 88px 88px 88px 88px 100px",padding:"9px 16px",background:C.surface2,borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,letterSpacing:"0.05em"}}>
          <div>#</div><div>MODEL</div><div>MMLU</div><div>HUMANEVAL</div><div>MATH-500</div><div>MT-BENCH</div><div style={{textAlign:"right"}}>OVERALL</div>
        </div>
        {scored.map((m,i)=>{
          const rc=i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#cd7f32":C.muted;
          return (
            <div key={m.id} style={{display:"grid",gridTemplateColumns:"42px 1fr 88px 88px 88px 88px 100px",padding:"12px 16px",borderBottom:`1px solid ${C.faint}`,alignItems:"center",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontWeight:700,fontSize:15,color:rc}}>{i+1}</div>
              <div style={fl(8)}>
                <span style={{color:C.orange,fontSize:16}}>{m.icon}</span>
                <div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.org}</div></div>
                <span style={badge(m.tier)}>{m.tier}</span>
                <span style={badge(m.type)}>{m.type==="open"?"open":"closed"}</span>
              </div>
              {[m.mmlu,m.humaneval,m.math500,m.mtbench].map((v,idx)=>(
                <div key={idx}><div style={{fontSize:13,color:C.text,fontWeight:600}}>{v}</div><div style={{height:2,background:C.faint,borderRadius:1,marginTop:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(v,100)}%`,background:C.orange,borderRadius:1}}/></div></div>
              ))}
              <div style={{textAlign:"right"}}>
                <span style={{fontWeight:700,fontSize:15,color:i===0?C.orange:C.text}}>{m.overall}</span>
                {!!apiKeys[m.id]&&<button style={{...btn("dim"),fontSize:10,padding:"2px 7px",marginLeft:6}} onClick={()=>setTestModal(m)} className="hov">Test</button>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9,marginTop:18}}>
        {[{n:"MMLU",d:"57-subject knowledge test. Broad general intelligence.",s:"Hendrycks et al., 2020"},{n:"HumanEval",d:"164 Python coding problems from docstrings.",s:"Chen et al., OpenAI"},{n:"MATH-500",d:"500 competition math problems. Measures reasoning.",s:"Hendrycks et al."},{n:"MT-Bench",d:"Multi-turn chat quality judged by GPT-4. 0–10.",s:"LMSYS, 2023"}].map(b=>(
          <div key={b.n} style={{...card,padding:13}}><div style={{fontWeight:700,color:C.orange,marginBottom:4,fontSize:13}}>{b.n}</div><div style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{b.d}</div><div style={{color:C.faint,fontSize:10.5,marginTop:5}}>Source: {b.s}</div></div>
        ))}
      </div>
    </div>
  );
}

function PlaygroundPage({models,apiKeys,addLog}) {
  const [selId,setSelId]=useState("claude");
  const [prompt,setPrompt]=useState("");
  const [sys,setSys]=useState("You are a helpful assistant.");
  const [msgs,setMsgs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [cfg,setCfg]=useState(false);
  const endRef=useRef(null);
  const model=models.find(m=>m.id===selId);
  const hasKey=!!apiKeys[selId];
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);

  const send=async()=>{
    if(!prompt.trim()||loading||!hasKey)return;
    const txt=prompt.trim();setPrompt("");
    setMsgs(p=>[...p,{role:"user",content:txt}]);setLoading(true);
    try{
      const resp=await model.callFn(apiKeys[selId],txt);
      setMsgs(p=>[...p,{role:"assistant",content:resp,mid:selId}]);
      addLog(selId,txt,true,Math.floor(resp.length/4));toastFn?.(`${model.name} responded`);
    }catch(e){setMsgs(p=>[...p,{role:"err",content:`Error: ${e.message}`}]);addLog(selId,txt,false,0);toastFn?.(e.message,"err");}
    setLoading(false);
  };

  return (
    <div style={{...main,display:"grid",gridTemplateColumns:"230px 1fr",gap:14,height:"calc(100vh - 100px)"}} className="fade">
      <div style={{display:"flex",flexDirection:"column",gap:9,overflow:"auto"}}>
        <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:3}}>Playground</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:4}}>SELECT MODEL</div>
        {models.map(m=>{const hk=!!apiKeys[m.id];return(
          <div key={m.id} style={{...card,padding:"9px 11px",cursor:"pointer",borderColor:selId===m.id?C.orange:C.border,background:selId===m.id?C.orangeDim:C.surface}} onClick={()=>setSelId(m.id)}>
            <div style={fl(7)}><span style={{color:C.orange}}>{m.icon}</span><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12.5,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div><div style={{fontSize:10.5,color:C.muted}}>{m.org}</div></div><span style={{color:hk?C.green:C.faint,fontSize:11}}>{hk?"●":"○"}</span></div>
          </div>
        );})}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:9,marginTop:3}}>
          <button style={{...btn("line"),width:"100%",justifyContent:"center",fontSize:11.5}} onClick={()=>setCfg(!cfg)} className="hov">{cfg?"▲ Hide config":"▼ Config"}</button>
          {cfg&&<div style={{marginTop:9}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>SYSTEM PROMPT</div><textarea value={sys} onChange={e=>setSys(e.target.value)} style={{...inp,height:68,resize:"vertical",fontSize:11}}/></div>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",...card,overflow:"hidden"}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,...fl(0,"center","space-between")}}>
          <div style={fl(8)}><span style={{color:C.orange,fontSize:18}}>{model.icon}</span><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{model.name}</div><div style={{fontSize:11,color:C.muted}}>{model.context} context</div></div></div>
          <div style={fl(7)}>{!hasKey&&<span style={{fontSize:11,color:C.orange,border:"1px solid rgba(249,115,22,0.3)",padding:"2px 8px",borderRadius:4}}>⚠ No key</span>}<button style={btn("line")} onClick={()=>setMsgs([])} className="hov">↺ Clear</button></div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:13}}>
          {msgs.length===0&&<div style={{textAlign:"center",padding:44,color:C.muted}}><div style={{fontSize:26,marginBottom:9}}>◈</div><div style={{fontSize:13}}>Send a message to {model.name}</div>{!hasKey&&<div style={{fontSize:12,color:C.orange,marginTop:5}}>Add an API key in Dashboard first</div>}</div>}
          {msgs.map((msg,i)=>(
            <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"78%",background:msg.role==="user"?C.orangeDim:msg.role==="err"?"rgba(239,68,68,0.08)":C.surface2,border:`1px solid ${msg.role==="user"?"rgba(249,115,22,0.25)":msg.role==="err"?"rgba(239,68,68,0.25)":C.border}`,borderRadius:msg.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",padding:"10px 13px",fontSize:13,lineHeight:1.7,color:msg.role==="err"?C.red:C.text,whiteSpace:"pre-wrap"}}>
                {msg.role==="assistant"&&<div style={{fontSize:10.5,color:C.muted,marginBottom:4}}>{models.find(x=>x.id===msg.mid)?.name}</div>}
                {msg.content}
              </div>
            </div>
          ))}
          {loading&&<div style={{...fl(5),color:C.orange,fontSize:12}}><span>●</span><span>●</span><span>●</span><span style={{marginLeft:5,color:C.muted}}>Generating…</span></div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:"11px 16px",borderTop:`1px solid ${C.border}`,...fl(7)}}>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={hasKey?`Message ${model.name}…`:"Add API key to start"} disabled={!hasKey||loading} style={{...inp,height:44,resize:"none",flex:1,fontSize:13}}/>
          <button style={{...btn("fill"),height:44,padding:"0 16px"}} onClick={send} disabled={!hasKey||loading||!prompt.trim()} className="hov">↑</button>
        </div>
      </div>
    </div>
  );
}

function ComparePage({compareList,models,setCompareList}) {
  const compared=compareList.map(id=>models.find(m=>m.id===id)).filter(Boolean);
  if(compareList.length===0)return(<div style={{...main,textAlign:"center",padding:"68px 0"}} className="fade"><div style={{fontSize:28,marginBottom:10,color:C.faint}}>⊞</div><div style={{color:C.muted,fontSize:14}}>No models selected. Click ⊞ on up to 3 cards in Explore.</div></div>);
  const metrics=[{l:"Parameters",k:"params"},{l:"Context",k:"context"},{l:"Cost",k:"cost"},{l:"MMLU (%)",k:"mmlu"},{l:"HumanEval (%)",k:"humaneval"},{l:"MATH-500 (%)",k:"math500"},{l:"MT-Bench (/10)",k:"mtbench"},{l:"Tier",k:"tier"},{l:"Type",fn:m=>m.type},{l:"Free Tier",fn:m=>m.free?"Yes":"No"},{l:"Local (Ollama)?",fn:m=>m.ollamaId?"Yes — "+m.ollamaId:"No"},{l:"Vision",fn:m=>m.tags.includes("vision")?"Yes":"No"}];
  return (
    <div style={main} className="fade">
      <div style={{...fl(0,"center","space-between"),marginBottom:20}}>
        <div><div style={{fontWeight:700,fontSize:20,color:C.text}}>Compare</div><div style={{color:C.muted,fontSize:13}}>{compared.length} models</div></div>
        <button style={btn("line")} onClick={()=>setCompareList([])} className="hov">Clear all</button>
      </div>
      {compareList.length<3&&(
        <div style={{...card,padding:13,borderStyle:"dashed",marginBottom:14}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:7}}>Add another:</div>
          <div style={fl(5,undefined,undefined,{flexWrap:"wrap"})}>
            {models.filter(m=>!compareList.includes(m.id)).map(m=>(
              <button key={m.id} style={{...btn("line"),fontSize:11}} onClick={()=>setCompareList(p=>[...p,m.id])} className="hov">+ {m.name}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{...card,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:`155px repeat(${compared.length},1fr)`,background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
          <div style={{padding:"11px 15px",fontSize:10.5,color:C.muted}}>METRIC</div>
          {compared.map(m=>(
            <div key={m.id} style={{padding:"11px 15px",borderLeft:`1px solid ${C.border}`}}>
              <div style={fl(7)}><span style={{color:C.orange}}>{m.icon}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div><div style={{fontSize:10.5,color:C.muted}}>{m.org}</div></div><button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}} onClick={()=>setCompareList(p=>p.filter(x=>x!==m.id))}>✕</button></div>
            </div>
          ))}
        </div>
        {metrics.map((mt,ri)=>{
          const vals=compared.map(m=>mt.fn?mt.fn(m):m[mt.k]);
          const nums=vals.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
          const best=nums.length>0?Math.max(...nums):null;
          return (
            <div key={mt.l} style={{display:"grid",gridTemplateColumns:`155px repeat(${compared.length},1fr)`,borderBottom:`1px solid ${C.faint}`,background:ri%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
              <div style={{padding:"10px 15px",fontSize:12,color:C.muted,display:"flex",alignItems:"center"}}>{mt.l}</div>
              {compared.map(m=>{const val=mt.fn?mt.fn(m):m[mt.k];const isBest=best!==null&&parseFloat(val)===best;return(<div key={m.id} style={{padding:"10px 15px",borderLeft:`1px solid ${C.faint}`,display:"flex",alignItems:"center"}}><span style={{fontSize:13,fontWeight:isBest?700:400,color:isBest?C.orange:C.text}}>{isBest&&"↑ "}{val}</span></div>);})}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HardwarePage({models}) {
  const [step,setStep]=useState(1);
  const [sel,setSel]=useState(null);
  const [raw,setRaw]=useState("");
  const [hw,setHw]=useState(null);
  const [result,setResult]=useState(null);
  const openModels=models.filter(m=>m.type==="open");

  const parse=(text)=>{
    const get=(...keys)=>{for(const k of keys){const r=new RegExp(k+"[\\s\\t]+(.+)","i");const m=text.match(r);if(m)return m[1].trim();}return "";};
    const proc=get("Processor");
    const ramRaw=get("Installed RAM","RAM");
    const gpuRaw=get("Graphics Card","Display adapter","GPU","Display");
    const storageRaw=get("Storage","Hard disk");
    const sys=get("System Type");
    const ramM=ramRaw.match(/([\d.]+)\s*GB/i);
    const ramGB=ramM?parseFloat(ramM[1]):0;
    const vramMs=[...gpuRaw.matchAll(/\((\d+)\s*GB\)/gi)];
    const vramGB=vramMs.length>0?Math.max(...vramMs.map(m=>parseInt(m[1]))):0;
    const cpuT=proc.toLowerCase();
    const cpuScore=cpuT.includes("i9")||cpuT.includes("ryzen 9")||cpuT.includes("xeon")||cpuT.includes("threadripper")?95:cpuT.includes("i7")||cpuT.includes("ryzen 7")?80:cpuT.includes("i5")||cpuT.includes("ryzen 5")?65:cpuT.includes("i3")||cpuT.includes("ryzen 3")?45:cpuT.includes("celeron")||cpuT.includes("pentium")?20:50;
    const gpuT=gpuRaw.toLowerCase();
    const gpuTier=gpuT.includes("4090")||gpuT.includes("4080")||gpuT.includes("3090")?"flagship":gpuT.includes("4070")||gpuT.includes("3080")||gpuT.includes("3070")?"high":gpuT.includes("4060")||gpuT.includes("3060")||gpuT.includes("2080")||gpuT.includes("6800")||gpuT.includes("6700")?"mid":gpuT.includes("1080")||gpuT.includes("2060")||gpuT.includes("3050")||gpuT.includes("6600")||gpuT.includes("rx 580")||gpuT.includes("1070")||gpuT.includes("1060")?"low-mid":gpuT.includes("gt ")||gpuT.includes("710")||gpuT.includes("730")||gpuT.includes("intel")||gpuT.includes("uhd")||gpuT.includes("iris")||gpuT.includes("integrated")?"integrated":"unknown";
    const isHDD=storageRaw.toLowerCase().includes("hdd")||/hitachi|toshiba mq|seagate barracuda/i.test(storageRaw);
    const isSSD=storageRaw.toLowerCase().includes("ssd")||storageRaw.toLowerCase().includes("nvme");
    return {proc:proc||"Unknown",ramGB,vramGB,gpuRaw:gpuRaw||"Unknown",storageRaw:storageRaw||"Unknown",isHDD,isSSD,cpuScore,gpuTier,is64:sys.includes("64")};
  };

  const analyze=()=>{
    if(!raw.trim()){toastFn?.("Paste your system info first","err");return;}
    if(!sel){toastFn?.("Pick a model first","err");return;}
    const parsed=parse(raw);setHw(parsed);
    const m=sel;
    const q4ram=m.ramQ4gb||999;
    const q4vram=m.vramQ4gb||999;
    const usableRam=Math.max(0,parsed.ramGB-2);
    const usableVram=Math.max(0,parsed.vramGB-0.5);
    const isGpuReal=parsed.gpuTier!=="integrated"&&parsed.gpuTier!=="unknown";
    let verdict,vColor,vIcon,summary,steps=[],warns=[],alts=[];

    if(m.type==="closed"){
      verdict="Cloud API — hardware is irrelevant";vColor=C.purple;vIcon="☁";
      summary=`${m.name} is a closed model running on ${m.org}'s servers. Your PC specs don't matter.`;
      steps=[{n:1,t:`Visit ${m.docsUrl} and create an account`},{n:2,t:"Generate an API key from the dashboard"},{n:3,t:"Add it in Gr(I)p → Dashboard → API Keys"},{n:4,t:"Use it immediately in the Playground tab"}];
    } else if(m.localFeasible===false){
      verdict="Too large for any consumer hardware";vColor=C.red;vIcon="✕";
      summary=`${m.name} (${m.params}) requires hundreds of GB RAM — no consumer PC can run this locally.`;
      steps=[{n:1,t:"Use the API instead",highlight:true},{n:2,t:`Get a ${m.envKey} at ${m.docsUrl}`},{n:3,t:"The API version costs very little — add key in Dashboard, use Playground"}];
      warns.push(`Needs ~${q4ram}GB RAM minimum. Consumer machines max out at 128GB.`);
      alts=openModels.filter(a=>a.localFeasible&&(a.ramQ4gb||0)<=usableRam&&a.id!==m.id).slice(0,3);
    } else if(isGpuReal&&usableVram>=q4vram){
      verdict="✓ Runs natively on your GPU";vColor=C.green;vIcon="⚡";
      const tps=parsed.gpuTier==="flagship"?"50–80":parsed.gpuTier==="high"?"30–60":"15–40";
      summary=`Your ${parsed.vramGB}GB VRAM fits this model at Q4_K_M (needs ${q4vram}GB). Expected speed: ~${tps} tok/s.`;
      steps=[{n:1,t:"Download and install Ollama from https://ollama.com/download"},{n:2,t:`Pull the model: ollama pull ${m.ollamaId}`},{n:3,t:`Run it: ollama run ${m.ollamaId}`},{n:4,t:"Optional: install Open WebUI at https://github.com/open-webui/open-webui for a browser chat UI"}];
      if(parsed.isHDD)warns.push("HDD detected — first model load will take 3–5 minutes. The model runs fine once loaded. An SSD makes loading near-instant.");
    } else if(!isGpuReal&&usableRam>=q4vram){
      verdict="CPU-only inference (slow, but works)";vColor=C.yellow;vIcon="🐢";
      const tps=parsed.cpuScore>=65?"3–6":"1–3";
      summary=`No dedicated GPU, but ${parsed.ramGB}GB RAM fits the model. CPU inference runs at ~${tps} tok/s — usable for non-realtime tasks.`;
      steps=[{n:1,t:"Download Ollama: https://ollama.com/download"},{n:2,t:`Pull: ollama pull ${m.ollamaId}`},{n:3,t:`Reduce context to save RAM: set OLLAMA_CTX_SIZE=2048 before running`},{n:4,t:`Run: ollama run ${m.ollamaId}`}];
      warns.push(`No dedicated GPU — all compute on CPU. ${tps} tokens/sec is usable for offline tasks but slow for chat.`);
      if(parsed.isHDD)warns.push("HDD will cause slow initial loading (3–6 min per load). SSD is strongly recommended.");
    } else if(isGpuReal&&usableVram<q4vram&&usableRam>=q4vram){
      verdict="Partial GPU offload (slower than full GPU)";vColor=C.yellow;vIcon="⚙";
      summary=`Your VRAM (${parsed.vramGB}GB) is below the ${q4vram}GB needed, but RAM (${parsed.ramGB}GB) can hold it. Ollama will split layers between GPU and RAM.`;
      steps=[{n:1,t:"Install Ollama: https://ollama.com/download"},{n:2,t:`Pull: ollama pull ${m.ollamaId}`},{n:3,t:"Run normally — Ollama handles GPU/CPU layer splitting automatically"},{n:4,t:"Expect 5–20× slower than full VRAM. Speed depends on how many layers fit in GPU."}];
      warns.push(`${parsed.vramGB}GB VRAM < ${q4vram}GB needed — overflow goes through PCIe to RAM, which is 5–20× slower than full GPU.`);
    } else {
      verdict="Not enough RAM or VRAM";vColor=C.red;vIcon="✕";
      summary=`${m.name} needs ~${q4vram}GB VRAM or ~${q4ram}GB RAM at Q4. You have ${parsed.vramGB}GB VRAM and ${parsed.ramGB}GB RAM.`;
      steps=[{n:1,t:"Use the cloud API — it costs less than hardware upgrades",highlight:true},{n:2,t:`Get your API key at ${m.docsUrl}`},{n:3,t:"Add key in Dashboard → test instantly in Playground"}];
      warns.push(`Q4 minimum RAM: ~${q4ram}GB. You have ${parsed.ramGB}GB (${usableRam}GB after OS).`);
      if(parsed.vramGB>0&&isGpuReal)warns.push(`Your ${parsed.vramGB}GB VRAM is not enough. This model needs ${q4vram}GB minimum.`);
      alts=openModels.filter(a=>a.localFeasible&&(a.ramQ4gb||0)<=usableRam&&a.id!==m.id).slice(0,3);
    }
    setResult({verdict,vColor,vIcon,summary,steps,warns,alts,q4ram,q4vram});setStep(3);
    toastFn?.("Analysis complete");
  };

  const reset=()=>{setStep(1);setSel(null);setRaw("");setHw(null);setResult(null);};

  return (
    <div style={main} className="fade">
      <div style={{marginBottom:22}}>
        <div style={{fontWeight:700,fontSize:22,color:C.text,marginBottom:3}}>Can I run this model?</div>
        <div style={{color:C.muted,fontSize:13}}>Pick a model you want to run locally, paste your Windows specs, get a specific action plan.</div>
      </div>

      <div style={{...fl(0),gap:0,marginBottom:26}}>
        {[{n:1,l:"Pick model"},{n:2,l:"Your specs"},{n:3,l:"Action plan"}].map((s,i)=>(
          <div key={s.n} style={{display:"flex",alignItems:"center"}}>
            <div style={{...fl(7),cursor:s.n<step?"pointer":"default"}} onClick={()=>s.n<step&&setStep(s.n)}>
              <div style={{width:25,height:25,borderRadius:"50%",background:step===s.n?C.orange:step>s.n?"rgba(249,115,22,0.2)":"transparent",border:`2px solid ${step>=s.n?C.orange:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>=s.n?step===s.n?"#111":C.orange:C.muted}}>{step>s.n?"✓":s.n}</div>
              <span style={{fontSize:12.5,color:step>=s.n?C.text:C.muted}}>{s.l}</span>
            </div>
            {i<2&&<div style={{width:32,height:1,background:step>s.n?C.orange:C.border,margin:"0 7px"}}/>}
          </div>
        ))}
      </div>

      {step===1&&(
        <div className="fade">
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Closed models (GPT-4o, Claude, Gemini) are grayed out — they run on provider servers, not your hardware.</div>
          <div style={grid2}>
            {models.map(m=>{
              const isOpen=m.type==="open";const isSel=sel?.id===m.id;
              return(
                <div key={m.id} style={{...card,padding:"12px 15px",cursor:isOpen?"pointer":"not-allowed",opacity:isOpen?1:0.3,borderColor:isSel?C.orange:C.border,background:isSel?C.orangeDim:C.surface}} onClick={()=>isOpen&&setSel(m)}>
                  <div style={fl(8)}><span style={{color:C.orange,fontSize:17}}>{m.icon}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.org} · {m.params}</div></div>{isSel&&<span style={{color:C.orange}}>✓</span>}{!isOpen&&<span style={{fontSize:10,color:C.muted}}>API only</span>}</div>
                  {isOpen&&m.ramQ4gb&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>Needs ~{m.ramQ4gb}GB RAM (Q4)</div>}
                  {isOpen&&m.localFeasible===false&&<div style={{fontSize:11,color:C.red,marginTop:5}}>Requires datacenter hardware</div>}
                </div>
              );
            })}
          </div>
          <button style={{...btn("fill"),marginTop:18,fontSize:13,padding:"9px 22px",opacity:sel?1:0.4}} onClick={()=>sel&&setStep(2)} className="hov">Next →</button>
        </div>
      )}

      {step===2&&(
        <div className="fade">
          <div style={{...fl(0,"center","space-between"),marginBottom:13}}>
            <div style={{fontWeight:600,fontSize:15,color:C.text}}>Checking: <span style={{color:C.orange}}>{sel.name}</span></div>
            <button style={btn("line")} onClick={()=>setStep(1)} className="hov">← Change</button>
          </div>
          <div style={{...card,padding:"12px 15px",marginBottom:14,fontSize:12.5,color:C.muted,lineHeight:1.9}}>
            <strong style={{color:C.text}}>Getting your Windows specs:</strong><br/>
            Press <kbd style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:3,padding:"1px 6px",color:C.text,fontSize:11}}>Win + I</kbd> → System → About → copy the "Device specifications" section and paste below.
          </div>
          <textarea value={raw} onChange={e=>setRaw(e.target.value)}
            placeholder={"Device Name\tDESKTOP-XXXXX\nProcessor\tIntel Core i5-12400\nInstalled RAM\t16.00 GB\nGraphics Card\tNVIDIA GeForce RTX 3060 (12 GB)\nStorage\t512 GB SSD\nSystem Type\t64-bit operating system"}
            style={{...inp,height:185,resize:"vertical",fontSize:12.5,lineHeight:1.8,marginBottom:12}}/>
          <div style={fl(7)}>
            <button style={{...btn("fill"),fontSize:13,padding:"9px 20px",opacity:raw.trim()?1:0.4}} onClick={analyze} className="hov">Analyze →</button>
            <button style={btn("line")} onClick={()=>setStep(1)} className="hov">← Back</button>
          </div>
        </div>
      )}

      {step===3&&result&&hw&&(
        <div className="fade">
          <div style={{...card,borderColor:result.vColor,padding:"17px 19px",marginBottom:18}}>
            <div style={{...fl(12,"flex-start","space-between"),flexWrap:"wrap",gap:10}}>
              <div style={fl(13,"flex-start")}>
                <div style={{width:46,height:46,borderRadius:9,background:`rgba(${result.vColor==="#22c55e"?"34,197,94":result.vColor==="#eab308"?"234,179,8":result.vColor==="#ef4444"?"239,68,68":result.vColor==="#a78bfa"?"167,139,250":"249,115,22"},0.12)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{result.vIcon}</div>
                <div><div style={{fontWeight:700,fontSize:16,color:result.vColor}}>{result.verdict}</div><div style={{fontSize:13,color:C.muted,marginTop:3,lineHeight:1.6,maxWidth:480}}>{result.summary}</div></div>
              </div>
              <div style={fl(6)}>
                <button style={btn("line")} onClick={()=>setStep(2)} className="hov">← Edit specs</button>
                <button style={btn("line")} onClick={reset} className="hov">↺ Start over</button>
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:7,marginBottom:16}}>
            {[{l:"CPU",v:hw.proc.split("@")[0].trim().slice(0,20),c:C.orange},{l:"RAM",v:`${hw.ramGB}GB`,c:hw.ramGB>=16?C.green:hw.ramGB>=8?C.yellow:C.red},{l:"VRAM",v:`${hw.vramGB}GB`,c:hw.vramGB>=8?C.green:hw.vramGB>=4?C.yellow:C.red},{l:"GPU type",v:hw.gpuTier,c:C.text},{l:"Storage",v:hw.isSSD?"SSD ✓":hw.isHDD?"HDD ⚠":"?",c:hw.isSSD?C.green:C.yellow},{l:"Model needs",v:`${result.q4vram}GB VRAM`,c:hw.vramGB>=result.q4vram?C.green:C.red}].map(s=>(
              <div key={s.l} style={{...card,padding:"10px 13px"}}><div style={{fontSize:10,color:C.muted,letterSpacing:"0.05em",marginBottom:2}}>{s.l.toUpperCase()}</div><div style={{fontWeight:700,fontSize:13,color:s.c}}>{s.v}</div></div>
            ))}
          </div>

          {result.warns.length>0&&<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>{result.warns.map((w,i)=><div key={i} style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"8px 12px",fontSize:12.5,color:"#f87171",lineHeight:1.5}}>{w}</div>)}</div>}

          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,color:C.muted,letterSpacing:"0.05em",marginBottom:9}}>WHAT TO DO</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {result.steps.map((s,i)=>(
                <div key={i} style={{...fl(11,"flex-start"),...card,background:s.highlight?C.orangeDim:C.surface,borderColor:s.highlight?"rgba(249,115,22,0.3)":C.border,padding:"11px 13px"}}>
                  <div style={{width:23,height:23,borderRadius:"50%",background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.orange}}>{s.n}</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6,fontFamily:"ui-monospace,monospace"}}>{s.t}</div>
                </div>
              ))}
            </div>
          </div>

          {result.alts.length>0&&(
            <div>
              <div style={{fontSize:11,color:C.muted,letterSpacing:"0.05em",marginBottom:9}}>MODELS THAT FIT YOUR HARDWARE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:7}}>
                {result.alts.map(a=>(
                  <div key={a.id} style={{...card,padding:"12px 14px",cursor:"pointer"}} className="ch" onClick={()=>{setSel(a);setResult(null);setHw(null);setStep(2);}}>
                    <div style={fl(7)}><span style={{color:C.orange,fontSize:16}}>{a.icon}</span><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.muted}}>{a.params} · needs {a.ramQ4gb}GB</div></div></div>
                    <div style={{fontSize:11.5,color:C.green,marginTop:7}}>✓ fits your {hw.ramGB}GB RAM</div>
                    <div style={{fontSize:10.5,color:C.muted,marginTop:3}}>Click to check this model →</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardPage({apiKeys,setApiKeys,logs,setLogs,saved,models,setPage}) {
  const [tab,setTab]=useState("keys");
  const [editKey,setEditKey]=useState({});
  const [showKey,setShowKey]=useState({});
  const saveKey=(id)=>{const v=editKey[id]?.trim();if(!v)return;setApiKeys(p=>({...p,[id]:v}));setEditKey(p=>({...p,[id]:""}));toastFn?.(`Key saved for ${models.find(m=>m.id===id)?.name}`);};
  const removeKey=(id)=>{setApiKeys(p=>{const n={...p};delete n[id];return n;});toastFn?.("Key removed","err");};
  const totalCalls=logs.length,okCalls=logs.filter(l=>l.ok).length,totalTok=logs.reduce((a,l)=>a+(l.tokens||0),0);
  const byModel=models.map(m=>({...m,calls:logs.filter(l=>l.modelId===m.id).length,ok:logs.filter(l=>l.modelId===m.id&&l.ok).length,tok:logs.filter(l=>l.modelId===m.id).reduce((a,l)=>a+(l.tokens||0),0)})).filter(m=>m.calls>0).sort((a,b)=>b.calls-a.calls);
  const tabs=[{id:"keys",l:"API Keys"},{id:"usage",l:"Usage"},{id:"logs",l:"Call Logs"},{id:"saved",l:"Saved"}];
  return (
    <div style={main} className="fade">
      <div style={{marginBottom:22}}><div style={{fontWeight:700,fontSize:22,color:C.text,marginBottom:3}}>Dashboard</div><div style={{color:C.muted,fontSize:13}}>Your keys, usage, and saved models.</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:22}}>
        {[{n:Object.keys(apiKeys).length,l:"keys saved",c:C.orange},{n:totalCalls,l:"total calls",c:C.green},{n:`${okCalls}/${totalCalls}`,l:"successful",c:C.yellow},{n:totalTok.toLocaleString(),l:"tokens",c:C.purple}].map(s=>(
          <div key={s.l} style={{...card,padding:"13px 16px"}}><div style={{fontSize:21,fontWeight:700,color:s.c,marginBottom:2}}>{s.n}</div><div style={{fontSize:11.5,color:C.muted}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{...fl(2),marginBottom:16,borderBottom:`1px solid ${C.border}`,paddingBottom:0}}>
        {tabs.map(t=><button key={t.id} style={{...btn(tab===t.id?"dim":"line"),borderRadius:"6px 6px 0 0",borderBottom:"none",marginBottom:-1}} onClick={()=>setTab(t.id)} className="hov">{t.l}</button>)}
      </div>
      {tab==="keys"&&(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:7,padding:"9px 13px",fontSize:12,color:C.muted,lineHeight:1.7}}>🔐 Keys are saved to your browser localStorage only. They never leave your device — only sent directly to each provider's API when you make a call.</div>
          {models.map(m=>{const has=!!apiKeys[m.id];return(
            <div key={m.id} style={{...card,padding:"13px 16px"}}>
              <div style={{...fl(0,"flex-start","space-between"),flexWrap:"wrap",gap:9}}>
                <div style={fl(8)}><div style={{width:32,height:32,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:C.orange,fontSize:15}}>{m.icon}</div><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.org} · <span style={{color:C.orangeL}}>{m.envKey}</span></div></div></div>
                <div style={{...fl(6),flex:1,minWidth:250}}>
                  {has?(<><input type={showKey[m.id]?"text":"password"} readOnly value={showKey[m.id]?apiKeys[m.id]:"•".repeat(Math.min(apiKeys[m.id].length,32))} style={{...inp,flex:1,fontSize:12,color:C.green}}/><button style={btn("line")} onClick={()=>setShowKey(p=>({...p,[m.id]:!p[m.id]}))} className="hov">{showKey[m.id]?"Hide":"Show"}</button><button style={{...btn("line"),color:C.red,borderColor:"rgba(239,68,68,0.3)"}} onClick={()=>removeKey(m.id)} className="hov">Remove</button></>):(<><input type="password" placeholder={`Paste ${m.envKey}…`} value={editKey[m.id]||""} onChange={e=>setEditKey(p=>({...p,[m.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveKey(m.id)} style={{...inp,flex:1,fontSize:12}}/><button style={btn("fill")} onClick={()=>saveKey(m.id)} className="hov">Save</button><a href={m.docsUrl} target="_blank" rel="noreferrer" style={{...btn("line"),textDecoration:"none",fontSize:12}}>Get key ↗</a></>)}
                </div>
              </div>
            </div>
          );})}
        </div>
      )}
      {tab==="usage"&&(
        <div>
          {byModel.length===0?(<div style={{textAlign:"center",padding:52,color:C.muted}}><div style={{fontSize:13}}>No usage yet.</div><button style={{...btn("fill"),marginTop:13}} onClick={()=>setPage("playground")} className="hov">Go to Playground</button></div>):(
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {byModel.map(m=>(
                <div key={m.id} style={{...card,padding:"13px 16px"}}>
                  <div style={{...fl(0,"center","space-between"),marginBottom:9}}>
                    <div style={fl(8)}><span style={{color:C.orange,fontSize:17}}>{m.icon}</span><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.org}</div></div></div>
                    <div style={fl(18)}>{[{v:m.calls,l:"calls",c:C.orange},{v:m.ok,l:"ok",c:C.green},{v:m.tok,l:"tokens",c:C.yellow}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:17,color:s.c}}>{s.v.toLocaleString()}</div><div style={{fontSize:10,color:C.muted}}>{s.l}</div></div>)}</div>
                  </div>
                  <div style={{height:3,background:C.faint,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${(m.calls/totalCalls)*100}%`,background:C.orange,borderRadius:2}}/></div>
                  <div style={{fontSize:10.5,color:C.muted,marginTop:3}}>{((m.calls/totalCalls)*100).toFixed(0)}% of all calls</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab==="logs"&&(
        <div>
          {logs.length===0?<div style={{textAlign:"center",padding:52,color:C.muted}}>No logs yet.</div>:(
            <>
              <div style={{...card,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"105px 1fr 85px 65px 75px",padding:"8px 14px",background:C.surface2,borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,letterSpacing:"0.05em"}}><div>TIME</div><div>PROMPT</div><div>MODEL</div><div>STATUS</div><div>TOKENS</div></div>
                {logs.slice(0,60).map(log=>{const m=models.find(x=>x.id===log.modelId);return(
                  <div key={log.id} style={{display:"grid",gridTemplateColumns:"105px 1fr 85px 65px 75px",padding:"8px 14px",borderBottom:`1px solid ${C.faint}`,fontSize:12.5,alignItems:"center"}}>
                    <div style={{color:C.muted,fontSize:10.5}}>{new Date(log.ts).toLocaleTimeString()}</div>
                    <div style={{color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.prompt}…</div>
                    <div style={{fontSize:11.5,color:C.orangeL}}>{m?.name?.split(" ")[0]||log.modelId}</div>
                    <div style={{color:log.ok?C.green:C.red,fontSize:11}}>{log.ok?"✓":"✕"}</div>
                    <div style={{color:C.yellow,fontSize:11.5}}>{log.tokens}</div>
                  </div>
                );})}
              </div>
              <button style={{...btn("line"),marginTop:10,fontSize:11.5,color:C.red,borderColor:"rgba(239,68,68,0.3)"}} onClick={()=>{if(window.confirm("Clear all logs?")){setLogs([]);localStorage.setItem("grip_logs","[]");}}} className="hov">✕ Clear logs</button>
            </>
          )}
        </div>
      )}
      {tab==="saved"&&(
        <div style={grid2}>
          {saved.length===0?(<div style={{gridColumn:"1/-1",textAlign:"center",padding:52,color:C.muted}}><div style={{fontSize:13}}>No saved models. Star ☆ a model in Explore.</div><button style={{...btn("fill"),marginTop:13}} onClick={()=>setPage("explore")} className="hov">Explore</button></div>):models.filter(m=>saved.includes(m.id)).map(m=>(
            <div key={m.id} style={{...card,padding:15}}>
              <div style={fl(8)}><span style={{color:C.orange,fontSize:17}}>{m.icon}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.text}}>{m.name}</div><div style={{fontSize:11.5,color:C.muted}}>{m.org} · {m.params}</div></div><span style={badge(m.tier)}>{m.tier}</span></div>
              <div style={{color:C.muted,fontSize:12.5,margin:"9px 0",lineHeight:1.6}}>{m.desc}</div>
              <div style={{...fl(0,"center","space-between"),paddingTop:9,borderTop:`1px solid ${C.border}`}}><span style={{fontSize:11.5,color:C.muted}}>MMLU <strong style={{color:C.text}}>{m.mmlu}%</strong> · HE <strong style={{color:C.text}}>{m.humaneval}%</strong></span><a href={m.docsUrl} target="_blank" rel="noreferrer" style={{...btn("line"),fontSize:11.5,textDecoration:"none"}}>Docs ↗</a></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaudeSkillsPage({apiKeys, addLog}) {
  const [activeSkill, setActiveSkill] = useState(null);
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [customParams, setCustomParams] = useState({});
  const hasKey = !!apiKeys["claude_opus"] || !!apiKeys["claude_sonnet"] || !!apiKeys["claude_haiku"];
  const apiKey = apiKeys["claude_opus"] || apiKeys["claude_sonnet"] || apiKeys["claude_haiku"] || "";

  const CLAUDE_MODELS = [
    {id:"claude-opus-4-6", label:"Opus 4.6 — most capable", cost:"$5/1M"},
    {id:"claude-sonnet-4-6", label:"Sonnet 4.6 — recommended", cost:"$3/1M"},
    {id:"claude-haiku-4-5-20251001", label:"Haiku 4.5 — fastest & cheapest", cost:"$1/1M"},
  ];

  const SKILLS = [
    {
      id:"summarize", icon:"◎", name:"Summarizer", category:"Writing",
      desc:"Condenses any text to a clear, structured summary. Control the length and style.",
      systemPrompt:"You are a professional summarizer. Produce a clear, well-structured summary. Be concise but capture all key points. Use bullet points for main takeaways at the end.",
      inputLabel:"Paste the text to summarize", inputPlaceholder:"Paste an article, document, or any long text here…",
      params:[{id:"length", label:"Summary length", type:"select", options:["Brief (2-3 sentences)","Medium (1 paragraph)","Detailed (multiple paragraphs)"], default:"Medium (1 paragraph)"}],
      buildPrompt:(input, p) => `Summarize the following text. Target length: ${p.length||"Medium (1 paragraph)"}.\n\nText:\n${input}`,
    },
    {
      id:"code_explain", icon:"◷", name:"Code Explainer", category:"Code",
      desc:"Explains what any code does in plain English. Works with any language.",
      systemPrompt:"You are an expert software engineer and educator. Explain code clearly for the specified audience level. Break down complex logic into understandable parts.",
      inputLabel:"Paste your code", inputPlaceholder:"Paste any code snippet here…",
      params:[{id:"level", label:"Audience level", type:"select", options:["Beginner","Intermediate","Expert"], default:"Intermediate"}],
      buildPrompt:(input, p) => `Explain this code for a ${p.level||"Intermediate"} developer. Describe what it does, how it works, and any important patterns or gotchas.\n\nCode:\n\`\`\`\n${input}\n\`\`\``,
    },
    {
      id:"code_review", icon:"◸", name:"Code Reviewer", category:"Code",
      desc:"Reviews code for bugs, security issues, performance problems, and style.",
      systemPrompt:"You are a senior software engineer conducting a thorough code review. Identify bugs, security vulnerabilities, performance issues, and style improvements. Be specific and actionable.",
      inputLabel:"Paste code to review", inputPlaceholder:"Paste your code here…",
      params:[{id:"focus", label:"Focus area", type:"select", options:["All issues","Bugs only","Security only","Performance only","Style only"], default:"All issues"}],
      buildPrompt:(input, p) => `Review this code. Focus: ${p.focus||"All issues"}. List specific issues with line references where possible, and suggest fixes.\n\nCode:\n\`\`\`\n${input}\n\`\`\``,
    },
    {
      id:"translate", icon:"◐", name:"Translator", category:"Writing",
      desc:"Translates text between any languages while preserving tone and meaning.",
      systemPrompt:"You are a professional translator. Preserve the original tone, style, and meaning. Handle idioms and cultural nuances appropriately.",
      inputLabel:"Text to translate", inputPlaceholder:"Enter text to translate…",
      params:[
        {id:"from", label:"From language", type:"text", placeholder:"English (or 'auto-detect')", default:"auto-detect"},
        {id:"to", label:"To language", type:"text", placeholder:"e.g. Spanish, Japanese, French", default:"Spanish"},
      ],
      buildPrompt:(input, p) => `Translate the following text from ${p.from||"auto-detect"} to ${p.to||"Spanish"}. Preserve tone and meaning.\n\nText:\n${input}`,
    },
    {
      id:"debug", icon:"◉", name:"Bug Fixer", category:"Code",
      desc:"Identifies bugs in your code, explains the cause, and provides a fixed version.",
      systemPrompt:"You are an expert debugger. Identify all bugs, explain what causes each one, and provide a corrected version of the code.",
      inputLabel:"Paste buggy code (and describe the error if you have one)", inputPlaceholder:"Code here…\n\n// Error message (optional):\n// e.g. TypeError: Cannot read property 'x' of undefined",
      params:[{id:"lang", label:"Language", type:"text", placeholder:"e.g. Python, JavaScript", default:""}],
      buildPrompt:(input, p) => `Debug this ${p.lang||""} code. List each bug found, explain why it causes a problem, and provide the fixed code.\n\n${input}`,
    },
    {
      id:"email", icon:"◁", name:"Email Writer", category:"Writing",
      desc:"Drafts professional emails from a brief description of what you need to say.",
      systemPrompt:"You are a professional business writer. Draft clear, appropriately toned emails that get results. Include subject line.",
      inputLabel:"Describe what you need to say", inputPlaceholder:"e.g. Follow up on a job application I sent 2 weeks ago to TechCorp for a frontend developer role…",
      params:[{id:"tone", label:"Tone", type:"select", options:["Professional","Friendly","Formal","Direct","Apologetic"], default:"Professional"}],
      buildPrompt:(input, p) => `Write a ${p.tone||"Professional"} email based on this context:\n${input}\n\nInclude: Subject line, greeting, body, closing.`,
    },
    {
      id:"qa", icon:"◑", name:"Q&A over Document", category:"Analysis",
      desc:"Paste a document and ask questions about it. Claude reads the full content.",
      systemPrompt:"You are a precise, helpful assistant answering questions about a provided document. Only answer based on the document content. If the answer is not in the document, say so.",
      inputLabel:"Paste your document, then ask your question below", inputPlaceholder:"[Your document text]\n\n---\nQ: What is…",
      params:[],
      buildPrompt:(input) => `The user has provided a document and a question. Read the document carefully and answer only the question asked.\n\nDocument + Question:\n${input}`,
    },
    {
      id:"extract", icon:"◃", name:"Data Extractor", category:"Analysis",
      desc:"Extracts structured data from unstructured text — emails, documents, web pages.",
      systemPrompt:"You are a data extraction expert. Extract exactly the requested fields from the provided text. Return clean, structured output. If a field is not found, write N/A.",
      inputLabel:"Paste the text and describe what to extract", inputPlaceholder:"[Paste text here]\n\n---\nExtract: name, email, phone number, company name",
      params:[{id:"format", label:"Output format", type:"select", options:["JSON","Markdown table","Plain list","CSV"], default:"JSON"}],
      buildPrompt:(input, p) => `Extract the requested data from the text below. Output format: ${p.format||"JSON"}.\n\n${input}`,
    },
    {
      id:"rewrite", icon:"◂", name:"Tone Rewriter", category:"Writing",
      desc:"Rewrites any text in a different tone — formal, casual, persuasive, simplified.",
      systemPrompt:"You are a professional editor. Rewrite text to match the requested tone while preserving the core meaning and all key information.",
      inputLabel:"Text to rewrite", inputPlaceholder:"Paste the text you want rewritten…",
      params:[{id:"tone", label:"Target tone", type:"select", options:["Formal","Casual","Persuasive","Simple / Plain English","Academic","Enthusiastic","Empathetic"], default:"Formal"}],
      buildPrompt:(input, p) => `Rewrite the following text in a ${p.tone||"Formal"} tone. Keep all key information.\n\nOriginal:\n${input}`,
    },
    {
      id:"sql", icon:"◇", name:"SQL Assistant", category:"Code",
      desc:"Writes SQL queries from plain English descriptions. Supports most SQL dialects.",
      systemPrompt:"You are a SQL expert. Write clean, efficient, well-commented SQL queries. Explain what the query does after writing it.",
      inputLabel:"Describe what you want to query in plain English", inputPlaceholder:"e.g. Get the top 10 customers by total order value in 2024, including their name and email address…",
      params:[{id:"dialect", label:"SQL dialect", type:"select", options:["PostgreSQL","MySQL","SQLite","SQL Server","BigQuery","Snowflake"], default:"PostgreSQL"}],
      buildPrompt:(input, p) => `Write a ${p.dialect||"PostgreSQL"} query for the following requirement:\n\n${input}\n\nProvide the query and a brief explanation.`,
    },
    {
      id:"sentiment", icon:"◆", name:"Sentiment Analyzer", category:"Analysis",
      desc:"Analyzes sentiment in text — reviews, feedback, social posts. Returns structured results.",
      systemPrompt:"You are a sentiment analysis expert. Analyze text for overall sentiment, emotional tone, and key themes. Be specific with evidence from the text.",
      inputLabel:"Paste text to analyze", inputPlaceholder:"Paste customer reviews, feedback, or any text…",
      params:[{id:"depth", label:"Analysis depth", type:"select", options:["Quick (overall only)","Standard (sentiment + themes)","Deep (full breakdown)"], default:"Standard (sentiment + themes)"}],
      buildPrompt:(input, p) => `Perform ${p.depth||"Standard"} sentiment analysis on the following text. Include: overall sentiment score, emotional tone, key themes, and notable phrases.\n\nText:\n${input}`,
    },
    {
      id:"regex", icon:"◊", name:"Regex Generator", category:"Code",
      desc:"Generates regex patterns from plain English descriptions. Explains each part.",
      systemPrompt:"You are a regex expert. Generate accurate regex patterns and explain every component. Test with examples.",
      inputLabel:"Describe what you need to match", inputPlaceholder:"e.g. Match all valid email addresses…\nor: Extract dates in DD/MM/YYYY format from text…",
      params:[{id:"flavor", label:"Regex flavor", type:"select", options:["JavaScript","Python","Java","PHP","Go","Ruby"], default:"JavaScript"}],
      buildPrompt:(input, p) => `Write a ${p.flavor||"JavaScript"} regex pattern for: ${input}\n\nProvide: the pattern, explanation of each component, and 3 example matches.`,
    },
  ];

  const categories = [...new Set(SKILLS.map(s => s.category))];

  const runSkill = async () => {
    if (!input.trim() || !hasKey || !activeSkill) return;
    const skill = SKILLS.find(s => s.id === activeSkill);
    if (!skill) return;
    setLoading(true); setOutput("");
    const prompt = skill.buildPrompt(input, customParams);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({
          model, max_tokens:1024,
          system: skill.systemPrompt,
          messages:[{role:"user", content:prompt}]
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "API error");
      const result = d.content[0].text;
      setOutput(result);
      addLog("claude_sonnet", prompt.slice(0,60), true, Math.floor(result.length/4));
      toastFn?.("Done!");
    } catch(e) {
      setOutput(`Error: ${e.message}`);
      toastFn?.(e.message, "err");
    }
    setLoading(false);
  };

  const skill = SKILLS.find(s => s.id === activeSkill);

  return (
    <div style={main} className="fade">
      <div style={{marginBottom:22}}>
        <div style={{fontWeight:700, fontSize:22, color:C.text, marginBottom:4}}>Claude Skills</div>
        <div style={{color:C.muted, fontSize:13}}>
          Ready-to-use prompting templates powered by real Claude API calls — pick a skill, fill in your input, run it.
        </div>
      </div>

      {!hasKey && (
        <div style={{background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.25)", borderRadius:9, padding:"13px 16px", marginBottom:20, fontSize:13, color:C.orange}}>
          ⚠ Add an Anthropic API key in Dashboard to use these skills. All 3 Claude models (Opus, Sonnet, Haiku) use the same <strong>ANTHROPIC_API_KEY</strong>.
        </div>
      )}

      <div style={{display:"grid", gridTemplateColumns:"260px 1fr", gap:18, alignItems:"start"}}>
        {/* Skill list */}
        <div>
          <div style={{fontSize:11, color:C.muted, letterSpacing:"0.05em", marginBottom:10}}>MODEL</div>
          <select value={model} onChange={e=>setModel(e.target.value)}
            style={{...inp, marginBottom:18, fontSize:12.5}}>
            {CLAUDE_MODELS.map(m=>(
              <option key={m.id} value={m.id}>{m.label} · {m.cost}</option>
            ))}
          </select>

          {categories.map(cat => (
            <div key={cat} style={{marginBottom:16}}>
              <div style={{fontSize:10.5, color:C.muted, letterSpacing:"0.06em", marginBottom:6, paddingLeft:2}}>{cat.toUpperCase()}</div>
              {SKILLS.filter(s=>s.category===cat).map(s=>(
                <div key={s.id} style={{...card, padding:"10px 12px", marginBottom:5, cursor:"pointer",
                  borderColor:activeSkill===s.id?C.orange:C.border,
                  background:activeSkill===s.id?C.orangeDim:C.surface}}
                  onClick={()=>{setActiveSkill(s.id);setInput("");setOutput("");setCustomParams({});}}>
                  <div style={fl(7)}>
                    <span style={{color:C.orange, fontSize:15}}>{s.icon}</span>
                    <div>
                      <div style={{fontWeight:600, fontSize:12.5, color:C.text}}>{s.name}</div>
                      <div style={{fontSize:10.5, color:C.muted, lineHeight:1.4, marginTop:1}}>{s.desc.split(".")[0]}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Skill runner */}
        <div>
          {!activeSkill ? (
            <div style={{...card, padding:48, textAlign:"center"}}>
              <div style={{fontSize:28, marginBottom:12, color:C.faint}}>◈</div>
              <div style={{color:C.muted, fontSize:14}}>Select a skill from the left to get started.</div>
              <div style={{color:C.faint, fontSize:12, marginTop:6}}>{SKILLS.length} skills available — no prompt engineering needed.</div>
            </div>
          ) : (
            <div>
              <div style={{...card, padding:"16px 18px", marginBottom:14}}>
                <div style={fl(10,"flex-start","space-between")}>
                  <div style={fl(10)}>
                    <span style={{fontSize:22, color:C.orange}}>{skill.icon}</span>
                    <div>
                      <div style={{fontWeight:700, fontSize:16, color:C.text}}>{skill.name}</div>
                      <div style={{fontSize:12.5, color:C.muted, marginTop:2}}>{skill.desc}</div>
                    </div>
                  </div>
                  <span style={{fontSize:11, color:C.muted, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:5, padding:"2px 8px"}}>{skill.category}</span>
                </div>

                {/* System prompt preview */}
                <div style={{marginTop:12, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:7, padding:"9px 12px"}}>
                  <div style={{fontSize:10, color:C.muted, letterSpacing:"0.05em", marginBottom:4}}>SYSTEM PROMPT (read-only)</div>
                  <div style={{fontSize:11.5, color:"#7c9af4", lineHeight:1.6, fontFamily:"ui-monospace,monospace"}}>{skill.systemPrompt}</div>
                </div>
              </div>

              {/* Params */}
              {skill.params.length > 0 && (
                <div style={{...card, padding:"14px 16px", marginBottom:12}}>
                  <div style={{fontSize:11, color:C.muted, letterSpacing:"0.05em", marginBottom:10}}>OPTIONS</div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10}}>
                    {skill.params.map(p => (
                      <div key={p.id}>
                        <div style={{fontSize:11.5, color:C.muted, marginBottom:5}}>{p.label}</div>
                        {p.type==="select" ? (
                          <select value={customParams[p.id]||p.default} onChange={e=>setCustomParams(prev=>({...prev,[p.id]:e.target.value}))}
                            style={{...inp, fontSize:12.5}}>
                            {p.options.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type="text" placeholder={p.placeholder} value={customParams[p.id]||""}
                            onChange={e=>setCustomParams(prev=>({...prev,[p.id]:e.target.value}))}
                            style={{...inp, fontSize:12.5}}/>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11.5, color:C.muted, marginBottom:6}}>{skill.inputLabel}</div>
                <textarea value={input} onChange={e=>setInput(e.target.value)}
                  placeholder={skill.inputPlaceholder}
                  style={{...inp, height:160, resize:"vertical", lineHeight:1.7}}/>
              </div>

              <button style={{...btn("fill"), fontSize:13.5, padding:"10px 24px",
                opacity:hasKey&&input.trim()?1:0.4}}
                onClick={runSkill} disabled={!hasKey||!input.trim()||loading} className="hov">
                {loading ? "Running…" : `▶ Run with ${CLAUDE_MODELS.find(m=>m.id===model)?.label.split(" —")[0]}`}
              </button>

              {/* Output */}
              {output && (
                <div style={{...card, marginTop:14, padding:"15px 17px"}}>
                  <div style={{...fl(0,"center","space-between"), marginBottom:10}}>
                    <div style={{fontSize:11, color:C.muted, letterSpacing:"0.05em"}}>OUTPUT</div>
                    <button style={{...btn("line"), fontSize:11}} onClick={()=>{navigator.clipboard.writeText(output).catch(()=>{});toastFn?.("Copied!");}} className="hov">Copy</button>
                  </div>
                  <div style={{fontSize:13.5, color:C.text, lineHeight:1.75, whiteSpace:"pre-wrap",
                    fontFamily: output.includes("```") ? "ui-monospace,monospace" : "inherit",
                    maxHeight:480, overflow:"auto"}}>
                    {output}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


  const [prompt,setPrompt]=useState("Hello! Introduce yourself in one sentence.");
  const [resp,setResp]=useState("");const [loading,setLoading]=useState(false);
  const has=!!apiKeys[m.id];
  const run=async()=>{if(!prompt.trim()||loading||!has)return;setLoading(true);setResp("");try{const r=await m.callFn(apiKeys[m.id],prompt);setResp(r);addLog(m.id,prompt,true,Math.floor(r.length/4));toastFn?.("Got a response");}catch(e){setResp(`Error: ${e.message}`);addLog(m.id,prompt,false,0);toastFn?.(e.message,"err");}setLoading(false);};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...card,width:"100%",maxWidth:570,maxHeight:"82vh",overflow:"auto",padding:24}}>
        <div style={{...fl(0,"center","space-between"),marginBottom:16}}><div style={fl(8)}><span style={{color:C.orange,fontSize:19}}>{m.icon}</span><div><div style={{fontWeight:700,fontSize:15,color:C.text}}>Test {m.name}</div><div style={{fontSize:11.5,color:C.muted}}>{m.org} · {m.context}</div></div></div><button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:17}} onClick={onClose}>✕</button></div>
        {!has?(<div style={{textAlign:"center",padding:26}}><div style={{color:C.orange,fontSize:13,marginBottom:13}}>No API key for this model.</div><button style={btn("fill")} onClick={onKey} className="hov">+ Add key</button></div>):(
          <>
            <div style={{marginBottom:9}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>PROMPT</div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} style={{...inp,height:68,resize:"vertical"}}/></div>
            <button style={{...btn("fill"),width:"100%",justifyContent:"center",marginBottom:12}} onClick={run} disabled={loading} className="hov">{loading?"Generating…":"▶ Run"}</button>
            {resp&&<div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:7,padding:13,fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:240,overflow:"auto",marginBottom:12}}><div style={{fontSize:10.5,color:C.muted,marginBottom:5}}>RESPONSE</div>{resp}</div>}
          </>
        )}
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:7,padding:11}}>
          <div style={{fontSize:10.5,color:C.muted,marginBottom:5}}>QUICK SNIPPET</div>
          <pre style={{fontSize:11,color:"#7c9af4",overflow:"auto",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{`fetch("${m.endpoint}", {\n  method: "POST",\n  headers: { "Authorization": "Bearer YOUR_KEY" },\n  body: JSON.stringify({\n    model: "${m.model}",\n    messages: [{ role: "user", content: "..." }]\n  })\n})`}</pre>
          <button style={{...btn("line"),marginTop:7,fontSize:11}} onClick={()=>{navigator.clipboard.writeText(`fetch("${m.endpoint}",{method:"POST",headers:{"Authorization":"Bearer KEY"},body:JSON.stringify({model:"${m.model}",messages:[{role:"user",content:"..."}]})})`).catch(()=>{});toastFn?.("Copied!");}} className="hov">Copy</button>
        </div>
      </div>
    </div>
  );
}

function KeyModal({model:m,apiKeys,setApiKeys,onClose}) {
  const [val,setVal]=useState(apiKeys[m.id]||"");
  const save=()=>{if(!val.trim())return;setApiKeys(p=>({...p,[m.id]:val.trim()}));toastFn?.(`Key saved for ${m.name}`);onClose();};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...card,width:"100%",maxWidth:450,padding:24}}>
        <div style={{...fl(0,"center","space-between"),marginBottom:16}}><div style={{fontWeight:700,fontSize:15,color:C.text}}>Add key — {m.name}</div><button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:17}} onClick={onClose}>✕</button></div>
        <div style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:7,padding:"8px 12px",fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.7}}>🔐 Stored in localStorage only — never leaves your browser.</div>
        <div style={{marginBottom:11}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Env key: <span style={{color:C.orangeL}}>{m.envKey}</span></div><input type="password" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder={`sk-… or your ${m.envKey}`} style={inp}/></div>
        <div style={{fontSize:11.5,color:C.muted,marginBottom:14}}>Get your key at: <a href={m.docsUrl} target="_blank" rel="noreferrer" style={{color:C.orange}}>{m.docsUrl} ↗</a></div>
        <div style={fl(7)}><button style={{...btn("fill"),flex:1,justifyContent:"center"}} onClick={save} className="hov">Save key</button><button style={btn("line")} onClick={onClose} className="hov">Cancel</button></div>
      </div>
    </div>
  );
}
