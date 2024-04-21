import React from 'react';
import { Link } from 'react-router-dom';
import './header.css'; // Create and import your header CSS file

const redirectToHome = () => {
  window.location.href = '/';
};

const Header = () => {
  return (
    <header className="site-header">
      <div className="site-logo" onClick={redirectToHome}>
          EasyGrants
        </div>
      <nav className="action-buttons">
        <Link to="/post-grant"><button>Post a Grant</button></Link>
        <Link to="/about"><button>About Us</button></Link>
        <Link to="/faq"><button>FAQ</button></Link>
        {/* Add other navigation links as needed */}
      </nav>
    </header>
  );
};

export default Header;