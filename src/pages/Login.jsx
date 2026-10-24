import React, { useState } from "react";

export default function Login({ onLogin, onRegister, setPage, user }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await onLogin({ email, password })
          : await onRegister({ name, email, phone, password });
      if (result) setPage(result.role === "admin" ? "Orders" : "Home");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <section className="page-section narrow-page">
        <div className="page-heading">
          <span className="eyebrow">ACCOUNT</span>
          <h1>You are signed in</h1>
          <p>
            Signed in as {user.name} ({user.role}).
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setPage(user.role === "admin" ? "Orders" : "Home")}
        >
          {user.role === "admin" ? "Open order dashboard" : "Return to menu"}
        </button>
      </section>
    );
  return (
    <section className="page-section narrow-page auth-page">
      <div className="page-heading">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>{mode === "login" ? "Welcome back" : "Create customer account"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to continue. Admin tools appear only for administrator accounts."
            : "Customer accounts cannot access restaurant management tools."}
        </p>
      </div>
      <form className="form-card auth-card" onSubmit={submit}>
        <div className="auth-switch">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="auth-name">Full name</label>
            <input
              id="auth-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="auth-phone">Phone number</label>
            <input
              id="auth-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            minLength="8"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
          {mode === "register" && <small>At least 8 characters.</small>}
        </div>
        {error && <p className="field-error auth-error">{error}</p>}
        <button className="button button-primary full-button" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <p className="auth-note">
          Administrator accounts are configured on the server. Public
          registration always creates a customer account.
        </p>
      </form>
    </section>
  );
}
