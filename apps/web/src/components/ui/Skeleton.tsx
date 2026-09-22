import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height, borderRadius, className = '', style }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton skeleton-icon" />
      <span className="skeleton skeleton-value" />
      <span className="skeleton skeleton-label" />
    </div>
  );
}

export function SkeletonText({ lines = 3, widths }: { lines?: number; widths?: string[] }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="skeleton skeleton-text"
          style={{ width: widths?.[i] ?? `${80 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="skeleton-table-row" aria-hidden="true">
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
    </div>
  );
}

export function SkeletonShortcut() {
  return (
    <div className="skeleton-shortcut" aria-hidden="true">
      <span className="skeleton skeleton-shortcut-icon" />
      <span className="skeleton skeleton-shortcut-text" />
    </div>
  );
}

