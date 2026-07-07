export function IngredientList({ items, selectedNames, onSelect }) {
  if (items.length === 0) {
    return <p className="muted">검색 결과가 없어요.</p>;
  }

  return (
    <ul className="ingredient-list">
      {items.map((item) => {
        const isSelected = selectedNames.includes(item.name);
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`ingredient-list-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item.name)}
              disabled={isSelected}
            >
              {item.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
