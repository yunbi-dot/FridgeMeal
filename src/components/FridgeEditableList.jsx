export function FridgeEditableList({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return <p className="muted">등록된 재료가 없어요.</p>;
  }

  return (
    <ul className="fridge-editable-list">
      {items.map((item) => (
        <li key={item.id} className="fridge-editable-item">
          <div>
            <span className="fridge-item-name">{item.name}</span>
            {item.quantity && <span className="fridge-item-quantity">{item.quantity}</span>}
          </div>
          <div className="fridge-editable-actions">
            <button type="button" className="btn btn-text" onClick={() => onEdit(item)}>
              수정
            </button>
            <button type="button" className="btn btn-text danger" onClick={() => onDelete(item)}>
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
