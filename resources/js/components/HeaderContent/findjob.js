import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
	const [jobs, setJobs] = useState([]);
	const [filteredJobs, setFilteredJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();

	const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];


	const handleSortOptionClick = (option) => {
		setSelectedSortOption(option);
		setIsSortDropdownOpen(false);
	};

	const handleViewJob = (jobId) => {
		if (Array.isArray(jobs)) {
			const job = jobs.find(j => j.id === jobId);
			navigate(`/job/${jobId}`, { state: { job } });
		}
	};

	const handleRefineSearch = () => {
		if (Array.isArray(jobs)) {
			let filtered = jobs;
			
			// Apply search term filter if provided
			if (searchTerm.trim() !== "") {
				filtered = filtered.filter(job => 
					job.job_title.toLowerCase().includes(searchTerm.toLowerCase())
				);
			}
			
			// Apply employment type filter if selected
			if (selectedEmploymentType !== "") {
				filtered = filtered.filter(job => job.job_type === selectedEmploymentType);
			}
			
			setFilteredJobs(filtered);
		}
	};

	const handleClearFilters = () => {
		setSearchTerm("");
		setSelectedEmploymentType("");
		if (Array.isArray(jobs)) {
			setFilteredJobs(jobs);
		}
	};

	// Handle URL search parameters
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const searchParam = urlParams.get('search');
		if (searchParam) {
			setSearchTerm(searchParam);
		}
	}, [location.search]);

	useEffect(() => {
		let isMounted = true;
		
		const loadJobs = async () => {
			try {
				setLoading(true);
				
				// Get current user ID to exclude their own job posts
				const userData = JSON.parse(localStorage.getItem("user") || '{}');
				const currentUserId = userData.user?.id || userData.id;
				
				// Use search API if search term is provided
				const urlParams = new URLSearchParams(location.search);
				const searchParam = urlParams.get('search');
				
				let response;
				if (searchParam) {
					response = await axios.get(`/api/search/jobs?q=${encodeURIComponent(searchParam)}`);
					const jobsData = response.data.jobs || [];
					if (isMounted) {
						setJobs(jobsData);
						setFilteredJobs(jobsData);
					}
				} else {
					response = await axios.get('/api/jobposts?archived=false');
					console.log('API Response:', response.data); // Debug log
					
					// Handle the nested structure: response.data.job_posts.data
					const jobsData = response.data.job_posts?.data || response.data.data || response.data;
					console.log('Jobs Data:', jobsData); // Debug log
					
					const jobsArray = Array.isArray(jobsData) ? jobsData : [];
					console.log('Jobs Array:', jobsArray); // Debug log
					
					// Filter out current user's job posts
					const filteredJobsArray = currentUserId 
						? jobsArray.filter(job => job.profile_id !== currentUserId)
						: jobsArray;
					
					console.log('Filtered Jobs (excluding own):', filteredJobsArray.length, 'out of', jobsArray.length);
					
					if (isMounted) {
						setJobs(filteredJobsArray);
						setFilteredJobs(filteredJobsArray);
					}
				}
			} catch (error) {
				console.error('Error fetching jobs:', error);
				if (isMounted) {
					setJobs([]);
					setFilteredJobs([]);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadJobs();

		return () => {
			isMounted = false;
		};
	}, [location.search]);

	useEffect(() => {
		if (Array.isArray(jobs)) {
			if (searchTerm.trim() === "") {
				// If no search term, show all jobs
				setFilteredJobs(jobs);
			} else {
				// Only filter when user has actually typed something
				setFilteredJobs(jobs.filter(job => job.job_title.toLowerCase().includes(searchTerm.toLowerCase())));
			}
		}
	}, [searchTerm, jobs]);

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
						<button className="clear-btn" type="button" onClick={handleClearFilters}>
							CLEAR FILTERS
						</button>
					</aside>

					<section className="results-list">
						{loading ? (
							<div className="loading-state">
								<div className="spinner"></div>
								<p>Loading jobs...</p>
							</div>
						) : filteredJobs.length === 0 ? (
							<div className="empty-state">
								<p>No jobs found matching your criteria.</p>
							</div>
						) : (
							filteredJobs.map((job) => (
								<article key={job.id} className="result-card job-card">
									<div className="top-strip" />
									<div className="job-content">
										<div className="job-header">
											<h3 className="job-title">{job.job_title}</h3>
											<button className="job-view-btn" type="button" onClick={() => handleViewJob(job.id)}>VIEW JOB</button>
										</div>
										<div className="job-meta">
											<div className="meta-line">
												{job.profile?.first_name} {job.profile?.middlename} {job.profile?.last_name} {job.profile?.suffix?.suffix_name} – Posted on {new Date(job.created_at).toLocaleDateString()}
											</div>
											<div className="meta-line salary">₱{job.salary}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</div>
										</div>
										<div className="job-section-title">Job Overview/Description</div>
										<p className="job-desc">{job.description}</p>
										<div className="job-section-title">Skills Required</div>
										<div className="job-skills">
											{job.skills && job.skills.map((skill, index) => (
												<span key={index} className="job-chip">
													{skill.name} ({skill.experience || 'No experience specified'})
												</span>
											))}
										</div>
										<div className="job-section-title">Application Period</div>
										<div className="job-timeline">
											<div className="timeline-item">
												<span className="timeline-label">Start:</span>
												<span className="timeline-value">{new Date(job.application_start).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
											</div>
											<div className="timeline-item">
												<span className="timeline-label">Deadline:</span>
												<span className="timeline-value">{new Date(job.application_deadline).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
											</div>
										</div>
									</div>
								</article>
							))
						)}
					</section>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default FindJob;