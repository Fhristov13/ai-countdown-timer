import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

type TimerState = "idle" | "running" | "paused" | "finished";

const CountdownTimer = () => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [state, setState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
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

  const handleStart = () => {
    if (state === "idle") {
      const total = minutes * 60 + seconds;
      if (total === 0) return;
      setTimeLeft(total);
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
  const progress = isIdle ? 1 : state === "finished" ? 0 : timeLeft / (minutes * 60 + seconds);

  // SVG circle progress
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      {state === "finished" ? (
        <div className="flex flex-col items-center gap-8 animate-fade-in">
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
        </div>
      ) : (
        <>
          {/* Timer display */}
          <div className="relative flex items-center justify-center">
            <svg className="h-80 w-80 -rotate-90 sm:h-96 sm:w-96" viewBox="0 0 320 320">
              <circle
                cx="160"
                cy="160"
                r={radius}
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="8"
              />
              <circle
                cx="160"
                cy="160"
                r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isIdle ? (
                <div className="flex items-center gap-1 font-mono text-6xl font-bold tracking-wider text-foreground sm:text-7xl">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(99, Number(e.target.value))))}
                    className="w-20 bg-transparent text-center text-foreground outline-none sm:w-24 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label="Minutes"
                  />
                  <span className="text-muted-foreground">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-20 bg-transparent text-center text-foreground outline-none sm:w-24 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label="Seconds"
                  />
                </div>
              ) : (
                <span className="font-mono text-7xl font-bold tracking-wider text-foreground sm:text-8xl">
                  {displayMinutes}
                  <span className="text-muted-foreground">:</span>
                  {displaySeconds}
                </span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            {(isIdle || state === "paused") && (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 8px 30px hsl(var(--primary) / 0.35)" }}
              >
                <Play className="h-5 w-5" />
                {state === "paused" ? "Resume" : "Start"}
              </button>
            )}
            {state === "running" && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-lg font-semibold text-secondary-foreground transition-all hover:scale-105 active:scale-95"
              >
                <Pause className="h-5 w-5" />
                Pause
              </button>
            )}
            {!isIdle && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-lg font-semibold text-card-foreground transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </button>
            )}
          </div>

          {isIdle && (
            <p className="text-sm text-muted-foreground">
              Set your time and press Start
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default CountdownTimer;
