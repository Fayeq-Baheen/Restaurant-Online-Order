import React, { useState } from "react";
import {
  Search,
  ShoppingBag,
  Utensils,
  Clock,
  MapPin,
  Phone,
  Plus,
  Minus,
  Trash2,
  Pencil,
  Menu as MenuIcon,
} from "lucide-react";
import { categories, money } from "./data.js";

function Header({ page, setPage, basketCount, user, onLogout }) {
  const [open, setOpen] = useState(false);
  const links = [
    "Home",
    "Menu",
    "Preorder",
    ...(user?.role === "admin" ? ["Manage Menu", "Orders"] : []),
    "About",
    "Contact",
  ];
  return (
    <header className="header">
      <div className="nav-wrap">
        <button
          className="brand"
          onClick={() => setPage("Home")}
          aria-label="Afghan Bites home"
        >
          <span className="brand-mark">
            <Utensils size={22} />
          </span>
          <span>
            Afghan Bites<small>GOOD FOOD, MADE WITH CARE</small>
          </span>
        </button>
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>
        <nav className={open ? "nav-links open" : "nav-links"}>
          {links.map((link) => (
            <button
              key={link}
              className={page === link ? "nav-link active" : "nav-link"}
              onClick={() => {
                setPage(link);
                setOpen(false);
              }}
            >
              {link === "Preorder" ? (
                <>
                  Preorder <span className="nav-count">{basketCount}</span>
                </>
              ) : (
                link
              )}
            </button>
          ))}
          <button
            className={page === "Login" ? "nav-link active" : "nav-link"}
            onClick={() => {
              setPage("Login");
              setOpen(false);
            }}
          >
            {user ? user.name : "Login"}
          </button>
          {user && (
            <button
              className="nav-link"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuCard({ meal, addMeal, manage = false, editMeal, deleteMeal }) {
  return (
    <article
      className={`meal-card ${!meal.available ? "meal-unavailable" : ""}`}
    >
      <div className="meal-image-wrap">
        <img className="meal-image" src={meal.image} alt={meal.name} />
        <span
          className={`availability ${meal.available ? "in-stock" : "out-stock"}`}
        >
          <span /> {meal.available ? "Available" : "Sold out"}
        </span>
      </div>
      <div className="meal-info">
        <div className="meal-category">{meal.category}</div>
        <div className="meal-title-row">
          <h3>{meal.name}</h3>
          <strong className="price">{money(meal.priceAFN)}</strong>
        </div>
        <p>{meal.ingredients}</p>
        {manage ? (
          <div className="manage-actions">
            <button
              className="button button-light"
              onClick={() => editMeal(meal)}
            >
              <Pencil size={15} /> Edit
            </button>
            <button
              className="button button-danger-light"
              onClick={() => deleteMeal(meal.id)}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        ) : (
          <button
            className="button button-add"
            disabled={!meal.available}
            onClick={() => addMeal(meal)}
          >
            {meal.available ? (
              <>
                <Plus size={17} /> Add to basket
              </>
            ) : (
              "Currently unavailable"
            )}
          </button>
        )}
      </div>
    </article>
  );
}

function MenuFilters({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  hideUnavailable,
  setHideUnavailable,
}) {
  return (
    <div className="filters">
      <label className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes or ingredients..."
          aria-label="Search dishes"
        />
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Filter by category"
      >
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        aria-label="Sort by price"
      >
        <option value="featured">Sort: Featured</option>
        <option value="low">Price: Low to high</option>
        <option value="high">Price: High to low</option>
      </select>
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={hideUnavailable}
          onChange={(e) => setHideUnavailable(e.target.checked)}
        />{" "}
        Hide unavailable
      </label>
    </div>
  );
}

function MealBasket({
  basket,
  meals,
  changeQuantity,
  removeMeal,
  resetBasket,
  fulfilment,
  setFulfilment,
  onPreorder,
}) {
  const subtotal = basket.reduce(
    (sum, line) => sum + line.priceAFN * line.quantity,
    0,
  );
  const deliveryFee = fulfilment === "delivery" ? 60 : 0;
  return (
    <aside className="basket-panel">
      <div className="basket-heading">
        <div>
          <span className="eyebrow">YOUR SELECTION</span>
          <h2>
            Meal basket{" "}
            <span className="basket-count">
              {basket.reduce((n, x) => n + x.quantity, 0)}
            </span>
          </h2>
        </div>
        <ShoppingBag size={23} />
      </div>
      {basket.length === 0 ? (
        <div className="empty-basket">
          <div className="empty-icon">
            <ShoppingBag size={25} />
          </div>
          <h3>Your basket is empty</h3>
          <p>Add available meals from the menu to build a preorder.</p>
        </div>
      ) : (
        <div className="basket-lines">
          {basket.map((line) => (
            <div className="basket-line" key={line.id}>
              <img src={line.image} alt="" />
              <div className="basket-line-main">
                <strong>{line.name}</strong>
                <small>{money(line.priceAFN)} each</small>
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${line.name}`}
                    onClick={() => changeQuantity(line.id, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${line.name}`}
                    onClick={() => changeQuantity(line.id, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="line-end">
                <strong>{money(line.priceAFN * line.quantity)}</strong>
                <button
                  className="icon-button"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => removeMeal(line.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {basket.length > 0 && (
        <button className="text-button reset-button" onClick={resetBasket}>
          Reset basket
        </button>
      )}
      <div className="fulfilment">
        <h3>How would you like it?</h3>
        <label
          className={`fulfilment-option ${fulfilment === "pickup" ? "selected" : ""}`}
        >
          <input
            type="radio"
            name="fulfilment"
            value="pickup"
            checked={fulfilment === "pickup"}
            onChange={() => setFulfilment("pickup")}
          />
          <span className="fulfil-icon">
            <ShoppingBag size={18} />
          </span>
          <span className="fulfil-text">
            <strong>Pickup</strong>
            <small>Collect at the restaurant</small>
          </span>
          <strong className="fee-free">+0 AFN</strong>
        </label>
        <label
          className={`fulfilment-option ${fulfilment === "delivery" ? "selected" : ""}`}
        >
          <input
            type="radio"
            name="fulfilment"
            value="delivery"
            checked={fulfilment === "delivery"}
            onChange={() => setFulfilment("delivery")}
          />
          <span className="fulfil-icon">
            <MapPin size={18} />
          </span>
          <span className="fulfil-text">
            <strong>Delivery</strong>
            <small>Fixed practice delivery fee</small>
          </span>
          <strong>+60 AFN</strong>
        </label>
      </div>
      <div className="price-summary">
        <div>
          <span>Meal subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>
        <div>
          <span>
            {fulfilment === "delivery" ? "Delivery fee" : "Pickup fee"}
          </span>
          <strong>{money(deliveryFee)}</strong>
        </div>
        <div className="grand-total">
          <span>Total estimate</span>
          <strong>{money(subtotal + deliveryFee)}</strong>
        </div>
      </div>
      <p className="cost-note">
        All prices are in AFN. Delivery adds 60 AFN once per order, not per
        meal.
      </p>
      <button
        className="button button-primary checkout-button"
        disabled={!basket.length}
        onClick={onPreorder}
      >
        Review preorder <span>→</span>
      </button>
      <p className="demo-note">
        Demonstration only. No payment or real order is submitted.
      </p>
    </aside>
  );
}

function OrderSummary({ basket, fulfilment, subtotal, fee }) {
  return (
    <div className="order-summary">
      <h2>Order summary</h2>
      {basket.length ? (
        basket.map((line) => (
          <div className="summary-line" key={line.id}>
            <span>
              {line.quantity} × {line.name}
            </span>
            <strong>{money(line.quantity * line.priceAFN)}</strong>
          </div>
        ))
      ) : (
        <p className="muted">No meals selected.</p>
      )}
      <div className="summary-line">
        <span>Meal subtotal</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div className="summary-line">
        <span>{fulfilment === "delivery" ? "Delivery fee" : "Pickup fee"}</span>
        <strong>{money(fee)}</strong>
      </div>
      <div className="summary-total">
        <span>Estimated total</span>
        <strong>{money(subtotal + fee)}</strong>
      </div>
      <p className="cost-note">Fee is applied once per order.</p>
    </div>
  );
}

export { Header, MenuCard, MenuFilters, MealBasket, OrderSummary };
