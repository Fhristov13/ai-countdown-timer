import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Clock, Zap } from "lucide-react";

type TimerState = "idle" | "running" | "paused" | "finished";

const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-background" />
    <div
      className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] rounded-full opacity-[0.07]"
      style={{
        background: "radial-gradient(circle, hsl(var(--glow-cyan)) 0%, transparent 50%)",
        animation: "gradient-shift 12s ease-in-out infinite",
      }}
    />
    <div
      className="absolute -top-1/2 -right-1/2 h-[200%] w-[200%] rounded-full opacity-[0.07]"
      style={{
        background: "radial-gradient(circle, hsl(var(--glow-purple)) 0%, transparent 50%)",
        animation: "gradient-shift-2 15s ease-in-out infinite",
      }}
    />
    <div
      className="absolute -bottom-1/2 left-1/4 h-[200%] w-[200%] rounded-full opacity-[0.05]"
      style={{
        background: "radial-gradient(circle, hsl(var(--glow-pink)) 0%, transparent 50%)",
        animation: "gradient-shift-3 18s ease-in-out infinite",
      }}
    />
  </div>
);

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl ${className}`}
    style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.05)" }}
  >
    {children}
  </div>
);

const CountdownTimer = () => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [state, setState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const playBeep = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      for (let i = 0; i < 3; i++) {
        playBeep(ctx.currentTime + i * 0.4, 880, 0.3);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setState("finished");
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [state, clearTimer, playAlarm]);

  const totalTime = minutes * 60 + seconds;

  const handleStart = () => {
    if (state === "idle") {
      if (totalTime === 0) return;
      setTimeLeft(totalTime);
      setState("running");
    } else if (state === "paused") {
      setState("running");
    }
  };

  const handlePause = () => {
    if (state === "running") {
      clearTimer();
      setState("paused");
    }
  };

  const handleReset = () => {
    clearTimer();
    setState("idle");
    setTimeLeft(0);
  };

  const displayMinutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const displaySeconds = (timeLeft % 60).toString().padStart(2, "0");
  const isIdle = state === "idle";
  const progress = isIdle ? 1 : state === "finished" ? 0 : timeLeft / totalTime;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-[0.2em]">Countdown Timer</span>
          <Zap className="h-4 w-4 text-primary" />
        </div>

        {state === "finished" ? (
          <GlassCard className="flex flex-col items-center gap-8 px-12 py-12">
            <div className="animate-blink text-center">
              <h1 className="font-mono text-5xl font-bold tracking-tight text-accent sm:text-7xl">
                Time is over!
              </h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-lg font-semibold text-secondary-foreground transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col items-center gap-8 px-8 py-10 sm:px-14">
            {/* Timer ring */}
            <div className="relative flex items-center justify-center">
              <svg className="h-72 w-72 -rotate-90 sm:h-80 sm:w-80" viewBox="0 0 300 300">
                {/* Outer glow track */}
                <circle
                  cx="150" cy="150" r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="4"
                  opacity="0.5"
                />
                {/* Tick marks */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
                  const isMajor = i % 5 === 0;
                  const inner = radius - (isMajor ? 12 : 6);
                  const outer = radius - 2;
                  return (
                    <line
                      key={i}
                      x1={150 + inner * Math.cos(angle)}
                      y1={150 + inner * Math.sin(angle)}
                      x2={150 + outer * Math.cos(angle)}
                      y2={150 + outer * Math.sin(angle)}
                      stroke={isMajor ? "hsl(var(--muted-foreground))" : "hsl(var(--border))"}
                      strokeWidth={isMajor ? 2 : 1}
                      opacity={isMajor ? 0.6 : 0.3}
                    />
                  );
                })}
                {/* Progress arc */}
                <circle
                  cx="150" cy="150" r={radius}
                  fill="none"
                  stroke="url(#timer-gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
                  }}
                />
                <defs>
                  <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--glow-cyan))" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--glow-pink))" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isIdle ? (
                  <div className="flex items-center gap-1 font-mono text-5xl font-bold tracking-wider text-foreground sm:text-6xl">
                    <input
                      type="number"
                      min={0} max={99}
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(99, Number(e.target.value))))}
                      className="w-16 bg-transparent text-center text-foreground outline-none sm:w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Minutes"
                    />
                    <span className="animate-blink text-primary">:</span>
                    <input
                      type="number"
                      min={0} max={59}
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                      className="w-16 bg-transparent text-center text-foreground outline-none sm:w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Seconds"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-6xl font-bold tracking-wider text-foreground sm:text-7xl">
                      {displayMinutes}
                      <span className="text-primary">:</span>
                      {displaySeconds}
                    </span>
                    <span className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                      {state === "paused" ? "Paused" : "Running"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {(isIdle || state === "paused") && (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--glow-cyan)), hsl(var(--primary)), hsl(var(--glow-purple)))",
                    boxShadow: "0 8px 30px hsl(var(--primary) / 0.4)",
                  }}
                >
                  <Play className="h-4 w-4" />
                  {state === "paused" ? "Resume" : "Start"}
                </button>
              )}
              {state === "running" && (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-8 py-3.5 text-base font-semibold text-secondary-foreground backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              )}
              {!isIdle && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-8 py-3.5 text-base font-semibold text-muted-foreground backdrop-blur-sm transition-all hover:scale-105 hover:text-foreground active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>

            {isIdle && (
              <p className="text-xs text-muted-foreground tracking-wide">
                Set your time and press Start
              </p>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;
