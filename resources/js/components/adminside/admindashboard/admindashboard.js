import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/admin_dashboard.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings } from '@tabler/icons-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from './../adminsidebar/adminsidebar';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Placeholder data for cards
  const dashboardData = {
    totalUsers: 1500,
    totalSubscribers: 300,
    totalEarnings: 15345,
    totalActiveUsers: 789,
    totalProductsListed: 1234,
  };

  // Monthly Earnings Bar Chart Data
  const monthlyEarningsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Earnings (USD)',
        data: [1200, 1500, 1800, 2000, 1700, 2200, 2500, 2300, 1900, 2100, 2400, 2600],
        backgroundColor: '#0D7A5F',
        borderColor: '#0D7A5F',
        borderWidth: 1,
      },
    ],
  };

  // Yearly Earnings Line Chart Data
  const yearlyEarningsData = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [
      {
        label: 'Yearly Earnings (USD)',
        data: [5000, 8000, 12000, 15000, 18000, 20000],
        fill: false,
        borderColor: '#F3C44A',
        tension: 0.1,
      },
    ],
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1a3c34',
        },
      },
      title: {
        display: true,
        color: '#1a3c34',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#1a3c34',
        },
      },
      y: {
        ticks: {
          color: '#1a3c34',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="admin-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-profile" ref={dropdownRef}>
            <div className="profile-wrapper" onClick={toggleDropdown}>
              <IconUserCircle className="profile-picture" />
              <div className="arrow-badge">
                <IconChevronDown className="arrow-icon" />
              </div>
            </div>
            <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <button className="dropdown-item" onClick={handleProfileSettings}>
                <IconSettings className="dropdown-icon" />
                Profile Settings
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <IconLogout className="dropdown-icon" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>
          <div className="dashboard-cards">
            <div className="card">
              <h3>Total Users</h3>
              <p>
                {dashboardData.totalUsers.toLocaleString()} <span>Users</span>
              </p>
            </div>
            <div className="card">
              <h3>Total Subscribers</h3>
              <p>
                {dashboardData.totalSubscribers.toLocaleString()} <span>Subscribers</span>
              </p>
            </div>
            <div className="card">
              <h3>Total Earnings</h3>
              <p>
                ${dashboardData.totalEarnings.toLocaleString()} <span>USD</span>
              </p>
            </div>
            <div className="card">
              <h3>Total Active Users</h3>
              <p>
                {dashboardData.totalActiveUsers.toLocaleString()} <span>Users</span>
              </p>
            </div>
            <div className="card">
              <h3>Total Products Listed</h3>
              <p>
                {dashboardData.totalProductsListed.toLocaleString()} <span>Items</span>
              </p>
            </div>
          </div>
          <div className="dashboard-charts">
            <div className="chart-container">
              <Bar
                data={monthlyEarningsData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Monthly Earnings (2025)',
                    },
                  },
                }}
              />
            </div>
            <div className="chart-container">
              <Line
                data={yearlyEarningsData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Yearly Earnings (2020-2025)',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;