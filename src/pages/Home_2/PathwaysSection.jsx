import React from "react";
import { Link } from "react-router-dom";

const PathwaysSection = () => {
  return (
    <section className="home2-section home2-pathways">
      <div className="home2-pathways-header home2-pathways-header-center">
        <span className="home2-eyebrow-pill">Counselling and Colleges</span>
        <h2 className="home2-heading">JOSAA counselling and college pathways</h2>
      </div>

      <div className="home2-pathways-grid">
        <article className="home2-path-card home2-path-card-pop">
          <div className="home2-path-text">
            <h3>JOSAA counselling</h3>
            <p>
              IITs, NITs, IIITs, and more - get into India's top institutes by following the counselling process.
            </p>
            <Link className="home2-link" to="/College">
              Find more about India's top institutes here
            </Link>
          </div>
          <div className="home2-path-visual" aria-hidden="true">
            <div className="home2-path-image">JOSAA guide</div>
          </div>
        </article>

        <article className="home2-path-card home2-path-card-pop">
          <div className="home2-path-text">
            <h3>More important colleges</h3>
            <p>
              BITS, VIT, SRM - these colleges have separate entrance exams and lead the country.
            </p>
            <Link className="home2-link" to="/ComingSoon">
              Find more about these institutes here
            </Link>
          </div>
          <div className="home2-path-visual" aria-hidden="true">
            <div className="home2-path-image">Entrance tracks</div>
          </div>
        </article>

        <article className="home2-path-card home2-path-card-pop">
          <div className="home2-path-text">
            <h3>Other colleges</h3>
            <p className="home2-path-text-filler">
              BITSAT, VITEEE, and state-level exams - explore more pathways beyond the mainstream routes.
            </p>
            <Link className="home2-link" to="/ComingSoon">
              Explore more options here
            </Link>
          </div>
          <div className="home2-path-visual" aria-hidden="true">
            <div className="home2-path-image">More pathways</div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default PathwaysSection;