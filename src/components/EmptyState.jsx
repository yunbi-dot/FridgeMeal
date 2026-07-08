import { FridgeIllustration } from './FridgeIllustration';

export function EmptyState({ message, action }) {
  return (
    <div className="empty-state">
      <FridgeIllustration size={96} className="empty-state-illustration" />
      <p>{message}</p>
      {action}
    </div>
  );
}
