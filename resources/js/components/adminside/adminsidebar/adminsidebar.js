import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuOutlined, HomeOutlined, FileAddOutlined, UserOutlined, TeamOutlined, UserSwitchOutlined, StarOutlined, TagsOutlined, CodeOutlined, TrophyOutlined, SafetyOutlined, BellOutlined, ShopOutlined, BankOutlined, BookOutlined } from '@ant-design/icons';
import { GrAnnounce } from "react-icons/gr";
import './../../../../sass/components/adminsidebar.scss';

const AdminSidebar = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 769) setIsSidebarExpanded(true);
      else setIsSidebarExpanded(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="main-container">
      <div className="navbar"></div>
      <div className={`overlay ${isSidebarExpanded ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className="sidebar-wrapper">
        <div className={`sidebar ${isSidebarExpanded ? 'expanded' : ''}`}>
          <div className="sidebar-header">
            {isSidebarExpanded && (
              <button className="sidebar-toggle inside" onClick={toggleSidebar}>
                <MenuOutlined className="toggle-icon" />
              </button>
            )}
          </div>

          <div className="sidebar-content">
            <ul>
              <li className={isActive('/admin')} onClick={() => navigate('/admin')}>
                <HomeOutlined className="icon" />
                {isSidebarExpanded && <span>Dashboard</span>}
              </li>
              <li className={isActive('/admin/jobs-post')} onClick={() => navigate('/admin/jobs-post')}>
                <FileAddOutlined className="icon" />
                {isSidebarExpanded && <span>Post Jobs</span>}
              </li>
              <li className={isActive('/admin/jobs')} onClick={() => navigate('/admin/jobs')}>
                <BankOutlined className="icon" />
                {isSidebarExpanded && <span>Jobs</span>}
              </li>
              <li className={isActive('/admin/bookings')} onClick={() => navigate('/admin/bookings')}>
                <BookOutlined className="icon" />
                {isSidebarExpanded && <span>Bookings</span>}
              </li>
              <li className={isActive('/admin/post-hiring')} onClick={() => navigate('/admin/post-hiring')}>
                <GrAnnounce className="icon" />
                {isSidebarExpanded && <span>Post Hiring</span>}
              </li>
            <li className={isActive('/admin/users')} onClick={() => navigate('/admin/users')}>
              <UserOutlined className="icon" />
              {isSidebarExpanded && <span>Users</span>}
            </li>
            <li className={isActive('/admin/adminlist')} onClick={() => navigate('/admin/adminlist')}>
              <TeamOutlined className="icon" />
              {isSidebarExpanded && <span>Admin</span>}
            </li>
            <li className={isActive('/admin/workerlist')} onClick={() => navigate('/admin/workerlist')}>
              <UserSwitchOutlined className="icon" />
              {isSidebarExpanded && <span>Workers</span>}
            </li>
            <li className={isActive('/admin/employerlist')} onClick={() => navigate('/admin/employerlist')}>
              <TeamOutlined className="icon" />
              {isSidebarExpanded && <span>Employer</span>}
            </li>
            <li className={isActive('/admin/contractorlist')} onClick={() => navigate('/admin/contractorlist')}>
              <TeamOutlined className="icon" />
              {isSidebarExpanded && <span>Contractor</span>}
            </li>
            <li className={isActive('/admin/reviews')} onClick={() => navigate('/admin/reviews')}>
              <StarOutlined className="icon" />
              {isSidebarExpanded && <span>Reviews</span>}
            </li>

            <hr className="separator" />

            <div className="admin-settings-header">
              {isSidebarExpanded && <span>Admin Settings</span>}
            </div>

              {isSidebarExpanded && (
                <ul className="admin-settings-list">
                <li className={isActive('/admin/services')} onClick={() => navigate('/admin/services')}>
                <ShopOutlined className="icon" />
                {isSidebarExpanded && <span>Services Categories</span>}
              </li>
                  <li className={isActive('/admin/color-code-manager')} onClick={() => navigate('/admin/color-code-manager')}>
                    <CodeOutlined className="icon" />
                    <span>Color Code Collars</span>
                  </li>
                  <li className={isActive('/admin/ranks')} onClick={() => navigate('/admin/ranks')}>
                    <TrophyOutlined className="icon" />
                    <span>Ranks & Badges</span>
                  </li>
                </ul>
              )}
            </ul>
          </div>
        </div>
        {!isSidebarExpanded && (
          <button className="sidebar-toggle outside" onClick={toggleSidebar}>
            <MenuOutlined className="toggle-icon" />
          </button>
        )}
      </div>

      <div className="content">{children}</div>
    </div>
  );
};

export default AdminSidebar;