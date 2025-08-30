import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './../../../sass/components/browseblue.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const Browse = () => {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const navigate = useNavigate();

  const workers = [
    { id: 1, name: "Lebron James", role: "Master Plumber", service: "Plumbing Services", status: "ACTIVE NOW", hourlyRate: 200.17, description: "Experienced plumber with over 10 years in the field.", education: "Associates Degree", skills: ["Pipe Installation", "Leak Repair"], experience: "10+ years" },
    { id: 2, name: "John Doe", role: "Apprentice Plumber", service: "Plumbing Services", status: "ACTIVE NOW", hourlyRate: 150.00, description: "Skilled apprentice with a focus on residential plumbing.", education: "High School Diploma", skills: ["Drain Cleaning", "Fixture Installation"], experience: "2-5 years" },
    { id: 3, name: "Jane Smith", role: "Pipefitter", service: "Plumbing Services", status: "ACTIVE 2 HOURS AGO", hourlyRate: 180.50, description: "Certified pipefitter specializing in commercial projects.", education: "Trade School Certificate", skills: ["Welding", "System Maintenance"], experience: "5-10 years" },
  ];

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const serviceName = searchParams.get('service') || 'Plumbing Services';

  useEffect(() => {
    let sortedWorkers = [...workers].filter(worker =>
      worker.service.toLowerCase() === serviceName.toLowerCase() &&
      worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedSortOption === "Price: High-Low") {
      sortedWorkers.sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (selectedSortOption === "Price: Low-High") {
      sortedWorkers.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (selectedSortOption === "Newest") {
      sortedWorkers.sort((a, b) => a.id - b.id);
    }

    setFilteredWorkers(sortedWorkers);
  }, [serviceName, selectedSortOption, searchTerm]);

  const sortOptions = ["Sort by", "Featured", "Newest", "Price: High-Low", "Price: Low-High"];

  const handleSortOptionClick = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownOpen(false);
  };

  const handleViewProfile = (workerId) => {
    navigate(`/profile/${workerId}?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="browse">
      <Headerz />
      <Banner />
      <div className="browse-content">
        <div className="header-section">
          <h2 className="category-title">{serviceName.toUpperCase()}</h2>
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
                <input type="number" defaultValue={4} min="0" max="24" />
                <span>to</span>
                <input type="number" defaultValue={12} min="0" max="24" />
              </div>
            </div>
            <div className="filter-group">
              <label>HOURLY SALARY BETWEEN (USD)</label>
              <div className="range">
                <input type="number" defaultValue={50} min="0" />
                <span>to</span>
                <input type="number" defaultValue={200} min="0" />
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
            {filteredWorkers.map((worker) => (
              <article key={worker.id} className="result-card">
                <div className="card-inner">
                  <div className="avatar-col">
                    <img className="avatar" src="/images/avatar.svg" alt={`${worker.name}'s avatar`} />
                    <span className="status-text">{worker.status === "ACTIVE NOW" ? "● Active now" : worker.status}</span>
                  </div>
                  <div className="details-col">
                    <div className="name-row">
                      <h5 className="name">{worker.name}</h5>
                      <span className="role">{worker.role}</span>
                    </div>
                    <div className="info-row">
                      <div className="info-block">
                        <div className="label">LOOKING FOR</div>
                        <div className="value">Part-time work (4 hours/day)<br/>at ${worker.hourlyRate}/hour<br/>(${worker.hourlyRate * 4 * 30}/month)</div>
                      </div>
                      <div className="info-block">
                        <div className="label">EDUCATION</div>
                        <div className="value">{worker.education}</div>
                      </div>
                    </div>
                    <div className="desc">{worker.description}</div>
                    <div className="skills-row">
                      {worker.skills.map((skill, index) => (
                        <span key={index} className="chip">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="action-col">
                    <button className="view-btn" type="button" onClick={() => handleViewProfile(worker.id)}>VIEW PROFILE</button>
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