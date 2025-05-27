import React, { useState } from "react";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaUser, FaBriefcase, FaCheckCircle, FaChartLine, FaEye, FaTrash } from "react-icons/fa";
import "./../../../../sass/components/admin_dashboard.scss";

// Static data for stats
const stats = {
  total_workers: 1200,
  total_job_postings: 150,
  total_completed_jobs: 85,
  total_engagement: 45,
};

// Static data for job requests
const jobRequests = [
  {
    id: 1,
    worker: "John Doe",
    category: "Construction",
    request_date: "2025-05-27",
    location: "Butuan City",
    status: "Pending",
  },
  {
    id: 2,
    worker: "Jane Smith",
    category: "Electrical",
    request_date: "2025-05-26",
    location: "Butuan City",
    status: "Accepted",
  },
  {
    id: 3,
    worker: "Mike Johnson",
    category: "Plumbing",
    request_date: "2025-05-25",
    location: "Butuan City",
    status: "Completed",
  },
  {
    id: 4,
    worker: "Anna Lee",
    category: "Carpentry",
    request_date: "2025-05-24",
    location: "Butuan City",
    status: "Pending",
  },
  {
    id: 5,
    worker: "Chris Brown",
    category: "Painting",
    request_date: "2025-05-23",
    location: "Butuan City",
    status: "Accepted",
  },
];

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleSelectAll = () => {
    if (selectedJobs.length === jobRequests.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobRequests.map((job) => job.id));
    }
  };

  const handleSelectJob = (id) => {
    setSelectedJobs((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((jobId) => jobId !== id)
        : [...prevSelected, id]
    );
  };

  return (
    <div className="app">
      <TopNavbar />
      <div className="main-container">
        <AdminSidebar
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
        <div className={`content ${isSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
          <div className="header">
            <h1>Dashboard</h1>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search Job Requests"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <FaUser className="icon" />
              <div className="stat-info">
                <h3>Total Workers</h3>
                <p className="value">{stats.total_workers}</p>
                <p className="change positive">+5% this week</p>
              </div>
            </div>
            <div className="stat-card">
              <FaBriefcase className="icon" />
              <div className="stat-info">
                <h3>Job Postings</h3>
                <p className="value">{stats.total_job_postings}</p>
                <p className="change positive">+20% this week</p>
              </div>
            </div>
            <div className="stat-card">
              <FaCheckCircle className="icon" />
              <div className="stat-info">
                <h3>Completed Jobs</h3>
                <p className="value">{stats.total_completed_jobs}</p>
                <p className="change positive">+10% today</p>
              </div>
            </div>
            <div className="stat-card">
              <FaChartLine className="icon" />
              <div className="stat-info">
                <h3>Engagement</h3>
                <p className="value">{stats.total_engagement}</p>
                <p className="change">Updated today</p>
              </div>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-card">
              <h4>Job Postings by Skill</h4>
              <p className="subtitle">Distribution by skill type</p>
              <div className="chart-placeholder">[Chart: Bar]</div>
              <p className="update-info">Updated 2 hours ago</p>
            </div>
            <div className="chart-card">
              <h4>Worker Registrations</h4>
              <p className="subtitle">New registrations this week</p>
              <div className="chart-placeholder">[Chart: Line Graph]</div>
              <p className="update-info">Updated 10 min ago</p>
            </div>
            <div className="chart-card">
              <h4>Job Completion Rate</h4>
              <p className="subtitle">Completions this week</p>
              <div className="chart-placeholder">[Chart: Line Graph]</div>
              <p className="update-info">Just updated</p>
            </div>
          </div>
          <div className="job-requests">
            <h3>Recent Job Requests</h3>
            <div className="job-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedJobs.length === jobRequests.length && jobRequests.length > 0}
                      />
                    </th>
                    <th>Actions</th>
                    <th>Worker</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobRequests
                    .filter(
                      (job) =>
                        job.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        job.category.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((job) => (
                      <tr key={job.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={() => handleSelectJob(job.id)}
                          />
                        </td>
                        <td>
                          <FaEye className="action-icon view-icon" />
                          <FaTrash className="action-icon delete-icon" />
                        </td>
                        <td>{job.worker}</td>
                        <td>{job.category}</td>
                        <td>{new Date(job.request_date).toLocaleDateString()}</td>
                        <td>{job.location}</td>
                        <td>{job.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;