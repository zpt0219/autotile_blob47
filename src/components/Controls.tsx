const SEED_MAX = 99999;
const clampSeed = (raw: string) => Math.max(0, Math.min(SEED_MAX, parseInt(raw) || 0));
const rollSeed = () => Math.floor(Math.random() * SEED_MAX) + 1;

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="infotip">
      <button type="button" className="infotip-btn" aria-label={text}>
        ?
      </button>
      <span className="infotip-panel" role="tooltip">
        {text}
      </span>
    </span>
  );
}

/**
 * A colour well the whole area of which is clickable.
 *
 * `<input type="color">` cannot be styled, so the swatch is a div wearing the
 * colour with the real input stretched invisibly over it — that is why the
 * input is oversized and transparent rather than hidden, which would take it
 * out of the hit area along with the picker.
 */
export function ColourSwatch({
  hex,
  onChange,
  title,
  isCustom = false,
  disabled = false,
}: {
  hex: string;
  onChange: (hex: string) => void;
  title: string;
  isCustom?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`colour-swatch${isCustom ? ' is-custom' : ''}${disabled ? ' is-disabled' : ''}`}
      title={title}
      style={{ background: hex }}
    >
      {disabled && (
        <svg className="swatch-cross" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(0,0,0,0.6)" strokeWidth="16" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(0,0,0,0.6)" strokeWidth="16" />
          <line x1="0" y1="0" x2="100" y2="100" stroke="#ef4444" strokeWidth="10" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#ef4444" strokeWidth="10" />
        </svg>
      )}
      <input
        type="color"
        value={hex}
        disabled={disabled}
        aria-label={title}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Typed seed plus a dice roll and reset. Used by edge, noise, and texture seeds. */
export function SeedField({
  value,
  onChange,
  diceTitle,
  resetTitle,
}: {
  value: number;
  onChange: (seed: number) => void;
  diceTitle: string;
  resetTitle?: string;
}) {
  return (
    <div className="seed-field">
      <input
        type="number"
        className="text-input"
        min={0}
        max={SEED_MAX}
        value={value}
        onChange={(e) => onChange(clampSeed(e.target.value))}
      />
      <button
        className="btn-action btn-secondary btn-dice"
        onClick={() => onChange(rollSeed())}
        title={diceTitle}
      >
        🎲
      </button>
      <button
        className="btn-action btn-secondary btn-reset-seed"
        onClick={() => onChange(0)}
        title={resetTitle || '重置种子 (0)'}
      >
        ↺
      </button>
    </div>
  );
}

/** "Back to the derived colours." Shown only while an override is in force. */
export function ResetLink({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button className="btn-action btn-secondary btn-reset" onClick={onClick} title={title}>
      ↺ {label}
    </button>
  );
}
