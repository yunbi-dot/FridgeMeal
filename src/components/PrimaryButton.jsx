export function PrimaryButton({ label, onClick, disabled = false, type = 'button' }) {
  return (
    <button type={type} className="btn btn-primary" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
