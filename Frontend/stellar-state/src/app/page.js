"use client";
import React from 'react';
import { DottedSurface } from "@/components/ui/dotted-surface";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import LoginPage from "@/components/ui/gaming-login";
import { RobotModel } from "@/components/ui/robot-model";
import Link from "next/link";

// Custom Card Component for Navy-Light Design System
const GlassCard = ({ children, className = "", borderAccent = "" }) => (
  <div className={`
    bg-white/60 backdrop-blur-3xl 
    border border-white/60 rounded-2xl 
    hover:bg-white/80 hover:border-white/80 transition-all duration-300
    p-8 ${className} ${borderAccent}
    shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_30px_rgba(0,0,0,0.04)]
    hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_15px_40px_rgba(0,0,0,0.08)]
  `}>
    {children}
  </div>
);

// Custom Scroll Reveal Component
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const domRef = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out will-change-[opacity,transform] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function ZenOLandingPage() {
  const [showPopup, setShowPopup] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    // Normalize coordinates from -1 to 1 based on screen size
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsClosing(false);
    }, 400);
  };

  return (
    <>
      {showPopup && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-400 ease-in-out ${isClosing ? 'opacity-0' : 'animate-in fade-in duration-500'}`}>
          <LoginPage.VideoBackground videoUrl="/hackbyte-bg.mp4" />

          <div className={`relative z-20 w-full max-w-xl transition-all duration-400 ease-out ${isClosing ? 'opacity-0 scale-95 translate-y-4' : 'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500'}`}>
            <LoginPage.LoginForm 
              onSubmit={(email, password, remember) => {
                console.log('Login attempt:', { email, password, remember });
                handleClose();
              }}
              onClose={handleClose}
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
          <section onMouseMove={handleMouseMove} className="relative min-h-screen flex items-center py-20 px-6 overflow-hidden">
            <DottedSurface className="absolute inset-0 z-0" />

            <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-16">

              {/* Left Column: Text & CTA */}
              <div 
                className="flex flex-col items-start justify-center text-left select-none cursor-default transition-transform duration-700 ease-out"
                style={{ transform: `translate3d(${mousePos.x * -18}px, ${mousePos.y * -18}px, 0)` }}
              >
                <h1 className="text-5xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tighter mb-8 text-[#00171f] leading-[1.05]">
                  Your Factory,<br/> <span style={{ fontFamily: '"Playfair Display", serif' }} className="italic font-normal text-[#00171f]">Running</span> at the <br className="hidden xl:block" /> <span style={{ fontFamily: '"Playfair Display", serif' }} className="italic font-normal text-[#00171f]">Speed</span> of Thought
                </h1>

                <p className="text-lg md:text-xl text-[#00171f]/60 max-w-2xl mb-12 font-medium tracking-tight">
                  India&apos;s 63 million factories still run on WhatsApp alerts and gut instinct. <span className="text-[#000000] font-bold">Stellar-State</span> brings real-time AI-powered factory orchestration with zero API layers.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
                  <a href="#features" className="group relative px-8 py-4 bg-[#000000] hover:bg-[#222222] text-white font-bold rounded-2xl transition-all duration-300 w-full sm:w-auto text-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-2">See How It Works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  </a>
                  <a href="https://github.com/unknownmember4u/VeltrixLabs.git" className="px-8 py-4 bg-white/60 backdrop-blur-2xl border border-[#000000]/10 hover:bg-white/90 text-[#00171f] font-bold rounded-2xl transition-all duration-300 w-full sm:w-auto text-center shadow-sm hover:shadow-md hover:-translate-y-1">
                    View on GitHub
                  </a>
                </div>

                <div className="flex flex-wrap justify-start gap-3">
                  {["< 5ms Latency", "90% Cost Reduction", "100% On-Premises AI"].map((stat) => (
                    <div key={stat} className="px-4 py-2 bg-white/70 border border-white/60 rounded-full text-[#00171f] text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-md">
                      {stat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3D Model */}
              <div 
                className="relative w-full h-full flex items-center justify-center transition-transform duration-1000 ease-out"
                style={{ transform: `translate3d(${mousePos.x * 35}px, ${mousePos.y * 35}px, 0)` }}
              >
                {/* A subtle glow behind the robot to make it pop against the dotted grid */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full filter blur-[100px] z-0 animate-pulse duration-1000" />
                <RobotModel className="z-10" />
              </div>
            </div>
          </section>

          {/* 3. Problem Section */}
          <section className="relative py-24 px-6 max-w-7xl mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-400/5 rounded-full blur-[100px] -z-10 pointer-events-none delay-500 duration-1000"></div>
            <FadeIn>
              <div className="text-center mb-16">
                <span className="inline-block text-red-500 font-bold uppercase tracking-widest text-xs mb-4">The Current Reality</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#00171f]">The Factory Floor is Broken</h2>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "High Latency", desc: "200–800ms sensor to dashboard, faults detected too late" },
                { title: "Reactive Maintenance", desc: "breakdowns after damage, ₹2–5L loss per incident" },
                { title: "No Edge AI", desc: "cloud AI means factory data leaves premises, privacy risk" },
                { title: "Manual Supply Chain", desc: "humans check stock, stockouts halt production 12–48hrs" },
                { title: "No Real-Time Sync", desc: "operators see different states, conflicting decisions" },
                { title: "Unaffordable Automation", desc: "enterprise SCADA costs ₹50L+, MSMEs locked out" },
              ].map((problem, i) => (
                <FadeIn key={i} delay={i * 100} className="h-full">
                  <GlassCard className="h-full" borderAccent="border-l-2 border-l-red-500/50">
                    <h3 className="text-[#00171f] font-bold mb-2">{problem.title}</h3>
                    <p className="text-[#00171f]/60 text-sm">{problem.desc}</p>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* 4. Core Insight Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[#000000]">We Eliminated the API Layer Entirely</h2>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              {/* Traditional */}
              <FadeIn delay={100} className="h-full text-left">
                <GlassCard className="h-full" borderAccent="border-red-500/20 bg-red-50/50">
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
              </FadeIn>

              {/* Stellar State Architecture Visualization */}
              <FadeIn delay={200} className="h-full text-left">
                <GlassCard className="h-full" borderAccent="border-[#000000]/30 bg-[#000000]/[0.02] shadow-[0_10px_40px_rgba(0,52,89,0.05)]">
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
              </FadeIn>
            </div>

            <FadeIn delay={400}>
              <blockquote className="text-2xl md:text-3xl font-medium text-[#00171f]/80 italic">
                &quot;The database is the backend. The database is the application.&quot;
              </blockquote>
            </FadeIn>
          </section>

          {/* 5. Features Section */}
          <section id="features" className="relative py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="inline-block text-[#00171f]/50 font-bold uppercase tracking-widest text-xs mb-4">Core Capabilities</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#00171f]">8 Features. All Live. No Vaporware.</h2>
              </div>
            </FadeIn>
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
                <FadeIn key={i} delay={i * 100} className="h-full">
                  <GlassCard className="h-full">
                    <div className="text-[#000000] font-mono text-sm mb-3 font-bold">{f.n}</div>
                    <h3 className="text-[#00171f] font-bold mb-2">{f.t}</h3>
                    <p className="text-[#00171f]/60 text-sm">{f.d}</p>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* 6. Architecture Section */}
          <section id="architecture" className="relative py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <FadeIn>
               <div className="text-center mb-16">
                <span className="inline-block text-blue-500 font-bold uppercase tracking-widest text-xs mb-4">Under The Hood</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#00171f]">Architecture Built Different</h2>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "World State", tech: "SpacetimeDB (Rust WASM)", desc: "all factory logic as reducers inside the DB, no API server" },
                { label: "Edge AI", tech: "Ollama + Mistral + LLaVA", desc: "runs on-premises, no data leaves the building" },
                { label: "Operator Interface", tech: "Next.js + SDK", desc: "zero REST calls, pure WebSocket subscriptions" },
                { label: "Infrastructure", tech: "Vultr + Docker + Nginx", desc: "2 VPS nodes, one for core, one for AI edge" },
              ].map((a, i) => (
                <FadeIn key={i} delay={i * 150} className="h-full">
                  <GlassCard className="flex flex-col h-full">
                    <span className="text-[#333333] text-xs font-bold uppercase tracking-widest mb-2">{a.label}</span>
                    <h3 className="text-[#00171f] font-bold mb-3">{a.tech}</h3>
                    <p className="text-[#00171f]/60 text-sm mt-auto">{a.desc}</p>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* 7. Pricing Section */}
          <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]">Finally, Automation an MSME Can Afford</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <FadeIn delay={100} className="h-full">
                <GlassCard className="h-full" borderAccent="border-red-500/20 bg-white/20">
                  <h3 className="text-xl font-bold mb-6 text-[#00171f]/40 uppercase tracking-tighter">Enterprise SCADA</h3>
                  <ul className="space-y-4 mb-8">
                    {["₹50L+ setup cost", "₹5L+/month maintenance", "Vendor lock-in", "Proprietary hardware needed"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-[#00171f]/50 text-sm md:text-base">
                        <span className="text-red-500 font-bold">✕</span> {item}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </FadeIn>

              <FadeIn delay={300} className="h-full">
                <GlassCard className="h-full" borderAccent="border-[#000000]/30 shadow-[0_15px_45px_rgb(0,0,0,0.08)]">
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
              </FadeIn>
            </div>

            <FadeIn delay={500}>
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
            </FadeIn>
          </section>

          {/* 8. Tech Stack Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#00171f]/30 uppercase tracking-tighter">Built on Serious Technology</h2>
            </FadeIn>
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
                <FadeIn key={i} delay={i * 50}>
                  <div className="group px-6 py-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl hover:bg-white/60 hover:border-white/80 transition-all cursor-default shadow-[0_8px_30px_rgba(0,0,0,0.04)] active:scale-95">
                    <div className="text-[#00171f] font-bold group-hover:text-[#000000] transition-colors">{tech.n}</div>
                    <div className="text-[10px] text-[#00171f]/40 uppercase tracking-tighter group-hover:text-[#00171f]/60 transition-colors">{tech.r}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* 9. Footer */}
          <footer className="border-t border-[#003459]/10 pt-24 pb-12 px-6 mt-20 overflow-hidden relative">
            <FadeIn className="relative z-10 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
                {/* Brand Column */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-[#000000] rounded-sm transform rotate-45 flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-[#000000] font-bold text-2xl tracking-tight">Stellar State</span>
                  </div>
                  <p className="text-[#00171f]/60 text-sm mb-8 max-w-sm leading-relaxed">
                    The first production-ready factory operating system with zero API layers. Built on SpacetimeDB for &lt;5ms global synchronization.
                  </p>
                  <div className="flex gap-4">
                    {/* Social Circles */}
                    {[
                      { icon: "𝕏", name: "Twitter" },
                      { icon: "G", name: "GitHub" },
                      { icon: "D", name: "Discord" },
                      { icon: "in", name: "LinkedIn" }
                    ].map((s) => (
                      <a key={s.name} href="#" className="w-10 h-10 rounded-full border border-[#000000]/10 flex items-center justify-center text-[#000000]/60 hover:bg-[#000000] hover:text-white hover:border-[#000000] transition-colors text-sm font-bold shadow-sm">
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h4 className="font-bold text-[#000000] mb-6 uppercase tracking-widest text-xs">Product</h4>
                  <ul className="space-y-4 text-sm text-[#00171f]/60 font-medium">
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Edge AI Vision</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">World-State Engine</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Hardware Specs</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Changelog</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#000000] mb-6 uppercase tracking-widest text-xs">Resources</h4>
                  <ul className="space-y-4 text-sm text-[#00171f]/60 font-medium">
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Documentation</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">API Reference</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">System Status</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">GitHub Repository</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Community Forum</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#000000] mb-6 uppercase tracking-widest text-xs">Company</h4>
                  <ul className="space-y-4 text-sm text-[#00171f]/60 font-medium">
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">About Us</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Careers</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-[#000000] transition-colors">Contact</Link></li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#000000]/10 text-xs text-[#00171f]/40 font-medium">
                <div className="flex gap-6">
                  <span>© {new Date().getFullYear()} Stellar State Automation.</span>
                  <span className="hidden md:inline hover:text-[#000000] transition-colors cursor-default">Industrial Grade.</span>
                </div>
                <div className="flex gap-6">
                  <Link href="#" className="hover:text-[#000000] transition-colors">Privacy Policy</Link>
                  <Link href="#" className="hover:text-[#000000] transition-colors">Terms of Service</Link>
                </div>
              </div>
            </FadeIn>

            {/* Giant watermark */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none z-0 flex justify-center translate-y-[35%] opacity-[0.02]">
              <h2 className="text-[18vw] font-black tracking-tighter text-[#000000] whitespace-nowrap">STELLAR STATE</h2>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}