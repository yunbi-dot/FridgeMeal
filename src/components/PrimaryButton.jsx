export function PrimaryButton({ label, onClick, disabled = false, type = 'button', className = '' }) {
  return (
    <button type={type} className={`btn btn-primary ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
