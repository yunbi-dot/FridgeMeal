export function Chip({ label, onRemove }) {
  return (
    <span className="chip">
      {label}
      {onRemove && (
        <button type="button" className="chip-remove" onClick={onRemove} aria-label={`${label} 삭제`}>
          ×
        </button>
      )}
    </span>
  );
}
