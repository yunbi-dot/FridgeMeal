export function Chip({ label, onRemove, onClick, active = false }) {
  const content = (
    <>
      {label}
      {onRemove && (
        <button type="button" className="chip-remove" onClick={onRemove} aria-label={`${label} 삭제`}>
          ×
        </button>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`chip chip-clickable ${active ? 'active' : ''}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <span className="chip">{content}</span>;
}
