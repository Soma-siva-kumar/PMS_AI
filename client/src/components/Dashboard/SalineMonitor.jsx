import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useToast } from '../Toast';
import './SalineMonitor.css';

const SalineMonitor = () => {
    const { id } = useParams(); // patient uniqueId
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [level, setLevel] = useState(100); // Percentage 0-100
    const [patient, setPatient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState([]);
    const socketRef = useRef();

    useEffect(() => {
        // Fetch patient details
        const fetchPatient = async () => {
            try {
                // Search for patient by uniqueId
                const res = await axios.get('http://localhost:5000/api/users/patients');
                const found = res.data.find(p => p.uniqueId === id);
                if (found) setPatient(found);
                else addToast('Patient record not found', 'error');
            } catch (err) {
                addToast('Failed to load patient info', 'error');
            }
        };
        fetchPatient();

        // Connect to Socket.io
        socketRef.current = io('http://localhost:5000');

        socketRef.current.on('connect', () => {
            setConnected(true);
            socketRef.current.emit('join-patient-room', id);
        });

        socketRef.current.on('saline-level', (data) => {
            if (data.percentage <= 10 && level > 10) {
                addToast('CRITICAL: Saline level extremely low!', 'error');
                // Trigger alarm sound if needed
            }
            setLevel(data.percentage);
            setHistory(prev => [{ val: data.percentage, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
        });

        socketRef.current.on('disconnect', () => setConnected(false));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, addToast]);

    const getLiquidColor = () => {
        if (level <= 15) return '#ff4d4d'; // Red
        if (level <= 40) return '#ffa500'; // Orange
        return '#00d2ff'; // Blue/Cyan
    };

    return (
        <div className="saline-monitor-container">
            <header className="monitor-header animate-fade-in">
                <div className="patient-context">
                    <button onClick={() => navigate(-1)} className="back-btn"><i className="fas fa-chevron-left"></i></button>
                    <div>
                        <h2>Saline Monitoring</h2>
                        <p>{patient?.name || 'Loading...'} | ID: {id}</p>
                    </div>
                </div>
                <div className={`status-badge ${connected ? 'status-online' : 'status-offline'}`}>
                    <span className="dot"></span> {connected ? 'Live Data Active' : 'Connecting AI Engine...'}
                </div>
            </header>

            <main className="monitor-main">
                <div className="visualization-section glass-panel animate-zoom-in">
                    <div className="bottle-wrapper">
                        <div className="bottle-cap"></div>
                        <div className="bottle-neck"></div>
                        <div className="bottle-body">
                            <div className="liquid-fill" 
                                 style={{ 
                                     height: `${level}%`, 
                                     backgroundColor: getLiquidColor(),
                                     boxShadow: `0 0 30px ${getLiquidColor()}66`
                                 }}>
                                <div className="liquid-bubble b1"></div>
                                <div className="liquid-bubble b2"></div>
                                <div className="liquid-wave"></div>
                            </div>
                            <div className="bottle-gloss"></div>
                        </div>
                        <div className="percentage-display">{level}%</div>
                    </div>
                    <div className="vital-stats">
                        <div className="stat-card">
                            <label>Current Volume</label>
                            <strong>{Math.round(level * 5)} ml</strong>
                        </div>
                        <div className="stat-card">
                            <label>Estimated Remaining</label>
                            <strong>{Math.round(level * 0.8)} mins</strong>
                        </div>
                    </div>
                </div>

                <div className="info-sidebar">
                    <div className="alert-card glass-panel animate-slide-up">
                        <h3><i className="fas fa-bell"></i> Smart Alerts</h3>
                        <div className="alert-item">
                            <i className="fas fa-check-circle success"></i>
                            <span>Continuous flow detected</span>
                        </div>
                        {level < 20 && (
                            <div className="alert-item warning-alert">
                                <i className="fas fa-exclamation-triangle"></i>
                                <span>Refill required soon</span>
                            </div>
                        )}
                    </div>

                    <div className="history-card glass-panel animate-slide-up">
                        <h3><i className="fas fa-history"></i> Recent Readings</h3>
                        <div className="history-list">
                            {history.map((h, i) => (
                                <div key={i} className="history-item">
                                    <span>{h.time}</span>
                                    <strong>{h.val}%</strong>
                                </div>
                            ))}
                            {history.length === 0 && <p className="empty-hint">Awaiting AI inference...</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalineMonitor;
