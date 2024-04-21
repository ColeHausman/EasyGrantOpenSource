import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route }
    from 'react-router-dom';
import HomePage from './pages/home';
import AdminPage from './pages/admin';
import GrantPostUserPage from './pages/post-grant';
import AboutPage from './pages/About';
import FAQPage from './pages/FAQ';
function App() {
    return (
        <Router>
            <Routes>
                <Route exact path='/' element={<HomePage />} />
                <Route path='/admin' element={<AdminPage />} />
                <Route path='/post-grant' element={<GrantPostUserPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
            </Routes>
        </Router>
    );
}
    
export default App; 