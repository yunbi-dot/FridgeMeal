export function RecipeCard({ recipe, onClick }) {
  return (
    <button type="button" className="recipe-card" onClick={onClick}>
      <h3>{recipe.name}</h3>
      <p className="recipe-card-time">예상 조리 시간 {recipe.cooking_time}분</p>
      <p className="recipe-card-description">{recipe.description}</p>
      <div className="recipe-card-ingredients">
        {recipe.matched_ingredients.map((name) => (
          <span key={name} className="ingredient-tag matched">
            {name}
          </span>
        ))}
        {recipe.missing_ingredients.map((name) => (
          <span key={name} className="ingredient-tag missing">
            +{name}
          </span>
        ))}
      </div>
    </button>
  );
}
