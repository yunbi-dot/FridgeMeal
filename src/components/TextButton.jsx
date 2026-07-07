export function TextButton({ label, onClick }) {
  return (
    <button type="button" className="btn btn-text" onClick={onClick}>
      {label}
    </button>
  );
}
