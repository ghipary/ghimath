import React from 'react';
import { Flame, Trophy, Sparkles, Star, Sprout, Zap, Rocket, Gem, Crown } from 'lucide-react';

const StreakBadge = ({ current = 0, longest = 0, compact = false }) => {
  if (current === 0 && longest === 0) return null;

  // ⚡ CONFIG: warna + ICON per level streak
  const getStreakConfig = (streak) => {
    if (streak >= 100) return {
      gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
      glow: 'shadow-pink-500/40',
      iconBg: 'from-fuchsia-400 to-pink-600',
      iconShadow: 'shadow-pink-500/40',
      Icon: Crown,
      label: 'LEGENDA',
      border: 'border-pink-300/50',
      accent: 'text-pink-100',
      message: 'Kamu legenda sejati! Pertahankan!',
    };
    if (streak >= 30) return {
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
      glow: 'shadow-purple-500/40',
      iconBg: 'from-violet-400 to-purple-600',
      iconShadow: 'shadow-purple-500/40',
      Icon: Gem,
      label: 'LUAR BIASA',
      border: 'border-purple-300/50',
      accent: 'text-purple-100',
      message: 'Konsistensi kelas dewa!',
    };
    if (streak >= 14) return {
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      glow: 'shadow-orange-500/40',
      iconBg: 'from-amber-400 to-orange-600',
      iconShadow: 'shadow-orange-500/40',
      Icon: Rocket,
      label: 'MANTAP',
      border: 'border-orange-300/50',
      accent: 'text-orange-100',
      message: 'Wusssh! Kamu makin cepat terbang!',
    };
    if (streak >= 7) return {
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      glow: 'shadow-amber-500/40',
      iconBg: 'from-yellow-400 to-orange-500',
      iconShadow: 'shadow-amber-500/40',
      Icon: Zap,
      label: 'HEBAT',
      border: 'border-amber-300/50',
      accent: 'text-amber-100',
      message: 'Satu minggu penuh! Pertahankan!',
    };
    if (streak >= 3) return {
      gradient: 'from-cyan-400 via-teal-500 to-cyan-600',
      glow: 'shadow-cyan-500/40',
      iconBg: 'from-cyan-400 to-teal-600',
      iconShadow: 'shadow-cyan-500/40',
      Icon: Flame,
      label: 'KEREN',
      border: 'border-cyan-300/50',
      accent: 'text-cyan-100',
      message: 'Beberapa hari lagi jadi kebiasaan!',
    };
    // 1-2 hari
    return {
      gradient: 'from-teal-400 via-teal-500 to-cyan-600',
      glow: 'shadow-teal-500/40',
      iconBg: 'from-teal-400 to-cyan-600',
      iconShadow: 'shadow-teal-500/40',
      Icon: Sprout,
      label: 'MULAI',
      border: 'border-teal-300/50',
      accent: 'text-teal-100',
      message: 'Awal yang bagus! Jangan putus ya!',
    };
  };

  const config = getStreakConfig(current);
  const isHighStreak = current >= 7;

  // ⚡ VERSI COMPACT (untuk leaderboard)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${config.gradient} text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${config.glow}`}>
        <config.Icon className="w-3.5 h-3.5" />
        {current}
      </div>
    );
  }

  // ⚡ VERSI FULL CARD
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-xl ${config.glow} border-2 ${config.border}`}>
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

      {/* Sparkle stars untuk high streak */}
      {isHighStreak && (
        <>
          <Star className="absolute top-3 left-1/3 w-3 h-3 text-yellow-200 fill-yellow-200 animate-pulse opacity-70" />
          <Star className="absolute top-6 right-1/4 w-2 h-2 text-yellow-200 fill-yellow-200 animate-pulse opacity-50" />
          <Star className="absolute bottom-8 left-1/4 w-2.5 h-2.5 text-yellow-200 fill-yellow-200 animate-pulse opacity-60" />
        </>
      )}

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Icon box SOLID (konsisten dengan card lain) */}
          <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${config.iconBg} rounded-2xl flex items-center justify-center shadow-lg ${config.iconShadow} ${isHighStreak ? 'animate-pulse-soft' : ''} border-2 border-white/30`}>
            <config.Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
          </div>

          {/* Info Streak */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className={`text-[10px] sm:text-xs font-bold ${config.accent} tracking-wider`}>
                STREAK BELAJAR
              </p>
              <span className="text-[10px] font-bold bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30">
                {config.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold drop-shadow-lg leading-none">
                {current}
              </span>
              <span className="text-xs sm:text-sm font-medium opacity-90">
                hari berturut-turut
              </span>
            </div>
            {longest > 0 && (
              <p className={`text-[10px] sm:text-xs ${config.accent} mt-1.5 flex items-center gap-1 font-medium`}>
                <Trophy className="w-3 h-3" /> Rekor terbaik: {longest} hari
              </p>
            )}
          </div>

          {/* Icon besar KANAN — sama solid */}
          <div className={`hidden sm:flex flex-shrink-0 w-16 h-16 bg-gradient-to-br ${config.iconBg} rounded-2xl items-center justify-center shadow-lg ${config.iconShadow} border-2 border-white/30`}>
            <config.Icon className="w-9 h-9 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Pesan Motivasi */}
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-[11px] sm:text-xs font-semibold">
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreakBadge;