const API_BASE = (
  import.meta.env.VITE_API_URL || "https://restaurant-online-order-6h69.onrender.com/api"
).replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  const token = localStorage.getItem("afghan_bites_token");
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${API_BASE}. Make sure the API server is running on port 4000.`,
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  health: () => request("/health"),
  getMenu: () => request("/menu"),
  createMeal: (meal) =>
    request("/menu", { method: "POST", body: JSON.stringify(meal) }),
  updateMeal: (id, meal) =>
    request(`/menu/${id}`, { method: "PUT", body: JSON.stringify(meal) }),
  deleteMeal: (id) => request(`/menu/${id}`, { method: "DELETE" }),
  createOrder: (order) =>
    request("/orders", { method: "POST", body: JSON.stringify(order) }),
  getOrders: () => request("/orders"),
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  register: (credentials) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  me: () => request("/auth/me"),
  sendContactMessage: (message) =>
    request("/contact-messages", {
      method: "POST",
      body: JSON.stringify(message),
    }),
};
