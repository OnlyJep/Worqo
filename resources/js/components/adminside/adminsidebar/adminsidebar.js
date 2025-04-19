import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './../../../../sass/components/adminsidebar.scss';
import { IconHome, IconPackage, IconShoppingCart, IconUsers, IconCategory, IconUserCheck } from '@tabler/icons-react';

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Define navItems
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconHome className="icon" />, route: '' },
    { id: 'products', label: 'Products', icon: <IconPackage className="icon" />, route: '/products' },
    { id: 'orders', label: 'Orders', icon: <IconShoppingCart className="icon" />, route: '/orders' },
    { id: 'users', label: 'Users', icon: <IconUsers className="icon" />, route: '/users' },
    { id: 'categories', label: 'Categories', icon: <IconCategory className="icon" />, route: '/categories' },
    { id: 'roles', label: 'Roles', icon: <IconUserCheck className="icon" />, route: '/roles' },
  ];

  // Set activeNav based on current route
  const [activeNav, setActiveNav] = useState(() => {
    const currentRoute = location.pathname.replace('/admin', '') || '';
    return currentRoute === '' ? 'dashboard' : currentRoute.replace('/', '');
  });

  // Update activeNav when route changes
  useEffect(() => {
    const currentRoute = location.pathname.replace('/admin', '') || '';
    setActiveNav(currentRoute === '' ? 'dashboard' : currentRoute.replace('/', ''));
  }, [location]);

  const handleNavClick = (id, route) => {
    setActiveNav(id);
    navigate(`/admin${route}`);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={`/admin${item.route}`}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id, item.route)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;