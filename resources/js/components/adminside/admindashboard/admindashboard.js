import React, { useState, useEffect } from 'react';
import { FaUser, FaBriefcase, FaUserShield, FaClipboardList, FaBuilding } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import AdminSidebar from './../adminsidebar/adminsidebar';
import TopNavbar from './../admintopnavbar/admintopnavbar';
import './../../../../sass/components/admin_dashboard.scss';

const AdminDashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [stats, setStats] = useState({
    total_workers: 0,
    total_employers: 0,
    total_admins: 0,
    total_users: 0,
    total_job_postings: 0,
    total_completed_jobs: 0,
    total_companies: 0,
  });
  const [workerChartData, setWorkerChartData] = useState({
    labels: [],
    data: [],
  });
  const [employerChartData, setEmployerChartData] = useState({
    labels: [],
    data: [],
  });

  // Fetch data from API
  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(response => response.json())
      .then(data => {
        setStats(data.stats);
        setWorkerChartData(data.worker_chart_data);
        setEmployerChartData(data.employer_chart_data);
      })
      .catch(error => console.error('Error fetching dashboard stats:', error));
  }, []);

  // Initialize Worker Registration Chart
  useEffect(() => {
    const ctx = document.getElementById('workerRegistrationsChart')?.getContext('2d');
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: workerChartData.labels,
          datasets: [
            {
              label: 'Workers',
              data: workerChartData.data,
              borderColor: '#4A90E2',
              backgroundColor: 'rgba(74, 144, 226, 0.2)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Registrations' },
            },
            x: {
              title: { display: true, text: 'Date' },
            },
          },
        },
      });
      return () => chart.destroy();
    }
  }, [workerChartData]);

  // Initialize Employer Registration Chart
  useEffect(() => {
    const ctx = document.getElementById('employerRegistrationsChart')?.getContext('2d');
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: employerChartData.labels,
          datasets: [
            {
              label: 'Employers',
              data: employerChartData.data,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Registrations' },
            },
            x: {
              title: { display: true, text: 'Date' },
            },
          },
        },
      });
      return () => chart.destroy();
    }
  }, [employerChartData]);

  return (
    <div className="app">
      <TopNavbar />
      <div className="main-container">
        <AdminSidebar
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
        <div className={`content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div className="header">
            <h1>Dashboard</h1>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {[
              { icon: FaUser, title: 'Total Workers', value: stats.total_workers, change: '+5% this week', positive: true },
              { icon: FaBriefcase, title: 'Total Employers', value: stats.total_employers, change: '+3% this week', positive: true },
              { icon: FaUserShield, title: 'Total Admins', value: stats.total_admins, change: 'Updated today', positive: false },
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <stat.icon className="icon" />
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p className="value">{stat.value}</p>
                  <p className={`change ${stat.positive ? 'positive' : ''}`}>{stat.change}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="stats-grid">
            {[
              { icon: FaClipboardList, title: 'Total Job Postings', value: stats.total_job_postings, change: '+10% this week', positive: true },
              { icon: FaBuilding, title: 'Total Companies', value: stats.total_companies, change: 'Updated today', positive: false },
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <stat.icon className="icon" />
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p className="value">{stat.value}</p>
                  <p className={`change ${stat.positive ? 'positive' : ''}`}>{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <h4>Worker Registrations</h4>
              <p className="subtitle">New worker registrations this week</p>
              <div className="chart-placeholder">
                <canvas id="workerRegistrationsChart"></canvas>
              </div>
              <p className="update-info">Updated 10 min ago</p>
            </div>
            <div className="chart-card">
              <h4>Employer Registrations</h4>
              <p className="subtitle">New employer registrations this week</p>
              <div className="chart-placeholder">
                <canvas id="employerRegistrationsChart"></canvas>
              </div>
              <p className="update-info">Updated 10 min ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;