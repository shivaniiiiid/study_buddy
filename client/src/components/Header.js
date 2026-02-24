import React from 'react';
import { useTheme } from '../ThemeContext';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <header className="header">
            <div className="header-inner">
                <div className="header-logo">
                    <div className="header-logo-icon">🎓</div>
                    <div>
                        <h1>StudyBuddy</h1>
                        <div className="subtitle">AI-Powered Study Organizer</div>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    id="theme-toggle-btn"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle theme"
                >
                    <div className="toggle-track">
                        <span className="toggle-icon toggle-icon-sun">☀️</span>
                        <span className="toggle-icon toggle-icon-moon">🌙</span>
                        <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`} />
                    </div>
                    <span className="toggle-label">{isDark ? 'Dark' : 'Light'}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
