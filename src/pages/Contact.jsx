import React, { useState } from "react";
import { api } from "../api.js";
import { MapPin, Phone, Clock } from "lucide-react";

function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.sendContactMessage(form);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="page-section narrow-page">
      <div className="page-heading">
        <span className="eyebrow">GET IN TOUCH</span>
        <h1>Contact the team</h1>
        <p>
          Send a message to the team. Your message will be saved for follow-up.
        </p>
      </div>
      <div className="contact-layout">
        <div className="contact-info">
          <div>
            <span>
              <MapPin />
            </span>
            <p>
              <strong>Visit us</strong>
              <small>
                Herat, Afghanistan
                <br />
                Sample address for this prototype
              </small>
            </p>
          </div>
          <div>
            <span>
              <Phone />
            </span>
            <p>
              <strong>Call us</strong>
              <small>
                +93 700 000 000
                <br />
                Sample phone number
              </small>
            </p>
          </div>
          <div>
            <span>
              <Clock />
            </span>
            <p>
              <strong>Opening hours</strong>
              <small>
                Every day · 10:00 AM – 9:00 PM
                <br />
                Sample hours
              </small>
            </p>
          </div>
        </div>
        <form className="form-card" onSubmit={submit}>
          <h2>Send a message</h2>
          {sent && (
            <p className="success-message">
              Your message has been saved successfully.
            </p>
          )}
          {error && <p className="field-error">{error}</p>}
          <div className="field">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              rows="4"
              required
              minLength="10"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="How can we help?"
            />
          </div>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "Sending…" : "Send message →"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Contact;
