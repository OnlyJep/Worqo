import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../sass/components/findjob.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const FindJob = () => {
	const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
	const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
	const [filteredJobs, setFilteredJobs] = useState([]);
	const navigate = useNavigate();

	const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];

	const jobs = [
		{
			id: 1,
			title: "Invoice Annotation Specialist",
			location: "Dumangilas",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			employmentType: "Full-time",
			description:
				"We are looking for a skilled and detail-oriented Invoice Annotation Specialist to join our team. The successful candidate will be responsible for reviewing and annotating invoice documents with high accuracy, ensuring all relevant fields are correctly labeled. This role requires strong attention to detail and familiarity with specific annotation guidelines.",
			skills: ["Accounts Payable", "Data Entry", "Attention to Detail"],
			requirements: { minRank: "Gold 3" },
		},
		{
			id: 2,
			title: "Mechanical Engineer",
			location: "Solano",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			employmentType: "Part-time",
			description:
				"We are seeking a motivated Mechanical Engineer to join our team. The successful candidate will be responsible for designing, analyzing, and overseeing mechanical systems, tools, and machinery to ensure efficiency, safety, and reliability.",
			skills: ["Mechanical Design & Drafting", "Engineering Analysis"],
			requirements: { minRank: "Platinum 1" },
		},
		{
			id: 3,
			title: "Mechanical Engineer",
			location: "Malabo",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			employmentType: "One-time job",
			description:
				"We are looking for a skilled and detail-oriented Mechanical Engineer to join our team for project and general tasks. Responsibilities include designing, analyzing, and overseeing mechanical systems to ensure efficiency, safety, and reliability.",
			skills: ["Mechanical Design & Drafting", "Engineering Analysis"],
			requirements: { minRank: "Gold 2" },
		},
	];

	const handleSortOptionClick = (option) => {
		setSelectedSortOption(option);
		setIsSortDropdownOpen(false);
	};

	const handleViewJob = (jobId) => {
		const job = jobs.find(j => j.id === jobId);
		navigate(`/job/${jobId}`, { state: { job } });
	};

	const handleRefineSearch = () => {
		const filtered = jobs.filter(job => 
			job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(selectedEmploymentType === "" || job.employmentType === selectedEmploymentType)
		);
		setFilteredJobs(filtered);
	};

	useEffect(() => {
		setFilteredJobs(jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase())));
	}, [searchTerm]);

	return (
		<div className="browse">
			<Headerz />
			<Banner />
			<div className="browse-content">
				<div className="header-section">
					<h2 className="category-title">FIND<br/>JOBS</h2>
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
					<aside className="filters-sidebar findjob-sidebar">
						<h4 className="filters-title">+/− ACTIVE SKILL FILTERS</h4>
						<div className="filter-group">
							<label>EMPLOYMENT TYPE</label>
							<select
								value={selectedEmploymentType}
								onChange={(e) => setSelectedEmploymentType(e.target.value)}
							>
								<option value="">Any</option>
								<option value="Full-time">Full-time</option>
								<option value="Part-time">Part-time</option>
								<option value="One-time job">One-time job</option>
							</select>
						</div>

						<button className="refine-btn" type="button" onClick={handleRefineSearch}>
							REFINE SEARCH RESULTS
						</button>
					</aside>

					<section className="results-list">
						{filteredJobs.map((job) => (
							<article key={job.id} className="result-card job-card">
								<div className="top-strip" />
								<div className="job-content">
									<div className="job-header">
										<h3 className="job-title">{job.title}</h3>
										<button className="job-view-btn" type="button" onClick={() => handleViewJob(job.id)}>VIEW JOB</button>
									</div>
									<div className="job-meta">
										<div className="meta-line">{job.location} – Posted on {job.postedAt}</div>
										<div className="meta-line salary">{job.salary}</div>
									</div>
									<div className="job-section-title">Job Overview/Description</div>
									<p className="job-desc">{job.description}</p>
									<div className="job-section-title">Skills Required</div>
									<div className="job-skills">
										{job.skills.map((s) => (
											<span key={s} className="job-chip">{s}</span>
										))}
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

export default FindJob;