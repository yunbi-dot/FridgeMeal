export function CategoryFilterBar({ categories, selected, onSelect }) {
  return (
    <div className="category-filter-bar">
      <button
        type="button"
        className={`category-chip ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-chip ${selected === category ? 'active' : ''}`}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
