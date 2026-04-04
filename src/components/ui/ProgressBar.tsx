interface ProgressBarProps {
  className?: string;
  label?: string;
  max?: number;
  showNumbers?: boolean;
  value: number;
}

export default function ProgressBar({
  className,
  label,
  max = 100,
  showNumbers = true,
  value,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const clampedValue = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clampedValue / safeMax) * 100);

  return (
    <div className={["ui-progress", className ?? ""].filter(Boolean).join(" ")}>
      {(label || showNumbers) && (
        <div className="ui-progress__meta">
          <span>{label ?? "Progress"}</span>
          {showNumbers ? <span>{percent}%</span> : null}
        </div>
      )}

      <div
        className="ui-progress__track"
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clampedValue}
      >
        <div className="ui-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
