import React, { useEffect, useMemo, useState } from "react";
import { Utensils } from "lucide-react";
import "./styles.css";
import { initialMeals } from "./data.js";
import { api } from "./api.js";
import { Header } from "./components.jsx";
import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import Preorder from "./pages/Preorder.jsx";
import ManageMenu from "./pages/ManageMenu.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Orders from "./pages/Orders.jsx";

function App() {
  const [page, setPage] = useState("Home");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("afghan_bites_user") || "null");
    } catch {
      return null;
    }
  });
  const [meals, setMeals] = useState(initialMeals);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [apiError, setApiError] = useState("");
  useEffect(() => {
    let active = true;
    if (localStorage.getItem("afghan_bites_token"))
      api
        .me()
        .then((data) => {
          if (active) {
            setUser(data.user);
            localStorage.setItem(
              "afghan_bites_user",
              JSON.stringify(data.user),
            );
          }
        })
        .catch(() => {
          localStorage.removeItem("afghan_bites_token");
          localStorage.removeItem("afghan_bites_user");
          if (active) setUser(null);
        });
    api
      .getMenu()
      .then((items) => {
        if (active) {
          setMeals(items);
          setApiStatus("connected");
          setApiError("");
        }
      })
      .catch((error) => {
        if (active) {
          setApiStatus("offline");
          setApiError(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(credentials) {
    const data = await api.login(credentials);
    localStorage.setItem("afghan_bites_token", data.token);
    localStorage.setItem("afghan_bites_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }
  async function register(credentials) {
    const data = await api.register(credentials);
    localStorage.setItem("afghan_bites_token", data.token);
    localStorage.setItem("afghan_bites_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }
  function logout() {
    localStorage.removeItem("afghan_bites_token");
    localStorage.removeItem("afghan_bites_user");
    setUser(null);
    setPage("Home");
  }
  async function createMeal(meal) {
    const saved = await api.createMeal(meal);
    setMeals((old) => [...old, saved]);
    return saved;
  }
  async function updateMeal(id, meal) {
    const saved = await api.updateMeal(id, meal);
    setMeals((old) => old.map((item) => (item.id === id ? saved : item)));
    return saved;
  }
  async function deleteMeal(id) {
    await api.deleteMeal(id);
    setMeals((old) => old.filter((item) => item.id !== id));
  }
  const [basket, setBasket] = useState([]);
  const [fulfilment, setFulfilment] = useState("pickup");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("featured");
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const basketCount = basket.reduce((n, line) => n + line.quantity, 0);

  function addMeal(meal) {
    if (!meal.available) return;
    setBasket((old) => {
      const found = old.find((line) => line.id === meal.id);
      return found
        ? old.map((line) =>
            line.id === meal.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...old, { ...meal, quantity: 1 }];
    });
  }
  function changeQuantity(id, amount) {
    setBasket((old) =>
      old
        .map((line) =>
          line.id === id ? { ...line, quantity: line.quantity + amount } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }
  function removeMeal(id) {
    setBasket((old) => old.filter((line) => line.id !== id));
  }
  const filteredMeals = useMemo(() => {
    let result = meals.filter(
      (meal) =>
        (category === "All categories" || meal.category === category) &&
        (!hideUnavailable || meal.available) &&
        `${meal.name} ${meal.ingredients} ${meal.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    if (sort === "low") result.sort((a, b) => a.priceAFN - b.priceAFN);
    if (sort === "high") result.sort((a, b) => b.priceAFN - a.priceAFN);
    return result;
  }, [meals, category, hideUnavailable, search, sort]);

  return (
    <div className="app-shell">
      <div className="topline">
        <span>HERAT, AFGHANISTAN</span>
        <span>DEMO MENU · ALL PRICES IN AFN</span>
      </div>
      <Header
        page={page}
        setPage={setPage}
        basketCount={basketCount}
        user={user}
        onLogout={logout}
      />
      <main>
        {apiStatus === "connecting" && (
          <div className="api-status">
            Connecting to the restaurant database…
          </div>
        )}
        {apiStatus === "offline" && (
          <div className="api-status api-status-error">
            Database API unavailable. Showing sample menu data. Start the API
            and PostgreSQL to enable saved changes. {apiError}
          </div>
        )}
        {page === "Home" && <Home setPage={setPage} meals={meals} />}
        {page === "Menu" && (
          <Menu
            meals={meals}
            filteredMeals={filteredMeals}
            addMeal={addMeal}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            hideUnavailable={hideUnavailable}
            setHideUnavailable={setHideUnavailable}
            basket={basket}
            changeQuantity={changeQuantity}
            removeMeal={removeMeal}
            setBasket={setBasket}
            fulfilment={fulfilment}
            setFulfilment={setFulfilment}
            setPage={setPage}
          />
        )}
        {page === "Preorder" && (
          <Preorder
            basket={basket}
            fulfilment={fulfilment}
            setPage={setPage}
            onSubmitOrder={api.createOrder}
          />
        )}
        {page === "Manage Menu" &&
          (user?.role === "admin" ? (
            <ManageMenu
              meals={meals}
              createMeal={createMeal}
              updateMeal={updateMeal}
              deleteMeal={deleteMeal}
            />
          ) : (
            <div className="page-section narrow-page">
              <div className="demo-banner">
                <span>ADMIN ONLY</span>
                <p>Sign in with an administrator account to manage the menu.</p>
              </div>
              <button
                className="button button-primary"
                onClick={() => setPage("Login")}
              >
                Go to login
              </button>
            </div>
          ))}
        {page === "Orders" &&
          (user?.role === "admin" ? (
            <Orders />
          ) : (
            <div className="page-section narrow-page">
              <div className="demo-banner">
                <span>ADMIN ONLY</span>
                <p>Order management is available to administrators only.</p>
              </div>
              <button
                className="button button-primary"
                onClick={() => setPage("Login")}
              >
                Go to login
              </button>
            </div>
          ))}
        {page === "Login" && (
          <Login
            user={user}
            onLogin={login}
            onRegister={register}
            setPage={setPage}
          />
        )}
        {page === "About" && <About />}
        {page === "Contact" && <Contact />}
      </main>
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-mark">
              <Utensils size={20} />
            </span>
            <div>
              <strong>Afghan Bites</strong>
              <small>GOOD FOOD, MADE WITH CARE</small>
            </div>
          </div>
          <p>
            A small menu prototype with clear prices and no checkout surprises.
          </p>
          <div className="footer-links">
            {["Menu", "Preorder", "About", "Contact"].map((link) => (
              <button key={link} onClick={() => setPage(link)}>
                {link}
              </button>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Afghan Bites · Student prototype</span>
          <span>
            {apiStatus === "connected"
              ? "Connected to database"
              : "Database-backed demo"}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
