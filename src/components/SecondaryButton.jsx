export function SecondaryButton({ label, onClick, disabled = false }) {
  return (
    <button type="button" className="btn btn-secondary" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
