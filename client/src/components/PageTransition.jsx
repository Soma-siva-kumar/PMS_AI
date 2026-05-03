import React from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    return (
        <div key={location.pathname} className="page-transition-wrapper animate-page-in">
            {children}
        </div>
    );
};

export default PageTransition;

