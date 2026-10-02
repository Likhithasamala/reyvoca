import { cn } from "@/lib/cn";

const BAR_HEIGHTS = [0.45, 0.8, 1, 0.65, 0.9, 0.5, 0.75];

type WaveformProps = {
  active?: boolean;
  bars?: number;
  className?: string;
  barClassName?: string;
};

/** Animated voice bars. Purely decorative. */
export function Waveform({ active = true, bars = 5, className, barClassName }: WaveformProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-4 items-center gap-[3px]", className)}>
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] origin-center rounded-full bg-current",
            active ? "animate-wave" : "[transform:scaleY(0.35)]",
            barClassName,
          )}
          style={{
            height: `${BAR_HEIGHTS[index % BAR_HEIGHTS.length] * 100}%`,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </span>
  );
}
