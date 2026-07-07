export function FridgeItemList({ items, selectedIds, onToggle }) {
  return (
    <ul className="fridge-item-list">
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`fridge-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(item.id)}
            >
              <span className="fridge-item-name">{item.name}</span>
              {item.quantity && <span className="fridge-item-quantity">{item.quantity}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
