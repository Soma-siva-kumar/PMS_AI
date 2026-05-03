import React, { useState, useEffect, useRef } from 'react';

const ThemeSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'orange');
    const menuRef = useRef(null);

    const themes = [
        { id: 'orange', class: 'theme-orange' },
        { id: 'blue', class: 'theme-blue' },
        { id: 'pink', class: 'theme-pink' },
        { id: 'violet', class: 'theme-violet' },
        { id: 'black', class: 'theme-black' },
        { id: 'green', class: 'theme-green' },
        { id: 'red', class: 'theme-red' }
    ];

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="theme-switcher" ref={menuRef}>
            <button 
                className="theme-toggle-btn" 
                onClick={() => setIsOpen(!isOpen)}
                title="Change Theme"
            >
                <i className="fas fa-palette"></i>
            </button>

            {isOpen && (
                <div className="theme-menu">
                    {themes.map(theme => (
                        <div 
                            key={theme.id}
                            className={`theme-option ${theme.class} ${currentTheme === theme.id ? 'active' : ''}`}
                            onClick={() => {
                                setCurrentTheme(theme.id);
                                setIsOpen(false);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
