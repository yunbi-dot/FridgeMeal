import { useState } from 'react';
import { PrimaryButton } from './PrimaryButton';
import { TextButton } from './TextButton';

export function IngredientFormModal({ mode, item, onSubmit, onClose, error }) {
  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ name, quantity });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{mode === 'add' ? '재료 추가' : '재료 수정'}</h2>
        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            재료 이름
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mode === 'edit'}
              placeholder="예: 계란"
            />
          </label>
          <label className="modal-field">
            수량 (선택)
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="예: 6개"
            />
          </label>
          {error && <p className="inline-error">{error}</p>}
          <div className="modal-actions">
            <TextButton label="취소" onClick={onClose} />
            <PrimaryButton label={mode === 'add' ? '추가' : '수정'} type="submit" />
          </div>
        </form>
      </div>
    </div>
  );
}
