import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';

const GESTURE_STATES = {
    detected:     { label: 'Yes', icon: 'fa-hand-paper', color: '#55efc4', bg: 'rgba(85,239,196,0.1)' },
    not_detected: { label: 'No',  icon: 'fa-hand-paper', color: '#ff4d4d', bg: 'rgba(255,77,77,0.05)' },
};

const GestureMonitor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [gesture, setGesture] = useState(null); // null = waiting
    const [patient, setPatient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState([]);
    const socketRef = useRef();

    useEffect(() => {

        const fetchPatient = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/users/patients`);
                const found = res.data.find(p => p.uniqueId === id);
                if (found) setPatient(found);
            } catch (err) {
                addToast('Failed to load patient info', 'error');
            }
        };
        fetchPatient();

        socketRef.current = io(BASE_URL);
        socketRef.current.on('connect', () => {
            setConnected(true);
            socketRef.current.emit('join-patient-room', id);
        });

        socketRef.current.on('gesture-update', (data) => {
            const isDetected = data.detected === true || data.gesture === 'Yes';
            setGesture(isDetected ? 'detected' : 'not_detected');

            if (isDetected) {
                setHistory(prev => [
                    { label: data.gesture_label || 'Hand Gesture', time: new Date().toLocaleString() },
                    ...prev
                ].slice(0, 30));
            }
        });

        socketRef.current.on('disconnect', () => setConnected(false));
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [id, addToast]);

    const state = gesture ? GESTURE_STATES[gesture] : null;

    const exportHistoryJSON = () => {
        const dataToExport = history.length > 0 ? history : [{ time: new Date().toLocaleTimeString(), gesture: gesture || "None", note: "Initial Snapshot" }];
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gesture-history-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
        <div style={{ padding: '30px', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'var(--glass)', border: '1px solid var(--border)', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1rem' }}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Hand Gesture Detection</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{patient?.name || 'Loading...'} | ID: {id}</p>
                    </div>
                </div>
                <div style={{ padding: '10px 20px', borderRadius: '50px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass)', border: `1px solid ${connected ? '#00ff8844' : '#ffa50044'}`, color: connected ? '#00ff88' : '#ffa500' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor', display: 'inline-block' }}></span>
                    {connected ? 'Live Data Active' : 'Connecting AI...'}
                </div>
            </header>

            <div className="ai-monitor-row">

                {/* Current Status Card */}
                <div className="ai-monitor-card" style={{
                    padding: '60px 30px',
                    borderRadius: '20px',
                    border: `2px solid ${state ? state.color : 'var(--border)'}`,
                    background: state ? state.bg : 'rgba(255,255,255,0.03)',
                    textAlign: 'center',
                    transition: 'all 0.5s ease',
                    boxShadow: gesture === 'detected' ? `0 0 40px ${GESTURE_STATES.detected.color}44` : 'none',
                    minWidth: '320px',
                    flex: '0 0 auto',
                }}>
                    {!state ? (
                        <>
                            <i className="fas fa-satellite-dish" style={{ fontSize: '4.5rem', color: 'var(--text-muted)', marginBottom: '25px', display: 'block' }}></i>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Awaiting AI Inference</p>
                        </>
                    ) : (
                        <>
                            <i
                                className={`fas ${state.icon}`}
                                style={{
                                    fontSize: '5rem',
                                    color: state.color,
                                    marginBottom: '25px',
                                    display: 'block',
                                    filter: gesture === 'detected' ? `drop-shadow(0 0 25px ${state.color})` : 'none',
                                    transform: gesture === 'detected' ? 'rotate(-20deg)' : 'none',
                                    transition: 'all 0.5s ease',
                                }}
                            ></i>
                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Hand Gesture Detected?</p>
                            <h1 style={{ margin: 0, fontSize: '3.5rem', fontWeight: '800', color: state.color, textShadow: gesture === 'detected' ? `0 0 20px ${state.color}88` : 'none' }}>{state.label}</h1>
                            {gesture === 'detected' && history.length > 0 && (
                                <p style={{ marginTop: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Last detected: <strong style={{ color: '#55efc4' }}>{history[0]?.time}</strong>
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Previous Records */}
                <div className="ai-monitor-card" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '20px', padding: '25px', minWidth: '380px', flex: '1 0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-history"></i> Previous Records
                            {history.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400' }}>{history.length} entries</span>}
                        </h3>
                        <button onClick={exportHistoryJSON} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.4)', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <i className="fas fa-file-export"></i> Export
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                        {history.map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(85,239,196,0.05)', borderRadius: '10px', border: '1px solid rgba(85,239,196,0.15)', transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'rgba(85,239,196,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-hand-paper" style={{ color: '#55efc4', fontSize: '1rem', transform: 'rotate(-20deg)' }}></i>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600', color: '#55efc4' }}>{h.label}</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gesture detected</p>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.time}</span>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '30px 0' }}>
                                No gestures detected yet. Awaiting AI inference...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <style>{`
            .ai-monitor-row {
                display: flex;
                flex-direction: row;
                gap: 25px;
                overflow-x: auto;
                align-items: flex-start;
                padding-bottom: 10px;
            }
            .ai-monitor-card {
                flex: 0 0 auto;
                min-width: 320px;
            }
            @media (max-width: 768px) {
                .ai-monitor-row {
                    flex-direction: column;
                    overflow-x: visible;
                }
                .ai-monitor-card {
                    min-width: unset;
                    width: 100%;
                }
            }
        `}</style>
        </>
    );
};

export default GestureMonitor;
