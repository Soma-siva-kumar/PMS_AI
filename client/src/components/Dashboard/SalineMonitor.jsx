import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';
import './SalineMonitor.css';

const SalineMonitor = () => {
    const { id } = useParams(); // patient uniqueId
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [level, setLevel] = useState(0); // Percentage 0-100
    const [patient, setPatient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [alarmThreshold, setAlarmThreshold] = useState(null);
    const [draftAlarm, setDraftAlarm] = useState(null);
    const socketRef = useRef();

    useEffect(() => {
        // Fetch patient details
        const fetchPatient = async () => {
            try {
                // Search for patient by uniqueId
                const res = await axios.get(`${BASE_URL}/api/users/patients`);
                const found = res.data.find(p => p.uniqueId === id);
                if (found) setPatient(found);
                else addToast('Patient record not found', 'error');
            } catch (err) {
                addToast('Failed to load patient info', 'error');
            }
        };
        fetchPatient();

        // Connect to Socket.io
        socketRef.current = io(BASE_URL);

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

    // Check alarm threshold whenever level changes
    useEffect(() => {
        if (alarmThreshold !== null && level > 0 && level < alarmThreshold) {
            addToast(`ALARM: Saline level has dropped below ${alarmThreshold}% (Current: ${level}%)`, 'warning');
            setAlarmThreshold(null); // Reset after triggering to prevent spam
            setDraftAlarm(null);
        }
    }, [level, alarmThreshold, addToast]);

    const handleSaveAlarm = () => {
        setAlarmThreshold(draftAlarm);
        if (draftAlarm) {
            addToast(`Alarm activated: < ${draftAlarm}%`, 'success');
        } else {
            addToast('Alarm disabled', 'info');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        addToast('Analyzing image...', 'info');

        // Simulate AI analysis delay
        setTimeout(() => {
            const simulatedLevel = Math.floor(Math.random() * 60) + 10; // Random level between 10 and 70
            setLevel(simulatedLevel);
            setHistory(prev => [{ val: simulatedLevel, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
            setIsAnalyzing(false);
            addToast(`Analysis complete: ${simulatedLevel}% remaining`, 'success');
        }, 2500);
    };

    const getLiquidColor = () => {
        if (level <= 15) return '#ff4d4d'; // Red
        if (level <= 40) return '#ffa500'; // Orange
        return '#00d2ff'; // Blue/Cyan
    };

    const exportHistoryJSON = () => {
        const dataToExport = history.length > 0 ? history : [{ time: new Date().toLocaleTimeString(), val: level, note: "Initial Snapshot" }];
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saline-history-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="saline-monitor-container">
            <header className="monitor-header animate-fade-in">
                <div className="patient-context">
                    <button onClick={() => navigate(-1)} className="back-btn"><i className="fas fa-chevron-left"></i></button>
                    <div>
                        <h2>Saline bottle level detection</h2>
                        <p>{patient?.name || 'Loading...'} | ID: {id}</p>
                    </div>
                </div>
                <div className={`status-badge ${connected ? 'status-online' : 'status-offline'}`}>
                    <span className="dot"></span> {connected ? 'Live Data Active' : 'Connecting AI Engine...'}
                </div>
            </header>

            <main className="saline-main" style={{ display: 'flex', flexDirection: 'row', gap: '25px', overflowX: 'auto', alignItems: 'stretch', paddingBottom: '10px' }}>

                {/* Left: Bottle */}
                <div className="visualization-section glass-panel animate-zoom-in" style={{ background: 'rgba(10, 25, 47, 0.7)', border: '1px solid rgba(0, 210, 255, 0.2)', minWidth: '320px', flex: '1 1 50%', padding: '40px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-tint" style={{ color: 'white' }}></i> Current Level
                    </h3>
                    <div className="bottle-wrapper">
                        <div className="iv-hanger"></div>
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
                        <div className="iv-port"></div>
                        <div className="iv-drip-chamber"></div>
                        <div className="percentage-display">{level}%</div>
                    </div>
                </div>

                {/* Right: Records + Alarm + Upload */}
                <div className="info-sidebar" style={{ minWidth: '320px', flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Previous Records */}
                    <div className="history-card glass-panel animate-slide-up">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}><i className="fas fa-history"></i> Previous Records</h3>
                            <button onClick={exportHistoryJSON} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.4)', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <i className="fas fa-file-export"></i> Export
                            </button>
                        </div>
                        <div className="history-list">
                            {history.map((h, i) => (
                                <div key={i} className="history-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-clock" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}></i>
                                        </div>
                                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{h.time}</span>
                                    </div>
                                    <strong style={{
                                        color: h.val <= 15 ? '#ff4d4d' : h.val <= 40 ? '#ffa500' : '#00d2ff',
                                        fontSize: '1.2rem',
                                        textShadow: `0 0 10px ${h.val <= 15 ? '#ff4d4d' : h.val <= 40 ? '#ffa500' : '#00d2ff'}66`
                                    }}>
                                        {h.val}%
                                    </strong>
                                </div>
                            ))}
                            {history.length === 0 && <p className="empty-hint">Awaiting AI inference...</p>}
                        </div>
                    </div>

                    {/* Alarm Card */}
                    <div className="alarm-card glass-panel animate-slide-up" style={{ padding: '20px', background: 'rgba(255, 165, 0, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 165, 0, 0.2)' }}>
                        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', justifyContent: 'center' }}>
                            <i className={`fas fa-bell ${alarmThreshold ? 'fa-shake' : ''}`} style={{ color: alarmThreshold ? '#ffa500' : 'var(--text-muted)' }}></i>
                            Set Alarm Threshold
                        </h3>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[75, 50, 25, 10].map(val => (
                                <button key={val} onClick={() => setDraftAlarm(draftAlarm === val ? null : val)}
                                    className={`btn ${draftAlarm === val ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '10px 20px', borderRadius: '20px', fontSize: '1rem', flex: '1 0 20%', minWidth: '100px' }}>
                                    &lt; {val}%
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={handleSaveAlarm} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 30px', borderRadius: '8px' }} disabled={draftAlarm === alarmThreshold}>
                                <i className="fas fa-save"></i> Save Settings
                            </button>
                            <button className="btn btn-outline" onClick={() => { setDraftAlarm(null); setAlarmThreshold(null); addToast('Alarm reset', 'info'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', color: '#ff7675', borderColor: '#ff767544' }} disabled={!alarmThreshold && !draftAlarm}>
                                <i className="fas fa-undo"></i> Reset
                            </button>
                        </div>
                        {alarmThreshold && (
                            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: '#ffa500', fontWeight: 'bold' }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i>
                                Active: Alarm will trigger below {alarmThreshold}%
                            </p>
                        )}
                    </div>

                    {/* Manual Upload */}
                    <div className="upload-card glass-panel animate-slide-up" style={{ padding: '20px', background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-upload"></i> Manual AI Check
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Upload an image or video of the saline bottle to run manual AI detection.
                        </p>
                        <div style={{ position: 'relative' }}>
                            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} id="manual-upload" disabled={isAnalyzing} />
                            <label htmlFor="manual-upload" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}>
                                {isAnalyzing ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-file-upload"></i> Select Image / Video</>}
                            </label>
                        </div>
                    </div>

                </div>
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .saline-main {
                        flex-direction: column !important;
                        overflow-x: visible !important;
                    }
                    .saline-main .visualization-section {
                        min-width: unset !important;
                        width: 100% !important;
                    }
                    .saline-main .info-sidebar {
                        min-width: unset !important;
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SalineMonitor;
