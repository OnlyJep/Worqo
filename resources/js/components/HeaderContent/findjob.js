import React, { useState } from 'react';
import './../../../sass/components/findjob.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const FindJob = () => {
	const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
	const [selectedSortOption, setSelectedSortOption] = useState("Sort by");
	const [searchTerm, setSearchTerm] = useState("");

	const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];

	const jobs = [
		{
			id: 1,
			title: "Invoice Annotation Specialist",
			location: "Dumangilas",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			description:
				"We are looking for a skilled and detail-oriented Invoice Annotation Specialist to join our team. The successful candidate will be responsible for reviewing and annotating invoice documents with high accuracy, ensuring all relevant fields are correctly labeled. This role requires strong attention to detail and familiarity with specific annotation guidelines.",
			skills: ["Accounts Payable", "Data Entry", "Attention to Detail"],
		},
		{
			id: 2,
			title: "Mechanical Engineer",
			location: "Solano",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			description:
				"We are seeking a motivated Mechanical Engineer to join our team. The successful candidate will be responsible for designing, analyzing, and overseeing mechanical systems, tools, and machinery to ensure efficiency, safety, and reliability.",
			skills: ["Mechanical Design & Drafting", "Engineering Analysis"],
		},
		{
			id: 3,
			title: "Mechanical Engineer",
			location: "Malabo",
			postedAt: "July 07, 2025",
			salary: "₱ 30,000.00/month",
			description:
				"We are looking for a skilled and detail-oriented Mechanical Engineer to join our team for project and general tasks. Responsibilities include designing, analyzing, and overseeing mechanical systems to ensure efficiency, safety, and reliability.",
			skills: ["Mechanical Design & Drafting", "Engineering Analysis"],
		},
	];

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
							<select>
								<option>Any</option>
							</select>
						</div>

						<button className="refine-btn" type="button">REFINE SEARCH RESULTS</button>
					</aside>

					<section className="results-list">
						{jobs.map((job) => (
							<article key={job.id} className="result-card job-card">
								<div className="top-strip" />
								<div className="job-content">
									<div className="job-header">
										<h3 className="job-title">{job.title}</h3>
										<button className="job-view-btn" type="button">VIEW JOB</button>
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


