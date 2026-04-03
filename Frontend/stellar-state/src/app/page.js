"use client";
import React from 'react';
import { DottedSurface } from "@/components/ui/dotted-surface";

// Custom Card Component for Glassmorphism
const GlassCard = ({ children, className = "", borderAccent = "" }) => (
  <div className={`
    bg-white/80 backdrop-blur-xl 
    border border-zinc-200 rounded-xl 
    hover:border-emerald-500/50 transition-all duration-300
    p-6 ${className} ${borderAccent}
    shadow-[0_8px_30px_rgb(0,0,0,0.04)]
  `}>
    {children}
  </div>
);

export default function ZenOLandingPage() {
  return (
    <div className="relative min-h-screen bg-[#faf9f6] text-zinc-900 selection:bg-emerald-500/30">
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200">
        <div className="px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-500 tracking-tighter">
            Zen-O
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="https://github.com" className="text-zinc-600 hover:text-zinc-900 transition-colors">GitHub</a>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 shadow-md shadow-emerald-500/20">
              Demo Signup
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-6 max-w-7xl mx-auto text-center">
          <DottedSurface />

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-zinc-900 leading-[1.1]">
            Your Factory, Running at the <br className="hidden md:block" /> Speed of Thought
          </h1>

          <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mb-12">
            India ke 63 million factories abhi bhi WhatsApp alerts pe chal rahe hain. <br className="hidden md:block" />
            <span className="text-zinc-900 font-semibold">Zen-O isko badalta hai</span> — real-time AI-powered factory orchestration, sirf ₹12,400/month mein.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <a href="#features" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto text-center shadow-lg shadow-emerald-500/20">
              See How It Works
            </a>
            <a href="https://github.com" className="px-8 py-4 border border-zinc-200 hover:border-emerald-500/50 text-zinc-900 font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto bg-white/50 backdrop-blur-sm text-center">
              View on GitHub
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {["< 5ms Latency", "90% Cost Reduction", "100% On-Premises AI"].map((stat) => (
              <div key={stat} className="px-4 py-2 bg-white/60 border border-zinc-200 rounded-full text-zinc-600 text-sm shadow-sm">
                {stat}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Problem Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-900">The Factory Floor is Broken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "High Latency", desc: "200–800ms sensor to dashboard, faults detected too late" },
              { title: "Reactive Maintenance", desc: "breakdowns after damage, ₹2–5L loss per incident" },
              { title: "No Edge AI", desc: "cloud AI means factory data leaves premises, privacy risk" },
              { title: "Manual Supply Chain", desc: "humans check stock, stockouts halt production 12–48hrs" },
              { title: "No Real-Time Sync", desc: "operators see different states, conflicting decisions" },
              { title: "Unaffordable Automation", desc: "enterprise SCADA costs ₹50L+, MSMEs locked out" },
            ].map((problem, i) => (
              <GlassCard key={i} borderAccent="border-l-2 border-l-red-500 bg-white">
                <h3 className="text-zinc-900 font-bold mb-2">{problem.title}</h3>
                <p className="text-zinc-600 text-sm">{problem.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 4. Core Insight Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-emerald-600">We Eliminated the API Layer Entirely</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Traditional */}
            <GlassCard borderAccent="border-red-500/20 bg-red-500/[0.01]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 font-mono text-sm">Traditional</span>
                <span className="text-red-500 text-sm font-bold">200ms+</span>
              </div>
              <div className="flex flex-col gap-4 items-center">
                <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-zinc-700 shadow-sm">Sensor</div>
                <div className="text-zinc-400 text-xs text-center">↓ MQTT</div>
                <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-zinc-700 shadow-sm">REST API / Backend</div>
                <div className="text-zinc-400 text-xs text-center">↓ SQL / Polling</div>
                <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-zinc-700 shadow-sm">Dashboard</div>
              </div>
            </GlassCard>

            {/* Zen-O */}
            <GlassCard borderAccent="border-emerald-500/30 bg-emerald-500/[0.02]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-emerald-600 font-mono text-sm">Zen-O</span>
                <span className="text-emerald-600 text-sm font-bold">&lt; 5ms</span>
              </div>
              <div className="flex flex-col gap-4 items-center h-full justify-center">
                <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center font-bold text-emerald-900 shadow-sm">Sensor</div>
                <div className="animate-bounce text-emerald-500 text-center">↓</div>
                <div className="w-full p-6 bg-emerald-500 text-white rounded-xl text-center font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  SpacetimeDB Reducer
                </div>
                <div className="flex justify-between w-full mt-2">
                  <div className="flex-1 px-2 py-1 bg-white border border-emerald-500/20 rounded text-center text-xs text-emerald-700 text-[10px] md:text-xs shadow-sm">Client A</div>
                  <div className="flex-1 px-2 py-1 bg-white border border-emerald-500/20 rounded mx-2 text-center text-xs text-emerald-700 text-[10px] md:text-xs shadow-sm">Client B</div>
                  <div className="flex-1 px-2 py-1 bg-white border border-emerald-500/20 rounded text-center text-xs text-emerald-700 text-[10px] md:text-xs shadow-sm">Client C</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="text-center">
            <blockquote className="text-2xl md:text-3xl font-medium text-zinc-700 italic">
              "The database is the backend. The database is the application."
            </blockquote>
          </div>
        </section>

        {/* 5. Features Section */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-900">8 Features. All Live. No Vaporware.</h2>
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
              <GlassCard key={i} className="bg-white">
                <div className="text-emerald-500 font-mono text-sm mb-3">{f.n}</div>
                <h3 className="text-zinc-900 font-bold mb-2">{f.t}</h3>
                <p className="text-zinc-600 text-sm">{f.d}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 6. Architecture Section */}
        <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-900">Architecture Built Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "World State", tech: "SpacetimeDB (Rust WASM)", desc: "all factory logic as reducers inside the DB, no API server" },
              { label: "Edge AI", tech: "Ollama + Mistral + LLaVA", desc: "runs on-premises, no data leaves the building" },
              { label: "Operator Interface", tech: "Next.js + SDK", desc: "zero REST calls, pure WebSocket subscriptions" },
              { label: "Infrastructure", tech: "Vultr + Docker + Nginx", desc: "2 VPS nodes, one for core, one for AI edge" },
            ].map((a, i) => (
              <GlassCard key={i} className="flex flex-col h-full bg-white">
                <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-2">{a.label}</span>
                <h3 className="text-zinc-900 font-bold mb-3">{a.tech}</h3>
                <p className="text-zinc-600 text-sm mt-auto">{a.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 7. Pricing Section */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-900">Finally, Automation an MSME Can Afford</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <GlassCard borderAccent="border-red-500/20 bg-white">
              <h3 className="text-xl font-bold mb-6 text-zinc-900">Enterprise SCADA</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-zinc-600 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> ₹50L+ setup cost
                </li>
                <li className="flex items-center gap-3 text-zinc-600 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> ₹5L+/month maintenance
                </li>
                <li className="flex items-center gap-3 text-zinc-600 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> Vendor lock-in
                </li>
                <li className="flex items-center gap-3 text-zinc-600 text-sm md:text-base">
                  <span className="text-red-500 text-lg">✕</span> Proprietary hardware needed
                </li>
              </ul>
            </GlassCard>

            <GlassCard borderAccent="border-emerald-500/50 bg-emerald-50/[0.5]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Zen-O</h3>
                  <div className="text-emerald-600 font-bold text-3xl">₹12,400<span className="text-sm font-normal text-zinc-500">/month</span></div>
                </div>
                <span className="bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Recommended</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-zinc-700 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> ₹0 setup (MIT open-source)
                </li>
                <li className="flex items-center gap-3 text-zinc-700 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> Commodity hardware (PC/NUC)
                </li>
                <li className="flex items-center gap-3 text-zinc-700 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> Full ownership of data
                </li>
                <li className="flex items-center gap-3 text-zinc-700 text-sm md:text-base">
                  <span className="text-emerald-500 text-lg">✓</span> 100% On-premises security
                </li>
              </ul>
            </GlassCard>
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {["VPS Core $48/mo", "AI Edge Node $96/mo", "Object Storage $5/mo"].map((infra) => (
              <div key={infra} className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 text-[10px] md:text-xs shadow-sm">
                {infra}
              </div>
            ))}
            <div className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 border border-emerald-500/20 rounded-lg text-emerald-700 text-[10px] md:text-xs font-bold shadow-sm">
              Total: $149/mo
            </div>
          </div>
        </section>

        {/* 8. Tech Stack Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-500 uppercase tracking-tighter">Built on Serious Technology</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { n: "SpacetimeDB", r: "Real-time Engine" },
              { n: "Rust WASM", r: "Computation" },
              { n: "Next.js 14", r: "Interface" },
              { n: "Tailwind CSS", r: "Design System" },
              { n: "Ollama", r: "AI Runtime" },
              { n: "Mistral 7B", r: "Logic LLM" },
              { n: "LLaVA 7B", r: "Vision LLM" },
              { n: "Python Flask", r: "Orchestrator" },
              { n: "ChromaDB", r: "Vector Memory" },
              { n: "sentence-transformers", r: "Embeddings" },
              { n: "Vultr", r: "Cloud Nodes" },
              { n: "Docker", r: "Containment" },
              { n: "Nginx", r: "Routing" },
            ].map((tech, i) => (
              <div key={i} className="group px-6 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all cursor-default shadow-sm">
                <div className="text-zinc-900 font-bold group-hover:text-emerald-600 transition-colors">{tech.n}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-tighter group-hover:text-zinc-600 transition-colors">{tech.r}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="py-20 border-t border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-left">
          <div className="text-3xl font-bold text-emerald-500 mb-4 tracking-tighter">Zen-O</div>
          <p className="text-zinc-500 mb-8 max-w-md text-sm">Zero-Latency Edge Orchestrator | HackByte 4.0</p>
          <div className="h-px w-24 bg-emerald-500/30 mb-8"></div>
          <p className="text-zinc-400 text-sm">
            Open-source under MIT License. <br className="md:hidden" /> Any factory in India can deploy this tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
}
