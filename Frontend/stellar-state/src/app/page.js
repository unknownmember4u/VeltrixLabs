// src/app/page.js
"use client";

import React from 'react';
import { DottedSurface } from "@/components/ui/dotted-surface";
import { Card } from "@/components/ui/Card";
import { FadeUp } from "@/components/ui/FadeUp";
import { CountUp } from "@/components/ui/CountUp";

export default function StellarStateLandingPage() {
  return (
    <>
      {/* Background 3D Surface */}
      <DottedSurface />

      {/* Main Container - Elevated above the fixed 3D surface */}
      <div className="relative min-h-screen text-white selection:bg-[#00a8e8]/30" style={{ zIndex: 1 }}>

        {/* ── Fixed Navbar ── */}
        <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/40 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
          <div className="px-6 lg:px-12 h-20 flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-2xl font-serif italic font-bold text-white tracking-widest">
              STELLAR<span className="text-[#00a8e8] font-sans not-italic">STATE</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium tracking-wide">
              <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a>
              <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300">
                Demo Portal
              </button>
            </div>
          </div>
        </nav>

        <main>
          {/* ── Hero Section ── */}
          <section className="min-h-screen flex items-center px-8 md:px-16 lg:px-24 max-w-7xl mx-auto pt-32 pb-16">
            <div className="max-w-3xl">
              <FadeUp delay={100}>
                <span className="text-[#00a8e8] font-mono text-sm tracking-[0.3em] uppercase mb-6 block">
                  Industry 4.0 Orchestration
                </span>
              </FadeUp>
              
              <FadeUp delay={200}>
                <h1 className="text-6xl md:text-8xl font-serif font-bold leading-[1.05] tracking-tight mb-8 text-white">
                  Your Factory,<br />
                  <span className="text-white/70 italic font-medium">at the Speed of Thought.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={300}>
                <p className="text-xl md:text-2xl text-white/50 max-w-2xl mb-12 leading-relaxed">
                  The zero-latency edge operating system for MSMEs. <br className="hidden md:block" />
                  Real-time AI orchestration for just ₹12,400/month.
                </p>
              </FadeUp>
              
              <FadeUp delay={400} className="flex flex-col sm:row gap-6">
                <button className="px-10 py-5 bg-[#00a8e8] hover:bg-[#007ea7] text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_20px_50px_rgba(0,168,232,0.3)] hover:-translate-y-1">
                  Launch Orchestrator
                </button>
                <div className="flex items-center gap-12 pt-12 border-t border-white/5 mt-12 w-fit">
                   <div className="flex flex-col">
                      <span className="text-4xl font-serif font-bold italic">
                        <CountUp target={63} suffix="M+" />
                      </span>
                      <span className="text-xs text-white/40 uppercase tracking-widest mt-1">Target MSMEs</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-4xl font-serif font-bold italic">
                        &lt;<CountUp target={5} suffix="ms" duration={1000} />
                      </span>
                      <span className="text-xs text-white/40 uppercase tracking-widest mt-1">Edge Latency</span>
                   </div>
                </div>
              </FadeUp>
            </div>
          </section>

          {/* ── Features Section ── */}
          <section id="features" className="py-32 px-8 max-w-7xl mx-auto">
            <FadeUp>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-16 text-center">
                Built Different. <span className="text-white/40 italic">Run Everywhere.</span>
              </h2>
            </FadeUp>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { t: "Live World-State", d: "SpacetimeDB pushes state to all operators in <5ms. No REST, no delay." },
                { t: "Predictive Maintenance", d: "AI RAG reads PDF manuals to give exact fixes before breakdowns occur." },
                { t: "Autonomous Flow", d: "Auto-generates POs when stock drops below 5%. Humans only audit." },
                { t: "Visual Inspection", d: "Thermal Edge AI detects overheating and wear via on-prem LLMs." },
                { t: "What-If Simulation", d: "Simulate parameter changes on branched states before applying to live floor." },
                { t: "SHA-256 Audit Chain", d: "A cryptographically intact ledger of every factory event, forever." },
              ].map((f, i) => (
                <FadeUp key={i} delay={i * 100}>
                  <Card className="h-full">
                    <h3 className="text-2xl font-serif font-bold mb-4 italic text-white/90">{f.t}</h3>
                    <p className="text-white/50 leading-relaxed">{f.d}</p>
                    <div className="mt-8 text-[#00a8e8] font-mono text-[10px] tracking-widest uppercase">
                      Module Status: Active
                    </div>
                  </Card>
                </FadeUp>
              ))}
            </div>
          </section>

          {/* ── Pricing Section ── */}
          <section id="pricing" className="py-32 px-8 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <FadeUp>
                  <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8 italic">
                    MSME Scale Pricing.
                  </h2>
                  <p className="text-xl text-white/50 mb-12 leading-relaxed">
                    We've eliminated the backend server cost and the API layer complexity. 
                    You pay for compute, not proprietary licenses.
                  </p>
                </FadeUp>
              </div>
              
              <div className="lg:w-1/2 w-full">
                <FadeUp delay={200}>
                  <Card className="bg-[#0a0a0a]/60 border-[#00a8e8]/30 shadow-[0_30px_100px_rgba(0,168,232,0.1)] p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                      <span className="text-[#00a8e8] text-[10px] font-mono tracking-widest uppercase">Cloud Managed</span>
                    </div>
                    <div className="mb-12">
                      <h3 className="text-2xl font-serif mb-2 italic">Essential Tier</h3>
                      <div className="text-6xl font-serif font-bold mb-4">
                        ₹12,400<span className="text-lg font-normal text-white/30">/mo</span>
                      </div>
                      <p className="text-white/40">Full orchestrator suite + 3 Edge Nodes</p>
                    </div>
                    
                    <ul className="space-y-4 mb-12">
                      {["SpacetimeDB Cloud Sync", "Ollama LLaVA Integration", "SHA-256 Audit Logging", "24/7 Edge Support"].map((li, i) => (
                        <li key={i} className="flex items-center gap-4 text-white/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e8]" />
                          {li}
                        </li>
                      ))}
                    </ul>
                    
                    <button className="w-full py-5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all duration-300">
                      Get Started Now
                    </button>
                  </Card>
                </FadeUp>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="py-20 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:row justify-between items-center gap-8">
            <div className="text-2xl font-serif italic font-bold">
              STELLAR<span className="text-[#00a8e8] font-sans not-italic">STATE</span>
            </div>
            <div className="text-white/20 text-xs font-mono uppercase tracking-[0.2em]">
              © 2026 HackByte 4.0 | Zero Latency Labs
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
