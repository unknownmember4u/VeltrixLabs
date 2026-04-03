// src/components/ui/Card.jsx
export const Card = ({ children, className = "", accent = "" }) => (
  <div className={`
    relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl
    hover:border-white/40 hover:-translate-y-1.5 hover:bg-white/15
    hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]
    transition-all duration-300 ease-out
    p-7 ${className} ${accent}
  `}>
    {/* Inner glow effect for glassmorphism on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
    <div className="relative z-10">{children}</div>
  </div>
);
