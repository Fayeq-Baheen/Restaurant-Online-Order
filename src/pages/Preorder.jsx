import React, { useState } from "react";
import { OrderSummary } from "../components.jsx";
import { money } from "../data.js";

function Preorder({ basket, fulfilment, setPage, onSubmitOrder }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savedOrder, setSavedOrder] = useState(null);
  const subtotal = basket.reduce(
    (sum, line) => sum + line.priceAFN * line.quantity,
    0,
  );
  const fee = fulfilment === "delivery" ? 60 : 0;
  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!phone.trim()) next.phone = "Please enter your phone number.";
    if (!date) next.date = "Please choose a requested date.";
    if (basket.length === 0)
      next.basket = "Add at least one available meal before previewing.";
    setErrors(next);
    if (!Object.keys(next).length) {
      setSaving(true);
      setSubmitError("");
      try {
        const order = await onSubmitOrder({
          name,
          phone,
          date,
          notes,
          fulfilment,
          items: basket.map((line) => ({
            id: line.id,
            quantity: line.quantity,
          })),
        });
        setSavedOrder(order);
        setPreview(true);
      } catch (error) {
        setSubmitError(error.message);
      } finally {
        setSaving(false);
      }
    }
  }
  return (
    <section className="page-section narrow-page">
      <div className="page-heading">
        <span className="eyebrow">STEP 02 / REVIEW</span>
        <h1>Preorder details</h1>
        <p>
          Submit your details to save an order request in the restaurant
          database.
        </p>
      </div>
      <div className="demo-banner">
        <span>ORDER</span>
        <p>
          <strong>No online payment</strong>
          <br />
          Your order request is saved to the database for staff to review.
        </p>
      </div>
      {errors.basket && (
        <p className="field-error basket-error">
          {errors.basket}{" "}
          <button className="text-button" onClick={() => setPage("Menu")}>
            Back to menu
          </button>
        </p>
      )}
      {submitError && <p className="field-error basket-error">{submitError}</p>}
      {!preview ? (
        <div className="preorder-layout">
          <form className="form-card" onSubmit={submit} noValidate>
            <h2>Your details</h2>
            <div className="field">
              <label htmlFor="sample-name">
                Name <span>*</span>
              </label>
              <input
                id="sample-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <small className="field-error">{errors.name}</small>
              )}
            </div>
            <div className="field">
              <label htmlFor="sample-phone">
                Phone number <span>*</span>
              </label>
              <input
                id="sample-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 070 123 4567"
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <small className="field-error">{errors.phone}</small>
              )}
            </div>
            <div className="field">
              <label htmlFor="requested-date">
                Requested date <span>*</span>
              </label>
              <input
                id="requested-date"
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <small className="field-error">{errors.date}</small>
              )}
            </div>
            <div className="field">
              <label htmlFor="order-notes">
                Notes <small>(optional)</small>
              </label>
              <textarea
                id="order-notes"
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions?"
              />
            </div>
            <button
              className="button button-primary full-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving order…" : "Place preorder request"}{" "}
              <span>→</span>
            </button>
          </form>
          <OrderSummary
            basket={basket}
            fulfilment={fulfilment}
            subtotal={subtotal}
            fee={fee}
          />
        </div>
      ) : (
        <div className="preview-card">
          <div className="preview-success">✓</div>
          <span className="eyebrow">ORDER REQUEST SAVED</span>
          <h2>Thanks, {name}.</h2>
          <p>
            Your request number is <strong>{savedOrder?.orderNumber}</strong>.
            Status: {savedOrder?.status}. Staff can review it in the database.
          </p>
          <div className="preview-details">
            <div>
              <span>Name</span>
              <strong>{name}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{phone}</strong>
            </div>
            <div>
              <span>Requested date</span>
              <strong>{date}</strong>
            </div>
            <div>
              <span>Fulfilment</span>
              <strong>
                {fulfilment === "delivery" ? "Delivery" : "Pickup"}
              </strong>
            </div>
            {notes && (
              <div>
                <span>Notes</span>
                <strong>{notes}</strong>
              </div>
            )}
          </div>
          <OrderSummary
            basket={basket}
            fulfilment={fulfilment}
            subtotal={subtotal}
            fee={fee}
          />
          <div className="preview-actions">
            <button
              className="button button-light"
              onClick={() => setPreview(false)}
            >
              Edit details
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                setPreview(false);
                setPage("Menu");
              }}
            >
              Back to menu
            </button>
          </div>
          <p className="demo-note">
            ORDER REQUEST SAVED · NO ONLINE PAYMENT WAS COLLECTED
          </p>
        </div>
      )}
    </section>
  );
}

export default Preorder;
