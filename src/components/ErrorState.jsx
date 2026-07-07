import { SecondaryButton } from './SecondaryButton';

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <p>{message}</p>
      {onRetry && <SecondaryButton label="다시 시도" onClick={onRetry} />}
    </div>
  );
}
