import React, { useState } from 'react';
import './../../../sass/components/browseblue.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner"; // Importing the Banner component
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const Browse = () => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
  const [searchTerm, setSearchTerm] = useState("");

  const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];

  const handleSortOptionClick = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="browse">
      <Headerz />
      <Banner /> {/* Adding the Banner component below Headerz */}
      <div className="browse-content">
        <div className="header-section">
          <h2 className="category-title">PLUMBING<br/>SERVICES</h2>
          <div className="search-bar">
            <input
              className="search-input"
              type="text"
              placeholder="Search a worker"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn" type="button" aria-label="Search">
              <IconSearch size={16} stroke={2} color="#ffffff" />
            </button>
          </div>
          <div className="sort-wrapper">
            <div
              className="sort-by"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <span>{selectedSortOption}</span>
              <IconChevronDown className="sort-icon" />
            </div>
            {isSortDropdownOpen && (
              <div className="sort-dropdown">
                {sortOptions.map((option) => (
                  <div
                    key={option}
                    className="sort-option"
                    onClick={() => handleSortOptionClick(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="content-layout">
          <aside className="filters-sidebar">
            <h4 className="filters-title">ACTIVE SKILL FILTERS</h4>
            <div className="filter-group">
              <label>EMPLOYMENT TYPE</label>
              <select>
                <option>Any</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>

            <div className="filter-group">
              <label>AVAILABILITY (HOURS PER DAY)</label>
              <div className="range">
                <input type="number" defaultValue={4} />
                <span>to</span>
                <input type="number" defaultValue={12} />
              </div>
            </div>

            <div className="filter-group">
              <label>HOURLY SALARY BETWEEN (USD)</label>
              <div className="range">
                <input type="number" defaultValue={5} />
                <span>to</span>
                <input type="number" defaultValue={12} />
              </div>
            </div>

            <div className="filter-group">
              <label>LAST ACTIVE</label>
              <select>
                <option>Any</option>
                <option>Today</option>
                <option>This week</option>
                <option>This month</option>
              </select>
            </div>

            <div className="filter-group">
              <input className="search-descriptions" type="text" placeholder="Search Profile Descriptions" />
            </div>

            <button className="apply-btn" type="button">SEARCH RESULTS</button>
          </aside>

          <section className="results-list">
            {[1,2,3].map((i) => (
              <article key={i} className="result-card">
                <div className="card-inner">
                  <div className="avatar-col">
                    <img className="avatar" src="/images/avatar.svg" alt="avatar" />
                    <span className="status-dot" />
                    <span className="status-text">ACTIVE NOW</span>
                  </div>
                  <div className="details-col">
                    <div className="name-row">
                      <h5 className="name">Lebron James</h5>
                      <span className="role">MASTER PLUMBER</span>
                    </div>
                    <div className="info-row">
                      <div className="info-block">
                        <div className="label">LOOKING FOR</div>
                        <div className="value">part-time work (4 hours/day)<br/>at ₱200.17/hour<br/>(₱12,004.00/month)</div>
                      </div>
                      <div className="info-block">
                        <div className="label">EDUCATION</div>
                        <div className="value">Associates degree</div>
                      </div>
                    </div>
                    <div className="desc">
                      I’m a customer service representative for almost 8 years now. I already handled healthcare account and also a sales account. I also have experience being a collection specialist.
                    </div>
                    <div className="skills-row">
                      <span className="chip">Construction and Engineering: Less than 6 months</span>
                      <span className="chip">Prior Authorization: 2-5 years</span>
                    </div>
                  </div>
                  <div className="action-col">
                    <button className="view-btn" type="button">VIEW PROFILE</button>
                    <div className="stars" aria-label="rating">★★★★★</div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Browse;


