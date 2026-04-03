"use client";
import React from 'react';
import { DottedSurface } from "@/components/ui/dotted-surface";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import LoginPage from "@/components/ui/gaming-login";
import { RobotModel } from "@/components/ui/robot-model";

// Custom Card Component for Navy-Light Design System
const GlassCard = ({ children, className = "", borderAccent = "" }) => (
  <div className={`
    bg-white/80 backdrop-blur-xl 
    border border-[#003459]/10 rounded-xl 
    hover:border-[#000000]/50 transition-all duration-300
    p-6 ${className} ${borderAccent}
    shadow-[0_8px_30px_rgb(0,52,89,0.04)]
  `}>
    {children}
  </div>
);

export default function ZenOLandingPage() {
  const [showPopup, setShowPopup] = React.useState(false);

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <LoginPage.VideoBackground videoUrl="/hackbyte-bg.mp4" />

          <div className="relative z-20 w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
            <LoginPage.LoginForm
              onSubmit={(email, password, remember) => {
                console.log('Login attempt:', { email, password, remember });
                setShowPopup(false);
              }}
              onClose={() => setShowPopup(false)}
            />
          </div>

          <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
            © 2026 Stellar State. All rights reserved.
          </footer>
        </div>
      )}

      {/* All page content */}
      <div className="relative min-h-screen text-[#00171f] selection:bg-[#000000]/30">

        {/* 1. Navbar */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#faf9f6]/70 border-b border-[#003459]/10">
          <div className="px-6 lg:px-12 h-16 flex items-center justify-between">
            <div className="text-2xl font-bold text-[#000000] tracking-tighter">
              Stellar State
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <a href="https://github.com/unknownmember4u/VeltrixLabs.git" target="_blank" rel="noopener noreferrer" className="text-[#00171f]/60 hover:text-[#00171f] transition-colors">
                GitHub
              </a>
              <button className="btn-12" onClick={() => setShowPopup(true)}>
                <span>Signup</span>
              </button>
            </div>
          </div>
        </nav>

        <main>
          {/* 2. Hero Section */}
          <section className="relative min-h-screen flex items-center py-20 px-6 overflow-hidden">
            <DottedSurface className="absolute inset-0 z-0" />

            <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-16">

              {/* Left Column: Text & CTA */}
              <div className="flex flex-col items-start justify-center text-left select-none cursor-default">
                <h1 className="text-5xl md:text-7xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-8 text-[#00171f] leading-[1.1]">
                  Your Factory, Running at the <br className="hidden xl:block" /> Speed of Thought
                </h1>

                <p className="text-lg md:text-xl text-[#00171f]/70 max-w-2xl mb-12">
                  India&apos;s 63 million factories still run on WhatsApp alerts and gut instinct. changes that - real-time AI-powered factory orchestration. <br className="hidden xl:block" />
                  <span className="text-[#000000] font-semibold">Stellar-State</span> — real-time AI-powered factory orchestration.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
                  <a href="#features" className="px-8 py-4 bg-[#000000] hover:bg-[#333333] text-white font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto text-center shadow-[0_10px_25px_rgba(0,0,0,0.25)]">
                    See How It Works
                  </a>
                  <a href="https://github.com/unknownmember4u/VeltrixLabs.git" className="px-8 py-4 border border-[#003459]/10 hover:border-[#000000]/50 text-[#00171f] font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto bg-white/50 backdrop-blur-sm text-center">
                    View on GitHub
                  </a>
                </div>

                <div className="flex flex-wrap justify-start gap-4">
                  {["< 5ms Latency", "90% Cost Reduction", "100% On-Premises AI"].map((stat) => (
                    <div key={stat} className="px-4 py-2 bg-white/60 border border-[#003459]/10 rounded-full text-[#00171f]/60 text-sm shadow-sm backdrop-blur-sm border-white/20">
                      {stat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3D Model */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* A subtle glow behind the robot to make it pop against the dotted grid */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full filter blur-[100px] z-0 animate-pulse duration-1000" />
                <RobotModel className="z-10" />
              </div>
            </div>
          </section>

          {/* 3. Problem Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]">The Factory Floor is Broken</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "High Latency", desc: "200–800ms sensor to dashboard, faults detected too late" },
                { title: "Reactive Maintenance", desc: "breakdowns after damage, ₹2–5L loss per incident" },
                { title: "No Edge AI", desc: "cloud AI means factory data leaves premises, privacy risk" },
                { title: "Manual Supply Chain", desc: "humans check stock, stockouts halt production 12–48hrs" },
                { title: "No Real-Time Sync", desc: "operators see different states, conflicting decisions" },
                { title: "Unaffordable Automation", desc: "enterprise SCADA costs ₹50L+, MSMEs locked out" },
              ].map((problem, i) => (
                <GlassCard key={i} borderAccent="border-l-2 border-l-red-500/50 bg-white">
                  <h3 className="text-[#00171f] font-bold mb-2">{problem.title}</h3>
                  <p className="text-[#00171f]/60 text-sm">{problem.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* 4. Core Insight Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[#000000]">We Eliminated the API Layer Entirely</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              {/* Traditional */}
              <GlassCard borderAccent="border-red-500/20 bg-red-50/50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[#00171f]/40 font-mono text-sm">Traditional</span>
                  <span className="text-red-500 text-sm font-bold">200ms+</span>
                </div>
                <div className="flex flex-col gap-4 items-center">
                  <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-[#00171f]/70 shadow-sm">Sensor</div>
                  <div className="text-[#00171f]/20 text-xs text-center">↓ MQTT</div>
                  <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-[#00171f]/70 shadow-sm">REST API / Backend</div>
                  <div className="text-[#00171f]/20 text-xs text-center">↓ SQL / Polling</div>
                  <div className="w-full p-3 bg-white border border-red-500/20 rounded-lg text-center text-sm text-[#00171f]/70 shadow-sm">Dashboard</div>
                </div>
              </GlassCard>

              {/* Stellar State Architecture Visualization */}
              <GlassCard borderAccent="border-[#000000]/30 bg-[#000000]/[0.02] shadow-[0_10px_40px_rgba(0,52,89,0.05)]">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[#000000] font-mono text-xs tracking-widest uppercase opacity-70">Architecture</span>
                  <span className="text-[#000000] text-sm font-bold bg-white/50 px-2 py-1 rounded border border-black/5">&lt; 5ms</span>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {/* Sensor Node */}
                  <div className="w-full py-4 px-6 bg-white border border-[#000000]/10 rounded-xl text-center font-bold text-[#00171f] shadow-sm transform transition-transform hover:scale-[1.02] duration-300">
                    IoT Sensor Network
                  </div>

                  {/* Connection Arrow */}
                  <div className="flex flex-col items-center -my-2">
                    <div className="w-px h-8 bg-gradient-to-b from-[#000000]/20 to-[#000000]"></div>
                    <div className="text-xs font-bold text-[#000000]">DIRECT</div>
                  </div>

                  {/* Central Reducer */}
                  <div className="w-full py-8 px-6 bg-[#000000] text-white rounded-2xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-1">Compute Core</div>
                      <div className="font-bold text-lg">SpacetimeDB Reducer</div>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="grid grid-cols-3 gap-3 w-full mt-2">
                    {["Client A", "Client B", "Client C"].map((client) => (
                      <div key={client} className="py-3 px-1 bg-white border border-[#000000]/10 rounded-lg text-center text-[10px] md:text-xs text-[#000000] font-bold shadow-sm hover:border-black/30 transition-colors">
                        {client}
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            <blockquote className="text-2xl md:text-3xl font-medium text-[#00171f]/80 italic">
              &quot;The database is the backend. The database is the application.&quot;
            </blockquote>
          </section>

          {/* 5. Features Section */}
          <section id="features" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]">8 Features. All Live. No Vaporware.</h2>
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
                  <div className="text-[#000000] font-mono text-sm mb-3 font-bold">{f.n}</div>
                  <h3 className="text-[#00171f] font-bold mb-2">{f.t}</h3>
                  <p className="text-[#00171f]/60 text-sm">{f.d}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* 6. Architecture Section */}
          <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]">Architecture Built Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "World State", tech: "SpacetimeDB (Rust WASM)", desc: "all factory logic as reducers inside the DB, no API server" },
                { label: "Edge AI", tech: "Ollama + Mistral + LLaVA", desc: "runs on-premises, no data leaves the building" },
                { label: "Operator Interface", tech: "Next.js + SDK", desc: "zero REST calls, pure WebSocket subscriptions" },
                { label: "Infrastructure", tech: "Vultr + Docker + Nginx", desc: "2 VPS nodes, one for core, one for AI edge" },
              ].map((a, i) => (
                <GlassCard key={i} className="flex flex-col h-full bg-white">
                  <span className="text-[#333333] text-xs font-bold uppercase tracking-widest mb-2">{a.label}</span>
                  <h3 className="text-[#00171f] font-bold mb-3">{a.tech}</h3>
                  <p className="text-[#00171f]/60 text-sm mt-auto">{a.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* 7. Pricing Section */}
          <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]">Finally, Automation an MSME Can Afford</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <GlassCard borderAccent="border-red-500/20 bg-white">
                <h3 className="text-xl font-bold mb-6 text-[#00171f]/40 uppercase tracking-tighter">Enterprise SCADA</h3>
                <ul className="space-y-4 mb-8">
                  {["₹50L+ setup cost", "₹5L+/month maintenance", "Vendor lock-in", "Proprietary hardware needed"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[#00171f]/50 text-sm md:text-base">
                      <span className="text-red-500 font-bold">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>

              <GlassCard borderAccent="border-[#000000]/50 bg-white shadow-[0_15px_45px_rgb(0,52,89,0.06)]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#00171f] mb-2">Stellar State</h3>
                    <div className="text-[#000000] font-bold text-4xl">₹12,400<span className="text-sm font-normal text-[#00171f]/40">/month</span></div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className="bg-[#000000] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg shadow-[#000000]/20">Recommended</span>
                    <span className="text-green-600 text-[10px] uppercase font-bold px-3 py-1 bg-green-50 rounded-full border border-green-200">Coming Soon</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {["₹0 setup (MIT open-source)", "Commodity hardware (PC/NUC)", "Full ownership of data", "100% On-premises security"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[#00171f]/80 text-sm md:text-base font-medium">
                      <span className="text-[#000000] font-bold text-lg">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {["VPS Core $48/mo", "AI Edge Node $96/mo", "Object Storage $5/mo"].map((infra) => (
                <div key={infra} className="px-3 py-2 bg-white border border-[#003459]/10 rounded-lg text-[#00171f]/60 text-[10px] md:text-xs shadow-sm">
                  {infra}
                </div>
              ))}
              <div className="px-3 py-2 bg-[#000000]/10 border border-[#000000]/30 rounded-lg text-[#000000] text-[10px] md:text-xs font-bold shadow-sm">
                Total: $149/mo
              </div>
            </div>
          </section>

          {/* 8. Tech Stack Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]/30 uppercase tracking-tighter">Built on Serious Technology</h2>
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
                <div key={i} className="group px-6 py-3 bg-white border border-[#003459]/10 rounded-2xl hover:border-[#000000]/50 hover:shadow-md transition-all cursor-default shadow-sm active:scale-95">
                  <div className="text-[#00171f] font-bold group-hover:text-[#000000] transition-colors">{tech.n}</div>
                  <div className="text-[10px] text-[#00171f]/40 uppercase tracking-tighter group-hover:text-[#00171f]/60 transition-colors">{tech.r}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* 9. Footer */}
        <footer className="py-20 border-t border-[#003459]/10 bg-[#faf9f6]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 text-left">
            <div className="text-3xl font-bold text-[#000000] mb-4 tracking-tighter">Stellar State</div>
            <p className="text-[#00171f]/60 mb-8 max-w-md text-sm">Zero-Latency Edge Orchestrator | HackByte 4.0</p>
            <div className="h-px w-24 bg-[#000000]/30 mb-8"></div>
            <p className="text-[#00171f]/40 text-sm">
              Open-source under MIT License. <br className="md:hidden" /> Any factory in India can deploy this tomorrow.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}