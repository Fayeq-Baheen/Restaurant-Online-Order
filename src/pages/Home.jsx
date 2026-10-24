import React from "react";
import { Clock, MapPin } from "lucide-react";

function Home({ setPage, meals }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span /> FRESHLY PREPARED, LOCALLY LOVED
          </div>
          <h1>
            Comfort food.
            <br />
            <em>Afghan soul.</em>
          </h1>
          <p>
            Traditional favourites and refreshing drinks, made with care. Choose
            your meals and preview a preorder in just a few steps.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              onClick={() => setPage("Menu")}
            >
              Explore the menu <span>→</span>
            </button>
            <button
              className="button button-outline"
              onClick={() => setPage("About")}
            >
              Our story
            </button>
          </div>
          <div className="hero-meta">
            <span>
              <Clock size={16} /> Prepared fresh daily
            </span>
            <span>
              <MapPin size={16} /> Herat, Afghanistan
            </span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/images/hero-table.svg"
            alt="Illustration of an Afghan meal with rice, bread and tea"
          />
          <div className="hero-sticker">
            <span>LOCAL</span>
            <strong>flavour</strong>
            <small>made with care</small>
          </div>
        </div>
      </section>
      <section className="feature-strip">
        <div>
          <span className="feature-icon">✳</span>
          <p>
            <strong>Fresh ingredients</strong>
            <small>Simple, honest cooking</small>
          </p>
        </div>
        <div>
          <span className="feature-icon">⌂</span>
          <p>
            <strong>Pickup or delivery</strong>
            <small>Know the fee upfront</small>
          </p>
        </div>
        <div>
          <span className="feature-icon">♡</span>
          <p>
            <strong>Local favourites</strong>
            <small>Made for sharing</small>
          </p>
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A TASTE OF OUR MENU</span>
            <h2>Made for your appetite</h2>
          </div>
          <button className="text-button" onClick={() => setPage("Menu")}>
            View full menu →
          </button>
        </div>
        <div className="category-tiles">
          <button
            onClick={() => setPage("Menu")}
            className="category-tile tile-main"
          >
            <img src="/images/kabuli-pulao.svg" alt="" />
            <span>01 / THE CLASSICS</span>
            <h3>Main meals</h3>
            <p>Hearty plates, Afghan favourites.</p>
          </button>
          <button
            onClick={() => setPage("Menu")}
            className="category-tile tile-drinks"
          >
            <img src="/images/orange-juice.svg" alt="" />
            <span>02 / REFRESH & RESET</span>
            <h3>Drinks</h3>
            <p>Fresh sips for every meal.</p>
          </button>
          <button
            onClick={() => setPage("Menu")}
            className="category-tile tile-desserts"
          >
            <img src="/images/firni.svg" alt="" />
            <span>03 / SOMETHING SWEET</span>
            <h3>Desserts</h3>
            <p>A little treat to finish.</p>
          </button>
        </div>
      </section>
      <section className="home-cta">
        <div>
          <span className="eyebrow">YOUR NEXT FAVOURITE MEAL</span>
          <h2>
            Build your order.
            <br />
            See the full cost first.
          </h2>
          <p>
            Choose pickup for no extra charge, or delivery for a fixed 60 AFN
            practice fee.
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setPage("Menu")}
        >
          Start a preorder →
        </button>
      </section>
    </>
  );
}

export default Home;
