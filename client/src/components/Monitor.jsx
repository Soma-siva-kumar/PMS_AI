import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Monitor.css';

const Monitor = () => {
    const { id, type } = useParams(); // type could be 'live', 'posture', etc.
    const navigate = useNavigate();

    return (
        <div className="monitor-container">
            <header className="monitor-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <h2>{type ? type.toUpperCase() : 'General'} Monitoring - {id}</h2>
            </header>
            <div className="monitor-placeholder glass-panel">
                <i className="fas fa-microchip animate-pulse"></i>
                <h3>AI Engine Initializing...</h3>
                <p>Establishing secure link to patient {id} for {type || 'oversight'} detection.</p>
                <div className="loading-bar">
                    <div className="loading-progress"></div>
                </div>
            </div>
        </div>
    );
};

export default Monitor;
