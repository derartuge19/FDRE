'use client';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 select-none"
      style={{
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
      }}
    >
      {/* Track */}
      <div className="relative w-10 h-5 rounded-full transition-all duration-300"
        style={{ background: isDark ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
        {/* Thumb */}
        <div className="absolute top-0.5 w-4 h-4 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-[9px]"
          style={{
            left: isDark ? '1.25rem' : '2px',
            background: isDark ? '#064e3b' : '#fff',
          }}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/70 hidden sm:block">
        {isDark ? 'Night' : 'Day'}
      </span>
    </button>
  );
}
