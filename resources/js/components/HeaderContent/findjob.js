import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
	import './../../../sass/components/findjob.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

const FindJob = () => {
	const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [selectedSortOption, setSelectedSortOption] = useState("Newest");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
	const [jobs, setJobs] = useState([]);
	const [filteredJobs, setFilteredJobs] = useState([]); // All filtered and sorted jobs
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const perPage = 5; // Show 5 jobs per page
	const navigate = useNavigate();
	const location = useLocation();

	const sortOptions = ["Featured", "Newest", "Salary: High-Low", "Salary: Low-High"];

	const handleSortOptionClick = (option) => {
		setSelectedSortOption(option);
		setIsSortDropdownOpen(false);
		applyFiltersAndSort();
	};

	// Apply sorting to filtered jobs
	const applySorting = (jobsToSort, sortOption = null) => {
		if (!Array.isArray(jobsToSort) || jobsToSort.length === 0) {
			return jobsToSort;
		}

		const sortBy = sortOption || selectedSortOption;
		if (sortBy === "Sort by" || !sortBy) {
			// Default: Sort by newest
			return [...jobsToSort].sort((a, b) => {
				return new Date(b.created_at) - new Date(a.created_at);
			});
		}

		const sorted = [...jobsToSort];
		
		switch (sortBy) {
			case "Featured":
				// Featured: Sort by most applications or views (if available), then by newest
				return sorted.sort((a, b) => {
					const aApplications = a.applications?.length || a.application_count || 0;
					const bApplications = b.applications?.length || b.application_count || 0;
					if (bApplications !== aApplications) {
						return bApplications - aApplications; // Most applications first
					}
					// If same number of applications, sort by newest
					return new Date(b.created_at) - new Date(a.created_at);
				});
			
			case "Newest":
				// Newest: Sort by created_at descending
				return sorted.sort((a, b) => {
					return new Date(b.created_at) - new Date(a.created_at);
				});
			
			case "Salary: High-Low":
				// Salary: High to Low
				return sorted.sort((a, b) => {
					const salaryA = parseFloat(a.salary) || 0;
					const salaryB = parseFloat(b.salary) || 0;
					return salaryB - salaryA;
				});
			
			case "Salary: Low-High":
				// Salary: Low to High
				return sorted.sort((a, b) => {
					const salaryA = parseFloat(a.salary) || 0;
					const salaryB = parseFloat(b.salary) || 0;
					return salaryA - salaryB;
				});
			
			default:
				// Default: Sort by newest
				return sorted.sort((a, b) => {
					return new Date(b.created_at) - new Date(a.created_at);
				});
		}
	};

	const handleViewJob = (jobId) => {
		if (Array.isArray(jobs)) {
			const job = jobs.find(j => j.id === jobId);
			navigate(`/job/${jobId}`, { state: { job } });
		}
	};

	// Helper function to normalize skills data
	const normalizeSkills = (skills) => {
		if (!skills) return [];
		if (Array.isArray(skills)) {
			// If it's already an array, ensure each item has the expected structure
			return skills.map(skill => {
				if (typeof skill === 'string') {
					return { name: skill, experience: 'No experience specified' };
				}
				if (typeof skill === 'object' && skill !== null) {
					return {
						name: skill.name || skill.skill_name || String(skill),
						experience: skill.experience || skill.experience_level || 'No experience specified'
					};
				}
				return { name: String(skill), experience: 'No experience specified' };
			});
		}
		if (typeof skills === 'string') {
			try {
				const parsed = JSON.parse(skills);
				if (Array.isArray(parsed)) {
					return normalizeSkills(parsed);
				}
			} catch (e) {
				// If parsing fails, treat as a single skill name
				return [{ name: skills, experience: 'No experience specified' }];
			}
		}
		return [];
	};

	// Apply all filters and sorting
	const applyFiltersAndSort = useCallback(() => {
		console.log('applyFiltersAndSort called with:', {
			jobsCount: Array.isArray(jobs) ? jobs.length : 0,
			searchTerm,
			selectedEmploymentType,
			selectedSortOption
		});
		if (Array.isArray(jobs) && jobs.length > 0) {
			let filtered = jobs;
			
			// Apply search term filter if provided
			if (searchTerm.trim() !== "") {
				filtered = filtered.filter(job => {
					const searchLower = searchTerm.toLowerCase();
					
					// Search in job title
					const titleMatch = job.job_title?.toLowerCase().includes(searchLower);
					
					// Search in skills - normalize first to ensure it's an array
					const normalizedSkills = normalizeSkills(job.skills);
					const skillsMatch = Array.isArray(normalizedSkills) && normalizedSkills.length > 0 && 
						normalizedSkills.some(skill => 
							skill.name?.toLowerCase().includes(searchLower)
						);
					
					// Search in job description
					const descriptionMatch = job.description && 
						job.description.toLowerCase().includes(searchLower);
					
					return titleMatch || skillsMatch || descriptionMatch;
				});
			}
			
			// Apply employment type filter if selected
			if (selectedEmploymentType !== "") {
				filtered = filtered.filter(job => {
					// Map legacy job types to new format for filtering
					const jobType = job.job_type?.toLowerCase();
					if (selectedEmploymentType === 'per_day') {
						return jobType === 'per_day' || jobType === 'full-time' || jobType === 'part-time';
					} else if (selectedEmploymentType === 'per_job') {
						return jobType === 'per_job' || jobType === 'contract' || jobType === 'freelance' || jobType === 'one-time job';
					}
					return job.job_type === selectedEmploymentType;
				});
			}
			
			// Filter out individual jobs that have already hired a worker
			const beforeIndividualFilter = filtered.length;
			filtered = filtered.filter(job => {
				// If hiring_type is 'individual', check if there's an accepted application
				if (job.hiring_type === 'individual') {
					// Check application_count (counts accepted applications from backend)
					const acceptedCount = job.application_count || 0;
					// Also check if applications array exists and has accepted status
					let hasAccepted = false;
					if (Array.isArray(job.applications) && job.applications.length > 0) {
						hasAccepted = job.applications.some(app => app.status === 'accepted');
					}
					// If there's at least 1 accepted application, hide this job
					return acceptedCount === 0 && !hasAccepted;
				}
				// For team hiring or other types, show the job
				return true;
			});
			console.log('After individual filter:', {
				before: beforeIndividualFilter,
				after: filtered.length,
				removed: beforeIndividualFilter - filtered.length
			});
			
			// Apply sorting inline to avoid dependency issues
			let sorted = [...filtered];
			const sortBy = selectedSortOption;
			
			if (sortBy === "Featured") {
				sorted = sorted.sort((a, b) => {
					const aApplications = a.applications?.length || a.application_count || 0;
					const bApplications = b.applications?.length || b.application_count || 0;
					if (bApplications !== aApplications) {
						return bApplications - aApplications;
					}
					return new Date(b.created_at) - new Date(a.created_at);
				});
			} else if (sortBy === "Newest") {
				sorted = sorted.sort((a, b) => {
					return new Date(b.created_at) - new Date(a.created_at);
				});
			} else if (sortBy === "Salary: High-Low") {
				sorted = sorted.sort((a, b) => {
					const salaryA = parseFloat(a.salary) || 0;
					const salaryB = parseFloat(b.salary) || 0;
					return salaryB - salaryA;
				});
			} else if (sortBy === "Salary: Low-High") {
				sorted = sorted.sort((a, b) => {
					const salaryA = parseFloat(a.salary) || 0;
					const salaryB = parseFloat(b.salary) || 0;
					return salaryA - salaryB;
				});
			} else {
				// Default: Sort by newest
				sorted = sorted.sort((a, b) => {
					return new Date(b.created_at) - new Date(a.created_at);
				});
			}
			
			// Store all filtered and sorted jobs
			setFilteredJobs(sorted);
			
			// Calculate client-side pagination for filtered results
			const totalFiltered = sorted.length;
			const totalPagesCount = Math.max(1, Math.ceil(totalFiltered / perPage));
			console.log('Pagination Calculation:', {
				totalFiltered,
				perPage,
				totalPagesCount,
				currentPage
			});
			setTotalPages(totalPagesCount);
			setTotalItems(totalFiltered);
		} else if (Array.isArray(jobs) && jobs.length === 0) {
			// Handle empty jobs array
			setFilteredJobs([]);
			setTotalPages(1);
			setTotalItems(0);
		}
	}, [jobs, searchTerm, selectedEmploymentType, selectedSortOption, currentPage, perPage]);

	const handleRefineSearch = () => {
		setCurrentPage(1); // Reset to first page when refining search
		// The useEffect will trigger a new API call with page 1
	};

	const handleClearFilters = () => {
		setSearchTerm("");
		setSelectedEmploymentType("");
		setSelectedSortOption("Newest");
		setCurrentPage(1); // Reset to first page when clearing filters
		// The useEffect will trigger a new API call with page 1
	};

	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
			// Scroll to top when page changes
			window.scrollTo({ top: 0, behavior: 'smooth' });
			// The useEffect will trigger a new API call with the new page
		}
	};

	// Handle URL search parameters
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const searchParam = urlParams.get('search');
		if (searchParam) {
			setSearchTerm(searchParam);
			setCurrentPage(1); // Reset to first page when search param changes
		}
	}, [location.search]);

	// Reset to page 1 when search term or employment type filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, selectedEmploymentType, selectedSortOption]);

	useEffect(() => {
		let isMounted = true;
		
		const loadJobs = async () => {
			try {
				setLoading(true);
				
				// Get current user data to exclude their own job posts
				const userData = JSON.parse(localStorage.getItem("user") || '{}');
				const currentUser = userData.user || userData;
				const currentUserId = currentUser.id;
				
				// Try to get profile ID from multiple sources
				let currentProfileId = currentUser.profile?.id || userData.profile?.id || currentUser.profile_id;
				
				// If profile ID is still undefined, try to fetch it from API
				if (!currentProfileId && currentUserId) {
					try {
						const authToken = localStorage.getItem("auth_token");
						const profileResponse = await axios.get(`/api/profiles?user_id=${currentUserId}`, {
							headers: {
								Authorization: `Bearer ${authToken}`,
								Accept: "application/json"
							}
						});
						
						if (profileResponse.data?.id) {
							currentProfileId = profileResponse.data.id;
						} else if (profileResponse.data?.profile?.id) {
							currentProfileId = profileResponse.data.profile.id;
						} else if (Array.isArray(profileResponse.data) && profileResponse.data.length > 0) {
							currentProfileId = profileResponse.data[0].id;
						}
					} catch (profileError) {
						console.error("Error fetching profile for job filtering:", profileError);
					}
				}
				
				// Use search API if search term is provided
				const urlParams = new URLSearchParams(location.search);
				const searchParam = urlParams.get('search');
				
				let response;
				if (searchParam) {
					response = await axios.get(`/api/search/jobs?q=${encodeURIComponent(searchParam)}`);
					const jobsData = response.data.jobs || [];
					if (isMounted) {
						setJobs(jobsData);
					}
				} else {
					// Try with auth token if available, but don't require it for public listings
					const authToken = localStorage.getItem("auth_token");
					const headers = authToken ? {
						Authorization: `Bearer ${authToken}`,
						Accept: "application/json"
					} : {
						Accept: "application/json"
					};
					
					// Fetch all jobs - API defaults to 5 per page, so we need to fetch all pages
					// Client-side filtering and pagination will be applied
					// Add timestamp to prevent caching
					const timestamp = new Date().getTime();
					
					// Fetch all pages of jobs
					let allJobs = [];
					let currentPageNum = 1;
					let hasMorePages = true;
					
					while (hasMorePages) {
						const pageResponse = await axios.get(`/api/jobposts`, { 
							headers,
							params: {
								archived: false,
								page: currentPageNum,
								_t: timestamp
							}
						});
						
						// Extract jobs from current page
						let pageJobs = null;
						if (pageResponse.data?.job_posts?.data) {
							// Paginated response: { job_posts: { data: [...] } }
							pageJobs = pageResponse.data.job_posts.data;
						} else if (pageResponse.data?.job_posts && Array.isArray(pageResponse.data.job_posts)) {
							// Direct array: { job_posts: [...] }
							pageJobs = pageResponse.data.job_posts;
						} else if (pageResponse.data?.data && Array.isArray(pageResponse.data.data)) {
							// Nested data: { data: [...] }
							pageJobs = pageResponse.data.data;
						} else if (Array.isArray(pageResponse.data)) {
							// Direct array response
							pageJobs = pageResponse.data;
						}
						
						const pageJobsArray = Array.isArray(pageJobs) ? pageJobs : [];
						allJobs = [...allJobs, ...pageJobsArray];
						
						// Check if there are more pages
						const pagination = pageResponse.data?.pagination || {};
						const totalPages = pagination.total_pages || 1;
						hasMorePages = currentPageNum < totalPages;
						currentPageNum++;
						
						// Safety limit to prevent infinite loops
						if (currentPageNum > 100) {
							console.warn("Reached maximum page limit when fetching jobs");
							break;
						}
					}
					
					console.log('Fetched all pages:', {
						totalJobs: allJobs.length,
						totalPages: currentPageNum - 1
					});
					
					// Filter out current user's job posts by profile_id (not user_id)
					// Only filter if we have a valid profile_id
					const filteredJobsArray = (currentProfileId && allJobs.length > 0)
						? allJobs.filter(job => {
							const jobProfileId = job.profile_id || job.profile?.id;
							// Convert both to strings for comparison to handle number/string mismatches
							const shouldExclude = String(jobProfileId) === String(currentProfileId);
							if (shouldExclude) {
								console.log('Excluding own job:', job.id, 'Job Profile ID:', jobProfileId, 'Current Profile ID:', currentProfileId);
							}
							return !shouldExclude;
						})
						: allJobs;
					
					console.log('Filtered Jobs (excluding own):', filteredJobsArray.length, 'out of', allJobs.length);
					console.log('Setting jobs state with', filteredJobsArray.length, 'jobs');
					
					if (isMounted) {
						setJobs(filteredJobsArray);
						// Apply filters and sorting after setting jobs
						// This will be handled by the useEffect that watches jobs
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
			if (e.key === 'jobUpdated' || e.key === 'jobPosted') {
				console.log('Job updated/posted detected, refreshing jobs list...');
				loadJobs();
				// Clear the storage event
				localStorage.removeItem('jobUpdated');
				localStorage.removeItem('jobPosted');
			}
		};

		// Listen for custom events when jobs are posted/updated
		const handleJobPosted = () => {
			console.log('Job posted event detected, refreshing jobs list...');
			loadJobs();
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('jobPosted', handleJobPosted);
		window.addEventListener('jobUpdated', handleJobPosted);

		return () => {
			isMounted = false;
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('jobPosted', handleJobPosted);
			window.removeEventListener('jobUpdated', handleJobPosted);
		};
	}, [location.search]);

	// Apply filters and sorting when jobs, searchTerm, selectedEmploymentType, or selectedSortOption changes
	useEffect(() => {
		console.log('useEffect triggered for applyFiltersAndSort', {
			jobsLength: Array.isArray(jobs) ? jobs.length : 0,
			searchTerm,
			selectedEmploymentType,
			selectedSortOption
		});
		if (Array.isArray(jobs) && jobs.length > 0) {
			applyFiltersAndSort();
		} else if (Array.isArray(jobs) && jobs.length === 0) {
			setFilteredJobs([]);
			setTotalPages(1);
			setTotalItems(0);
		}
	}, [jobs, searchTerm, selectedEmploymentType, selectedSortOption, applyFiltersAndSort]);

	return (
		<div className="browse">
			<Headerz />
			<Banner />
			<div className="browse-content">
				<div className="header-section">
					<h2 className="category-title">FIND JOBS</h2>
					<div className="search-and-sort-row">
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
					<button 
						className="mobile-filter-toggle"
						onClick={() => setIsFiltersOpen(!isFiltersOpen)}
						aria-label="Toggle filters"
					>
						{isFiltersOpen ? '−' : '+'} ACTIVE SKILL FILTERS
					</button>
				</div>

				<div className="content-layout">
					<aside className={`filters-sidebar findjob-sidebar ${isFiltersOpen ? 'mobile-open' : ''}`}>
						<h4 className="filters-title">+/− ACTIVE SKILL FILTERS</h4>
						<div className="filter-group">
							<label>EMPLOYMENT TYPE</label>
							<select
								value={selectedEmploymentType}
							onChange={(e) => {
								setSelectedEmploymentType(e.target.value);
							}}
							>
								<option value="">Any</option>
								<option value="per_day">Per Day</option>
								<option value="per_job">Per Job</option>
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
							(() => {
								// Get jobs for current page (client-side pagination)
								const startIndex = (currentPage - 1) * perPage;
								const endIndex = startIndex + perPage;
								const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
								return paginatedJobs.map((job) => (
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
												{(job.job_type || 'Any').replace(/_/g, ' ').toUpperCase()}
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
											{(() => {
												const normalizedSkills = normalizeSkills(job.skills);
												if (Array.isArray(normalizedSkills) && normalizedSkills.length > 0) {
													return normalizedSkills.map((skill, index) => (
														<span key={index} className="findjob-chip">
															{skill.name} ({skill.experience || 'No experience specified'})
														</span>
													));
												}
												return <span className="findjob-chip">No skills specified</span>;
											})()}
										</div>
									</div>
								</article>
							));
							})()
						)}
						
						{/* Pagination Controls - Show when there are multiple pages */}
						{(() => {
							console.log('Pagination render check:', {
								totalPages,
								totalItems,
								filteredJobsLength: filteredJobs.length,
								shouldShow: totalPages > 1
							});
							return totalPages > 1;
						})() && (
							<div className="findjob-pagination">
								<span>Page {currentPage} of {totalPages}</span>
								<button
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || loading}
								>
									{"<"}
								</button>
								{(() => {
									const pages = [];
									const maxPagesToShow = 5;
									const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
									const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

									if (totalPages <= maxPagesToShow) {
										for (let i = 1; i <= totalPages; i++) {
											pages.push(
												<button
													key={i}
													className={currentPage === i ? "active" : ""}
													onClick={() => handlePageChange(i)}
												>
													{i}
												</button>
											);
										}
									} else {
										if (startPage > 1) {
											pages.push(
												<button key={1} onClick={() => handlePageChange(1)}>
													1
												</button>
											);
											if (startPage > 2) {
												pages.push(<span key="start-ellipsis" className="ellipsis">...</span>);
											}
										}

										for (let i = startPage; i <= endPage; i++) {
											pages.push(
												<button
													key={i}
													className={currentPage === i ? "active" : ""}
													onClick={() => handlePageChange(i)}
												>
													{i}
												</button>
											);
										}

										if (endPage < totalPages) {
											if (endPage < totalPages - 1) {
												pages.push(<span key="end-ellipsis" className="ellipsis">...</span>);
											}
											pages.push(
												<button key={totalPages} onClick={() => handlePageChange(totalPages)}>
													{totalPages}
												</button>
											);
										}
									}

									return pages;
								})()}
								<button
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage >= totalPages || loading}
								>
									{">"}
								</button>
							</div>
						)}
					</section>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default FindJob;