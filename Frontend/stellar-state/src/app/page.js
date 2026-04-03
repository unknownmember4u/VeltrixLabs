"use client";
import React from 'react';

// Custom Card Component for Glassmorphism
const GlassCard = ({ children, className = "", borderAccent = "" }) => (
  <div className={`
    bg-[#111111]/70 backdrop-blur-xl 
    border border-[#1f1f1f] rounded-xl 
    hover:border-emerald-500/50 transition-all duration-300
    p-6 ${className} ${borderAccent}
  `}>
    {children}
  </div>
);

export default function ZenOLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-emerald-500/30">
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/60 border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-400 tracking-tighter">
            Zen-O
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="https://github.com" className="text-zinc-400 hover:text-white transition-colors">GitHub</a>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs">
              HackByte 4.0
            </span>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center py-20 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            &lt; 5ms Latency
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-[1.1]">
            Your Factory, Running at the <br className="hidden md:block" /> Speed of Thought
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-12">
            India ke 63 million factories abhi bhi WhatsApp alerts pe chal rahe hain. <br className="hidden md:block" />
            <span className="text-zinc-200">Zen-O isko badalta hai</span> — real-time AI-powered factory orchestration, sirf ₹12,400/month mein.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <a href="#features" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto text-center">
              See How It Works
            </a>
            <a href="https://github.com" className="px-8 py-4 border border-[#1f1f1f] hover:border-emerald-500/50 text-white font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto bg-white/5 backdrop-blur-sm text-center">
              View on GitHub
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {["< 5ms Latency", "90% Cost Reduction", "100% On-Premises AI"].map((stat) => (
              <div key={stat} className="px-4 py-2 bg-[#111111]/50 border border-[#1f1f1f] rounded-full text-zinc-400 text-sm">
                {stat}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Problem Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">The Factory Floor is Broken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "High Latency", desc: "200–800ms sensor to dashboard, faults detected too late" },
              { title: "Reactive Maintenance", desc: "breakdowns after damage, ₹2–5L loss per incident" },
              { title: "No Edge AI", desc: "cloud AI means factory data leaves premises, privacy risk" },
              { title: "Manual Supply Chain", desc: "humans check stock, stockouts halt production 12–48hrs" },
              { title: "No Real-Time Sync", desc: "operators see different states, conflicting decisions" },
              { title: "Unaffordable Automation", desc: "enterprise SCADA costs ₹50L+, MSMEs locked out" },
            ].map((problem, i) => (
              <GlassCard key={i} borderAccent="border-l-2 border-l-red-500">
                <h3 className="text-white font-bold mb-2">{problem.title}</h3>
                <p className="text-zinc-400 text-sm">{problem.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 4. Core Insight Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-emerald-400">We Eliminated the API Layer Entirely</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Traditional */}
            <GlassCard borderAccent="border-red-500/20">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 font-mono text-sm">Traditional</span>
                <span className="text-red-400 text-sm font-bold">200ms+</span>
              </div>
              <div className="flex flex-col gap-4 items-center">
                <div className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-center text-sm text-zinc-400">Sensor</div>
                <div className="text-zinc-600 text-xs text-center">↓ MQTT</div>
                <div className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-center text-sm text-zinc-400">REST API / Backend</div>
                <div className="text-zinc-600 text-xs text-center">↓ SQL / Polling</div>
                <div className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-center text-sm text-zinc-400">Dashboard</div>
              </div>
            </GlassCard>

            {/* Zen-O */}
            <GlassCard borderAccent="border-emerald-500/30 bg-emerald-500/[0.02]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-emerald-400 font-mono text-sm">Zen-O</span>
                <span className="text-emerald-400 text-sm font-bold">&lt; 5ms</span>
              </div>
              <div className="flex flex-col gap-4 items-center h-full justify-center">
                <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center font-bold text-white">Sensor</div>
                <div className="animate-bounce text-emerald-500 text-center">↓</div>
                <div className="w-full p-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-emerald-300 font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  SpacetimeDB Reducer
                </div>
                <div className="flex justify-between w-full mt-2">
                  <div className="flex-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-center text-xs text-emerald-400 text-[10px] md:text-xs">Client A</div>
                  <div className="flex-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded mx-2 text-center text-xs text-emerald-400 text-[10px] md:text-xs">Client B</div>
                  <div className="flex-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-center text-xs text-emerald-400 text-[10px] md:text-xs">Client C</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="text-center">
            <blockquote className="text-2xl md:text-3xl font-medium text-zinc-300 italic">
              "The database is the backend. The database is the application."
            </blockquote>
          </div>
        </section>

        {/* 5. Features Section */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">8 Features. All Live. No Vaporware.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Live World-State", d: "SpacetimeDB pushes to all operators in <5ms" },
              { n: "02", t: "AI Visual Inspection", d: "LLaVA detects overheating and wear, fully on-premises" },
              { n: "03", t: "Predictive Maintenance", d: "RAG reads your PDF manuals, gives exact fix with part numbers" },
              { n: "04", t: "Autonomous Supply Chain", d: "auto-generates POs when stock drops below 5%" },
              { n: "05", t: "What-If Simulation", d: "test parameter changes on a branched state before going live" },
              { n: "06", t: "Tamper-Evident Audit", d: "SHA-256 hash-chained, append-only, legally defensible" },
              { n: "07", t: "Multi-Operator Collaboration", d: "all operators see identical state, conflict-free" },
              { n: "08", t: "Energy Intelligence", d: "AI detects which robots burn excess power and why" },
            ].map((f, i) => (
              <GlassCard key={i}>
                <div className="text-emerald-500 font-mono text-sm mb-3">{f.n}</div>
                <h3 className="font-bold mb-2">{f.t}</h3>
                <p className="text-zinc-400 text-sm">{f.d}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 6. Architecture Section */}
        <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Architecture Built Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "World State", tech: "SpacetimeDB (Rust WASM)", desc: "all factory logic as reducers inside the DB, no API server" },
              { label: "Edge AI", tech: "Ollama + Mistral + LLaVA", desc: "runs on-premises, no data leaves the building" },
              { label: "Operator Interface", tech: "Next.js + SDK", desc: "zero REST calls, pure WebSocket subscriptions" },
              { label: "Infrastructure", tech: "Vultr + Docker + Nginx", desc: "2 VPS nodes, one for core, one for AI edge" },
            ].map((a, i) => (
              <GlassCard key={i} className="flex flex-col h-full">
                <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-2">{a.label}</span>
                <h3 className="font-bold mb-3">{a.tech}</h3>
                <p className="text-zinc-400 text-sm mt-auto">{a.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 7. Pricing Section */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Finally, Automation an MSME Can Afford</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <GlassCard borderAccent="border-red-500/20">
              <h3 className="text-xl font-bold mb-6 text-zinc-300">Enterprise SCADA</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-zinc-500 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> ₹50L+ setup cost
                </li>
                <li className="flex items-center gap-3 text-zinc-500 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> ₹5L+/month maintenance
                </li>
                <li className="flex items-center gap-3 text-zinc-500 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> Vendor lock-in
                </li>
                <li className="flex items-center gap-3 text-zinc-500 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> Proprietary hardware needed
                </li>
              </ul>
            </GlassCard>

            <GlassCard borderAccent="border-emerald-500/50 bg-emerald-500/[0.03]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Zen-O</h3>
                  <div className="text-emerald-400 font-bold text-3xl">₹12,400<span className="text-sm font-normal text-zinc-500">/month</span></div>
                </div>
                <span className="bg-emerald-500 text-black text-[10px] uppercase font-bold px-2 py-1 rounded">Recommended</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-zinc-300 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> ₹0 setup (MIT open-source)
                </li>
                <li className="flex items-center gap-3 text-zinc-300 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> Commodity hardware (PC/NUC)
                </li>
                <li className="flex items-center gap-3 text-zinc-300 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> Full ownership of data
                </li>
                <li className="flex items-center gap-3 text-zinc-300 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> 100% On-premises security
                </li>
              </ul>
            </GlassCard>
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {["VPS Core $48/mo", "AI Edge Node $96/mo", "Object Storage $5/mo"].map((infra) => (
              <div key={infra} className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 border border-[#1f1f1f] rounded-lg text-zinc-400 text-[10px] md:text-xs">
                {infra}
              </div>
            ))}
            <div className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] md:text-xs font-bold">
              Total: $149/mo
            </div>
          </div>
        </section>

        {/* 8. Tech Stack Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-500 uppercase tracking-tighter">Built on Serious Technology</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              {n: "SpacetimeDB", r: "Real-time Engine"},
              {n: "Rust WASM", r: "Computation"},
              {n: "Next.js 14", r: "Interface"},
              {n: "Tailwind CSS", r: "Design System"},
              {n: "Ollama", r: "AI Runtime"},
              {n: "Mistral 7B", r: "Logic LLM"},
              {n: "LLaVA 7B", r: "Vision LLM"},
              {n: "Python Flask", r: "Orchestrator"},
              {n: "ChromaDB", r: "Vector Memory"},
              {n: "sentence-transformers", r: "Embeddings"},
              {n: "Vultr", r: "Cloud Nodes"},
              {n: "Docker", r: "Containment"},
              {n: "Nginx", r: "Routing"},
            ].map((tech, i) => (
              <div key={i} className="group px-6 py-3 bg-[#111111]/50 border border-[#1f1f1f] rounded-2xl hover:border-emerald-500/30 hover:bg-[#111111] transition-all cursor-default">
                <div className="text-white font-bold group-hover:text-emerald-400 transition-colors">{tech.n}</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">{tech.r}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="py-20 border-t border-[#1f1f1f] bg-black">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-3xl font-bold text-emerald-400 mb-4 tracking-tighter">Zen-O</div>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm">Zero-Latency Edge Orchestrator | HackByte 4.0</p>
          <div className="h-px w-24 bg-emerald-500/30 mx-auto mb-8"></div>
          <p className="text-zinc-600 text-sm">
            Open-source under MIT License. <br className="md:hidden" /> Any factory in India can deploy this tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
}
