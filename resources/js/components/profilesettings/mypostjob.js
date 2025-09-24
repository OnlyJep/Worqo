import React, { useState } from 'react';
import { FaUserFriends, FaRegEdit, FaPlus } from 'react-icons/fa';
import ModalPostJob from './modalpostjob';
import ModalViewEmployees from './modalviewemployees';
import '../../../sass/components/profilesettings/mypostjob.scss';

const MyPostJob = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewEmployeesModalOpen, setIsViewEmployeesModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Mechanical Engineer',
      postedDate: 'July 07, 2025',
      salary: '₱ 30,000.00/month',
      description: 'We are looking for a skilled and detail-oriented Mechanical Engineer to join our team for [project name or general tasks]. The successful candidate will be responsible for designing, analyzing, and overseeing mechanical systems, tools, and machinery to ensure efficiency, safety, and reliability.',
      skillsRequirement: 'Mechanical Design & Drafting, Engineering Analysis',
      typeOfEmployment: 'Full-time',
      desiredHours: '40',
      email: 'hr@company.com',
      contactPerson: 'John Smith'
    }
  ]);

  const handleAddJob = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleEditJob = (jobId) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      setEditingJob(jobToEdit);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmitJob = (jobData) => {
    if (editingJob) {
      // Update existing job
      setJobs(jobs.map(job => 
        job.id === editingJob.id 
          ? { 
              ...job, 
              title: jobData.jobTitle,
              description: jobData.jobDescription,
              salary: jobData.salary,
              skillsRequirement: jobData.skillsRequirement,
              typeOfEmployment: jobData.typeOfEmployment,
              desiredHours: jobData.desiredHours,
              email: jobData.email,
              contactPerson: jobData.contactPerson,
              id: editingJob.id 
            }
          : job
      ));
    } else {
      // Add new job
      const newJob = {
        id: jobs.length + 1,
        title: jobData.jobTitle,
        description: jobData.jobDescription,
        salary: jobData.salary,
        skillsRequirement: jobData.skillsRequirement,
        typeOfEmployment: jobData.typeOfEmployment,
        desiredHours: jobData.desiredHours,
        email: jobData.email,
        contactPerson: jobData.contactPerson,
        postedDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: '2-digit' 
        })
      };
      setJobs([...jobs, newJob]);
    }
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleViewApplicants = (jobId) => {
    setIsViewEmployeesModalOpen(true);
  };

  const handleCloseViewEmployeesModal = () => {
    setIsViewEmployeesModalOpen(false);
  };

  return (
    <div className="my-post-job-container">
      <div className="post-job-header">
        <h2 className="post-job-title">My Post Job</h2>
        <button className="add-post-job-btn" onClick={handleAddJob}>
          <FaPlus className="btn-icon" />
          Add Post Job
        </button>
      </div>

      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-card-header">
              <div className="job-actions">
                <button 
                  className="view-applicants-btn"
                  onClick={() => handleViewApplicants(job.id)}
                  title="View Applicants"
                >
                  <FaUserFriends className="action-icon" />
                </button>
                <button 
                  className="edit-job-btn"
                  onClick={() => handleEditJob(job.id)}
                  title="Edit Job"
                >
                  <FaRegEdit className="action-icon" />
                </button>
              </div>
            </div>

            <div className="job-content">
              <h3 className="job-title">{job.title}</h3>
              
              <div className="job-metadata">
                <span className="posted-date">Posted on {job.postedDate}</span>
                <span className="job-salary">{job.salary}</span>
              </div>

              <div className="job-description">
                <h4 className="description-title">Job Overview/Description</h4>
                <p className="description-text">{job.description}</p>
              </div>

              <div className="job-skills">
                <span className="skill-tag">
                  {job.skillsRequirement}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ModalPostJob
          onClose={handleCloseModal}
          onSubmit={handleSubmitJob}
          editingJob={editingJob}
        />
      )}

      {isViewEmployeesModalOpen && (
        <ModalViewEmployees
          onClose={handleCloseViewEmployeesModal}
        />
      )}
    </div>
  );
};

export default MyPostJob;
