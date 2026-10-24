import React from "react";
import { Search } from "lucide-react";
import { MenuFilters, MenuCard, MealBasket } from "../components.jsx";

function Menu({
  meals,
  filteredMeals,
  addMeal,
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  hideUnavailable,
  setHideUnavailable,
  basket,
  changeQuantity,
  removeMeal,
  setBasket,
  fulfilment,
  setFulfilment,
  setPage,
}) {
  return (
    <section className="page-section menu-page">
      <div className="page-heading">
        <span className="eyebrow">FRESH FROM OUR KITCHEN</span>
        <h1>Find your next favourite.</h1>
        <p>
          Explore the menu, add a few favourites, and see your full estimated
          cost before previewing.
        </p>
      </div>
      <MenuFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        hideUnavailable={hideUnavailable}
        setHideUnavailable={setHideUnavailable}
      />
      <div className="menu-layout">
        <div className="menu-results">
          <div className="results-heading">
            <span>{filteredMeals.length} items found</span>
            <span>Prices shown in AFN</span>
          </div>
          <div className="meal-grid">
            {filteredMeals.map((meal) => (
              <MenuCard key={meal.id} meal={meal} addMeal={addMeal} />
            ))}
          </div>
          {filteredMeals.length === 0 && (
            <div className="no-results">
              <Search size={30} />
              <h3>No dishes found</h3>
              <p>Try a different search or category.</p>
              <button
                className="button button-light"
                onClick={() => {
                  setSearch("");
                  setCategory("All categories");
                  setHideUnavailable(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <MealBasket
          basket={basket}
          meals={meals}
          changeQuantity={changeQuantity}
          removeMeal={removeMeal}
          resetBasket={() => setBasket([])}
          fulfilment={fulfilment}
          setFulfilment={setFulfilment}
          onPreorder={() => setPage("Preorder")}
        />
      </div>
    </section>
  );
}

export default Menu;
