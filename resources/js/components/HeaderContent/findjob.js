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
				filtered = filtered.filter(job => {
					const searchLower = searchTerm.toLowerCase();
					
					// Search in job title
					const titleMatch = job.job_title.toLowerCase().includes(searchLower);
					
					// Search in skills
					const skillsMatch = job.skills && job.skills.some(skill => 
						skill.name.toLowerCase().includes(searchLower)
					);
					
					// Search in job description
					const descriptionMatch = job.description && 
						job.description.toLowerCase().includes(searchLower);
					
					return titleMatch || skillsMatch || descriptionMatch;
				});
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

		// Add event listener for storage changes (when jobs are updated)
		const handleStorageChange = (e) => {
			if (e.key === 'jobUpdated') {
				console.log('Job updated detected, refreshing jobs list...');
				loadJobs();
				// Clear the storage event
				localStorage.removeItem('jobUpdated');
			}
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			isMounted = false;
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [location.search]);

	useEffect(() => {
		if (Array.isArray(jobs)) {
			if (searchTerm.trim() === "") {
				// If no search term, show all jobs
				setFilteredJobs(jobs);
			} else {
				// Filter jobs by search term in title, skills, and description
				const searchLower = searchTerm.toLowerCase();
				setFilteredJobs(jobs.filter(job => {
					// Search in job title
					const titleMatch = job.job_title.toLowerCase().includes(searchLower);
					
					// Search in skills
					const skillsMatch = job.skills && job.skills.some(skill => 
						skill.name.toLowerCase().includes(searchLower)
					);
					
					// Search in job description
					const descriptionMatch = job.description && 
						job.description.toLowerCase().includes(searchLower);
					
					return titleMatch || skillsMatch || descriptionMatch;
				}));
			}
		}
	}, [searchTerm, jobs]);

	return (
		<div className="browse">
			<Headerz />
			<Banner />
			<div className="browse-content">
				<div className="header-section">
					<h2 className="category-title">FINDJOBS</h2>
					<div className="search-bar">
						<input
							className="search-input"
							type="text"
							placeholder="Search jobs, skills, or descriptions"
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
									<div className="job-content" onClick={() => handleViewJob(job.id)} style={{ cursor: 'pointer' }}>
										<div className="job-header">
											<h3 className="job-title">{job.job_title}</h3>
										</div>
										<div className="job-meta">
											<div className="meta-left">
												<div className="meta-line">
													{job.profile?.first_name} {job.profile?.middlename} {job.profile?.last_name} {job.profile?.suffix?.suffix_name} – Posted on {new Date(job.created_at).toLocaleDateString()}
												</div>
												<div className="meta-line salary">₱{job.salary}/{job.salary_type === 'per_hour' ? 'hour' : 'month'}</div>
											</div>
											<div className="findjob-job-type" style={{
												color: job.job_type === 'part-time' ? '#3b82f6' : 
													   job.job_type === 'full-time' ? '#10b981' : 
													   job.job_type === 'contract' ? '#f59e0b' : '#f59e0b'
											}}>
												{job.job_type || 'Any'}
											</div>
										</div>
										<div className="findjob-section-title">Job Overview/Description</div>
										<p className="findjob-desc">
											{job.description && job.description.length > 150 
												? `${job.description.substring(0, 150)}...` 
												: job.description}
										</p>
										<div className="findjob-section-title">Skills Required</div>
										<div className="findjob-skills">
											{job.skills && job.skills.map((skill, index) => (
												<span key={index} className="findjob-chip">
													{skill.name} ({skill.experience || 'No experience specified'})
												</span>
											))}
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