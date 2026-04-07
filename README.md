<div align="center">

```
 ╱╲  ╱╲  ╱╲
╱    ╲╱    ╲╱    ╲
```

# 🔥 OpenClaw Hub

**Every AI Model. Clawed Open.**

*Discover · Compare · Test · Deploy*

[![Live Site](https://img.shields.io/badge/Live%20Site-OpenClaw%20Hub-f97316?style=for-the-badge&logo=github)](https://adnanxmacro.github.io/openclaw-hub/)
[![Built With](https://img.shields.io/badge/Built%20With-React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![Models](https://img.shields.io/badge/Models%20Tracked-127%2B-22c55e?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Personal%20Project-f97316?style=for-the-badge)]()

<br/>

> A single unified hub for exploring open and closed AI models, comparing benchmarks,
> managing API keys, testing models live, and checking if your hardware can run them locally.

<br/>

![OpenClaw Hub Preview](https://adnanxmacro.github.io/openclaw-hub/)

</div>

---

## 📖 What is OpenClaw Hub?

OpenClaw Hub is a **personal AI model intelligence platform** built entirely client-side with React. It was born out of frustration — AI models are scattered across dozens of websites, each with different docs, different APIs, and different benchmarks. OpenClaw puts everything in one dark, fast, claw-themed interface.

No backend. No database. No tracking. Everything runs in your browser.

---

## ✨ Features

### 🗂️ Model Explorer
Browse **127+ AI models** from every major provider — OpenAI, Anthropic, Meta, Google, Mistral, DeepSeek, Alibaba, Microsoft and more. Filter by:
- **Open Source** vs **Closed / API-only**
- **Modality** — Text, Code, Vision
- **Free Tier** availability
- **Saved** models (your personal starred list)

Each model card shows real benchmark scores, parameter count, context window, cost, and a ready-to-copy API snippet.

### 🏆 Performance Leaderboard
Live rankings across three major benchmarks:
| Benchmark | What It Measures |
|-----------|-----------------|
| **MMLU** | 57-subject knowledge breadth (0–100%) |
| **HumanEval** | Python code synthesis accuracy (0–100%) |
| **MT-Bench** | Multi-turn conversation quality (0–10) |

Sort by any column. See which model truly leads on your use case.

### ▶️ Live Playground
A full multi-turn **chat interface** that fires real API calls directly to any provider. Features:
- Model selector with key status indicators
- Configurable system prompt
- Temperature slider
- Full conversation history
- Token count tracking per response

### ⊞ Side-by-Side Compare
Select up to **3 models** and compare them across every metric in a structured table — parameters, context window, pricing, benchmark scores, capabilities, and free tier availability. Best values highlighted automatically.

### ⚙️ Hardware Compatibility Checker
A unique 3-step tool that answers *"Can my PC run this model?"*

1. **Pick** the model you want to run locally
2. **Paste** your Windows "About PC" system info (Win+I → System → About)
3. Get a **personalized action plan** — exact terminal commands, quantization recommendations, Ollama setup steps, or honest advice to just use the API

Verdicts include:
- ⚡ **Runs Natively on GPU** — full speed via Ollama
- 🐢 **CPU Inference** — works but slow
- ⚙️ **Needs Quantization** — Q3/Q4 only
- ✕ **Not Feasible Locally** — use the API instead
- ☁️ **Cloud API Only** — closed model, hardware irrelevant

Also suggests alternative smaller models that actually fit your hardware.

### 🧑‍💻 User Dashboard
A personal control center organized into 4 tabs:

| Tab | Purpose |
|-----|---------|
| **API Keys** | Store keys per provider, show/hide/remove, direct links to get keys |
| **Usage Analytics** | Calls, success rate, tokens used — broken down per model with bar charts |
| **Call Logs** | Full timestamped history of every API request with status |
| **Saved Models** | Your starred model collection |

> 🔐 All API keys are stored in **localStorage only** — they never leave your device.

---

## 🤖 Supported Models

| Model | Provider | Type | Free Tier |
|-------|----------|------|-----------|
| GPT-4o | OpenAI | Closed | ✗ |
| Claude Sonnet 4 | Anthropic | Closed | ✓ |
| Llama 3.1 405B | Meta AI | Open | ✓ |
| Gemini 1.5 Pro | Google | Closed | ✓ |
| Mistral Large 2 | Mistral AI | Closed | ✗ |
| DeepSeek-V3 | DeepSeek | Open | ✓ |
| Qwen2.5-72B | Alibaba | Open | ✓ |
| Phi-4 | Microsoft | Open | ✓ |

*...and 119+ more tracked in the explorer*

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/adnanXmacro/openclaw-hub.git
cd openclaw-hub

# Install dependencies
npm install

# Drop the app component
curl -o src/App.jsx "https://raw.githubusercontent.com/adnanXmacro/openclaw-hub/main/openclaw-hub.jsx"

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

**Requirements:** Node.js 18+, npm

---

## 🏗️ Tech Stack

```
React 19          — UI framework
Vite 8            — Build tool & dev server
localStorage      — API key & usage persistence
GitHub Pages      — Hosting (static, no server)
Vanilla CSS-in-JS — Zero external UI libraries
```

No Redux. No Tailwind. No UI kit. Pure React with inline styles.

---

## 📁 Project Structure

```
openclaw-hub/
├── src/
│   ├── App.jsx        ← Entire application (single file)
│   └── main.jsx       ← Entry point
├── public/
├── vite.config.js
└── package.json
```

---

## ⚠️ Important Notices

> ### 🚫 Do Not Contribute
> This is a **personal project** and is not open for contributions.
> Please do **not** open pull requests — they will be closed without review.
> Issues may be read but are not guaranteed a response.

> ### 🔑 API Key Safety
> OpenClaw never transmits your API keys anywhere. All keys are stored in your browser's
> `localStorage` and sent **directly** to the respective AI provider's API when you run a test.
> Always keep your keys private and rotate them if you suspect exposure.

> ### 📊 Benchmark Accuracy
> Benchmark scores displayed are sourced from publicly available evaluations and may not
> reflect the absolute latest model versions. Always cross-reference with official provider leaderboards.

---

## 🌐 Live Deployment

The site is live and publicly accessible at:

```
https://adnanxmacro.github.io/openclaw-hub/
```

Hosted on **GitHub Pages** — deployed directly from Termux on Android using Vite + gh-pages.
No cloud server. No CI/CD pipeline. Just a phone and a terminal.

---

<div align="center">

---

**Built with 🔥 by**

```
 ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗
 ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝
 ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║
 ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║
 ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝

    ██████╗ ██████╗ ███╗   ██╗ █████╗ ███╗   ██╗
   ██╔══██╗██╔══██╗████╗  ██║██╔══██╗████╗  ██║
   ███████║██║  ██║██╔██╗ ██║███████║██╔██╗ ██║
   ██╔══██║██║  ██║██║╚██╗██║██╔══██║██║╚██╗██║
   ██║  ██║██████╔╝██║ ╚████║██║  ██║██║ ╚████║
   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝
```



[![projectAdnan](https://img.shields.io/badge/by-projectAdnan-f97316?style=for-the-badge)](https://github.com/adnanXmacro)

---

### ⭐ Please do NOT star this repository.

*This project is personal. Stars are appreciated as a gesture but this repo is not maintained
for public use. Save your star for something that needs the visibility.*

---

*© 2026 projectAdnan — OpenClaw Hub*

</div>
