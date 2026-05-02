import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function CustomAudioPlayer({ src, title, className }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = (val: number[]) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = val[0];
    setCurrent(val[0]);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.25)] backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Animated glow */}
      <div
        className={cn(
          "absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl transition-opacity",
          playing ? "opacity-100 animate-pulse" : "opacity-30"
        )}
      />

      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="relative flex items-center gap-4">
        <button
          onClick={toggle}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 active:scale-95",
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {title && (
            <div className="text-sm font-medium text-foreground truncate">{title}</div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-10">
              {formatTime(current)}
            </span>
            <div className="relative flex-1">
              <Slider
                value={[current]}
                max={duration || 100}
                step={0.1}
                onValueChange={seek}
                className="cursor-pointer"
              />
              {/* Visualizer bars when playing */}
              {playing && (
                <div className="pointer-events-none absolute inset-x-0 -bottom-3 flex h-2 items-end justify-around gap-px opacity-40">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-0.5 rounded-full bg-primary"
                      style={{
                        height: `${20 + Math.abs(Math.sin((i + current * 4) * 0.7)) * 80}%`,
                        transition: "height 120ms ease-out",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-10 text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/50">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="w-20">
            <Slider
              value={[muted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(v) => { setVolume(v[0] / 100); setMuted(false); }}
            />
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <a href={src} download aria-label="Download audio">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Progress accent line */}
      <div className="relative mt-4 h-px bg-border/40 overflow-hidden rounded-full">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
