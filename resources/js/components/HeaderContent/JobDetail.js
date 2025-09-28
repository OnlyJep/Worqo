import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './../../../sass/components/jobdetail.scss';
import Headerz from "../HeaderContent/Headerz";
import Banner from "../AdsContent/banner";
import Footer from "../FooterContent/footer";
import { IconArrowLeft, IconCalendar, IconMapPin, IconCurrencyDollar, IconUser, IconClock } from '@tabler/icons-react';

const JobDetail = () => {
	const { jobId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const [job, setJob] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		// First try to get job from location state (if navigated from FindJob)
		if (location.state?.job) {
			setJob(location.state.job);
			setLoading(false);
		} else {
			// If not in state, fetch from API
			fetchJob();
		}
	}, [jobId, location.state]);

	const fetchJob = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`/api/jobposts/${jobId}`);
			// Handle the API response structure
			const jobData = response.data.data || response.data;
			setJob(jobData);
		} catch (error) {
			console.error('Error fetching job:', error);
			setError('Job not found');
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		navigate('/findjob');
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC'
		});
	};

	const formatSalary = (salary, salaryType) => {
		const formattedSalary = parseFloat(salary).toLocaleString('en-PH', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return `₱${formattedSalary}/${salaryType === 'per_hour' ? 'hour' : 'month'}`;
	};

	if (loading) {
		return (
			<div className="job-detail">
				<Headerz />
				<Banner />
				<div className="job-detail-content">
					<div className="loading-state">
						<div className="spinner"></div>
						<p>Loading job details...</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !job) {
		return (
			<div className="job-detail">
				<Headerz />
				<Banner />
				<div className="job-detail-content">
					<div className="error-state">
						<h2>Job Not Found</h2>
						<p>The job you're looking for doesn't exist or has been removed.</p>
						<button className="back-btn" onClick={handleBack}>
							<IconArrowLeft size={16} />
							Back to Jobs
						</button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="job-detail">
			<Headerz />
			<Banner />
			<div className="job-detail-content">
				<div className="job-detail-header">
					<button className="back-btn" onClick={handleBack}>
						<IconArrowLeft size={16} />
						Back to Jobs
					</button>
					<h1 className="job-title">{job.job_title}</h1>
				</div>

				<div className="job-detail-body">
					<div className="job-info">
						<div className="job-meta">
							<div className="meta-item">
								<IconUser size={20} />
								<span>Posted by: {job.profile?.first_name} {job.profile?.middlename} {job.profile?.last_name} {job.profile?.suffix?.suffix_name}</span>
							</div>
							<div className="meta-item">
								<IconCalendar size={20} />
								<span>Posted on: {formatDate(job.created_at)}</span>
							</div>
							<div className="meta-item">
								<IconCurrencyDollar size={20} />
								<span>Salary: {formatSalary(job.salary, job.salary_type)}</span>
							</div>
							<div className="meta-item">
								<IconClock size={20} />
								<span>Job Type: {job.job_type}</span>
							</div>
						</div>

						<div className="job-section">
							<h3 className="section-title">Job Description</h3>
							<p className="job-description">{job.description}</p>
						</div>

						<div className="job-section">
							<h3 className="section-title">Required Skills</h3>
							<div className="skills-list">
								{job.skills && job.skills.map((skill, index) => (
									<div key={index} className="skill-item">
										<span className="skill-name">{skill.name}</span>
										<span className="skill-experience">({skill.experience || 'No experience specified'})</span>
									</div>
								))}
							</div>
						</div>

						<div className="job-section">
							<h3 className="section-title">Application Timeline</h3>
							<div className="timeline">
								<div className="timeline-item">
									<div className="timeline-label">Application Start</div>
									<div className="timeline-value">{formatDate(job.application_start)}</div>
								</div>
								<div className="timeline-item">
									<div className="timeline-label">Application Deadline</div>
									<div className="timeline-value">{formatDate(job.application_deadline)}</div>
								</div>
							</div>
						</div>

						<div className="job-section">
							<h3 className="section-title">Job Details</h3>
							<div className="job-details">
								<div className="detail-item">
									<span className="detail-label">Job ID:</span>
									<span className="detail-value">#{job.id}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Status:</span>
									<span className={`detail-value status ${job.archived ? 'archived' : 'active'}`}>
										{job.archived ? 'Archived' : 'Active'}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Last Updated:</span>
									<span className="detail-value">{formatDate(job.updated_at)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default JobDetail;
