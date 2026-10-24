import React, { useState } from "react";
import { MenuCard } from "../components.jsx";
import { categories } from "../data.js";

function ManageMenu({ meals, createMeal, updateMeal, deleteMeal }) {
  const blank = {
    name: "",
    category: "Main meals",
    image: "/images/kabuli-pulao.svg",
    priceAFN: "",
    ingredients: "",
    available: true,
  };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  function startEdit(meal) {
    setEditingId(meal.id);
    setForm({ ...meal, priceAFN: String(meal.priceAFN) });
    setErrors({});
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(e) {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.category) next.category = "Choose a category.";
    if (
      !String(form.priceAFN).trim() ||
      !Number.isFinite(Number(form.priceAFN)) ||
      Number(form.priceAFN) <= 0
    )
      next.priceAFN = "Price must be a positive number.";
    if (!form.ingredients.trim())
      next.ingredients = "Ingredients are required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const meal = {
      ...form,
      name: form.name.trim(),
      priceAFN: Number(form.priceAFN),
      ingredients: form.ingredients.trim(),
    };
    setSaving(true);
    setNotice("");
    try {
      if (editingId) {
        await updateMeal(editingId, meal);
        setNotice("Menu item updated and saved to the database.");
      } else {
        await createMeal(meal);
        setNotice("Menu item added to the database.");
      }
      setForm(blank);
      setEditingId(null);
      setErrors({});
    } catch (error) {
      setNotice(`Could not save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    if (window.confirm("Delete this menu item from the database?")) {
      try {
        await deleteMeal(id);
        setNotice("Menu item deleted from the database.");
        if (editingId === id) {
          setEditingId(null);
          setForm(blank);
        }
      } catch (error) {
        setNotice(`Could not delete: ${error.message}`);
      }
    }
  }
  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">STAFF AREA / DEMO</span>
        <h1>Manage the menu</h1>
        <p>
          Add, edit or remove dishes. Changes are saved through the API to
          PostgreSQL.
        </p>
      </div>
      <div className="manage-layout">
        <form className="form-card manage-form" onSubmit={save} noValidate>
          <h2>{editingId ? "Edit menu item" : "Add a menu item"}</h2>
          {notice && <p className="success-message">{notice}</p>}
          <div className="field">
            <label htmlFor="meal-name">
              Meal name <span>*</span>
            </label>
            <input
              id="meal-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mantu"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <small className="field-error">{errors.name}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="meal-category">
              Category <span>*</span>
            </label>
            <select
              id="meal-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <small className="field-error">{errors.category}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="meal-price">
              Price (AFN) <span>*</span>
            </label>
            <input
              id="meal-price"
              type="number"
              min="1"
              step="1"
              value={form.priceAFN}
              onChange={(e) => setForm({ ...form, priceAFN: e.target.value })}
              placeholder="150"
              aria-invalid={!!errors.priceAFN}
            />
            {errors.priceAFN && (
              <small className="field-error">{errors.priceAFN}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="meal-image">Local image</label>
            <select
              id="meal-image"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            >
              {[
                "kabuli-pulao",
                "chicken-qorma",
                "bolani",
                "orange-juice",
                "doogh",
                "green-tea",
                "firni",
                "sheer-yakh",
              ].map((n) => (
                <option key={n} value={`/images/${n}.svg`}>
                  {n.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="meal-ingredients">
              Ingredients description <span>*</span>
            </label>
            <textarea
              id="meal-ingredients"
              rows="3"
              value={form.ingredients}
              onChange={(e) =>
                setForm({ ...form, ingredients: e.target.value })
              }
              placeholder="Main ingredients..."
              aria-invalid={!!errors.ingredients}
            />
            {errors.ingredients && (
              <small className="field-error">{errors.ingredients}</small>
            )}
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
            />{" "}
            Available for ordering
          </label>
          <div className="form-buttons">
            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Add menu item"}
            </button>
            {editingId && (
              <button
                type="button"
                className="button button-light"
                onClick={() => {
                  setEditingId(null);
                  setForm(blank);
                  setErrors({});
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
        <div className="manage-list">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">CURRENT RECORDS</span>
              <h2>{meals.length} menu items</h2>
            </div>
          </div>
          <div className="manage-grid">
            {meals.map((meal) => (
              <MenuCard
                key={meal.id}
                meal={meal}
                manage
                editMeal={startEdit}
                deleteMeal={remove}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ManageMenu;
