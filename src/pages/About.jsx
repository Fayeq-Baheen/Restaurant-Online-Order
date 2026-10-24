import React from "react";

function About() {
  return (
    <section className="page-section narrow-page">
      <div className="page-heading">
        <span className="eyebrow">OUR STORY</span>
        <h1>Food that feels like home.</h1>
        <p>
          Afghan Bites is a fictional neighbourhood restaurant created as a
          beginner-friendly ordering prototype.
        </p>
      </div>
      <div className="story-card">
        <img src="/images/hero-table.svg" alt="Illustration of a meal table" />
        <div>
          <h2>Local ingredients. Familiar flavours.</h2>
          <p>
            Our sample menu celebrates comforting Afghan favourites, from Kabuli
            Pulao to mint doogh and creamy firni. The dishes, prices and
            availability are demonstration data, not a live restaurant offer.
          </p>
          <p>
            We designed this prototype so customers can see every cost before
            previewing a request, with no surprise delivery fee lurking at the
            end.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
