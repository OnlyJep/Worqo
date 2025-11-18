import React, { useState } from 'react';
import './../../../sass/components/browsewhite.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const BrowseWhite = () => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
  const [searchTerm, setSearchTerm] = useState("");

  const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];
  const demoResults = Array.from({ length: 10 }, (_, index) => index + 1);

  const handleSortOptionClick = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="browse">
      <Headerz />
      <Banner />
      <div className="browse-content">
        <div className="header-section">
          <h2 className="category-title">WHITE-COLLAR<br/>SERVICES</h2>
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
            {demoResults.map((i) => (
              <article key={i} className="result-card">
                <div className="card-inner">
                  <div className="avatar-col">
                    <img className="avatar" src="/images/avatar.svg" alt="avatar" />
                    <span className="status-dot" />
                    <span className="status-text">ACTIVE NOW</span>
                  </div>
                  <div className="details-col">
                    <div className="name-row">
                      <h5 className="name">Jane Doe</h5>
                      <span className="role">ADMIN ASSISTANT</span>
                    </div>
                    <div className="info-row">
                      <div className="info-block">
                        <div className="label">LOOKING FOR</div>
                        <div className="value">full-time work (8 hours/day)<br/>at ₱350.00/hour<br/>(₱28,000.00/month)</div>
                      </div>
                      <div className="info-block">
                        <div className="label">EDUCATION</div>
                        <div className="value">Bachelor's degree</div>
                      </div>
                    </div>
                    <div className="desc">
                      Experienced administrative assistant with strong organizational and communication skills.
                    </div>
                    <div className="skills-row">
                      <span className="chip">Office Administration: 3-5 years</span>
                      <span className="chip">Customer Support: 2-3 years</span>
                    </div>
                  </div>
                  <div className="action-col">
                    <button className="view-btn" type="button">VIEW PROFILE</button>
                    <div className="stars" aria-label="rating">★★★★★</div>
                  </div>
                </div>
              </article>
            ))}
            {demoResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No workers found matching your criteria.
              </div>
            )}
            {demoResults.length > 10 && (
              <div className="show-more-row">
                <button type="button" className="show-more-btn">Show More</button>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BrowseWhite;


