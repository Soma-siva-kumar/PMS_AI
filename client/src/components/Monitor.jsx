import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './Monitor.css';

const Monitor = () => {
    const { id, type } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [source, setSource] = useState(null); // 'mobile', 'cctv'
    const [isStreaming, setIsStreaming] = useState(false);
    const [showSrcInput, setShowSrcInput] = useState(false);
    const [customSrc, setCustomSrc] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    };

    const handleSourceSelect = async (selectedSource) => {
        setSource(selectedSource);
        setShowSrcInput(true);
    };

    const startStream = async () => {
        if (!customSrc) {
            addToast('Please enter a valid source URL', 'warning');
            return;
        }

        stopStream();
        setShowSrcInput(false);
        setIsStreaming(true);
        addToast(`Connecting to ${source === 'mobile' ? 'Mobile' : 'CCTV'} Stream at ${customSrc}...`, 'info');
    };

    useEffect(() => {
        return () => stopStream();
    }, []);

    useEffect(() => {
        let timer;
        if (isStreaming) {
            timer = setInterval(() => setCurrentTime(new Date()), 1000);
        }
        return () => clearInterval(timer);
    }, [isStreaming]);

    return (
        <div className="monitor-container">
            <header className="monitor-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="back-btn-modern">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="monitor-title">
                        <h2>{type ? type.charAt(0).toUpperCase() + type.slice(1) : 'General'} Monitoring</h2>
                        <span>Patient ID: {id} &bull; Clinical Room 104</span>
                    </div>
                </div>
                <div className="monitor-badges">
                    {isStreaming && <span className="live-badge"><span className="dot"></span> LIVE</span>}
                    <span className="secure-badge"><i className="fas fa-shield-alt"></i> Encrypted</span>
                </div>
            </header>

            <div className="monitor-content-grid">
                <div className="video-main-frame glass-panel animate-fade-in">
                    {source && isStreaming ? (
                        <div className="video-wrapper">
                            <div className="python-stream-container">
                                <img 
                                    src={`${customSrc}`} 
                                    alt="Live Stream" 
                                    className="live-video-element"
                                    onError={() => addToast('Stream connection lost. Please check source URL.', 'error')}
                                />
                                <div className="stream-info-overlay" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0, 0, 0, 0.6)' }}>
                                    <span>TYPE: {source.toUpperCase()}</span>
                                    <span>SRC: {customSrc}</span>
                                    <span style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '6px', color: '#fff', fontWeight: 'bold', border: '1px solid #ff4757', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="pulse-dot" style={{ background: '#ff4757', width: '8px', height: '8px' }}></span>
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {currentTime.toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="source-prompt">
                            <i className="fas fa-broadcast-tower animate-pulse"></i>
                            <h3>No Active Stream</h3>
                            <p>Please select a video source to begin monitoring the patient.</p>
                        </div>
                    )}

                    {showSrcInput && (
                        <div className="src-input-overlay animate-zoom-in">
                            <div className="src-input-card glass-panel">
                                <h3>
                                    <i className={source === 'mobile' ? 'fas fa-mobile-alt' : 'fas fa-video'}></i> 
                                    {source === 'mobile' ? ' Mobile Cam' : ' CCTV Cam'} Source
                                </h3>
                                <p>Enter the {source === 'mobile' ? 'IP Webcam' : 'NVR/CCTV'} stream URL:</p>
                                <input 
                                    type="text" 
                                    placeholder={source === 'mobile' ? "http://192.168.1.5:8080/video" : "rtsp://admin:12345@192.168.1.10:554"} 
                                    value={customSrc}
                                    onChange={(e) => setCustomSrc(e.target.value)}
                                    autoFocus
                                />
                                <div className="src-input-actions">
                                    <button className="btn btn-primary" onClick={startStream}>Connect Stream</button>
                                    <button className="btn btn-outline" onClick={() => setShowSrcInput(false)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="monitor-sidebar">
                    <div className="source-selection-card glass-panel animate-slide-up">
                        <h3><i className="fas fa-link"></i> Select Video Source</h3>
                        <div className="source-options-list">
                            <button 
                                className={`source-option-btn ${source === 'mobile' ? 'active' : ''}`}
                                onClick={() => handleSourceSelect('mobile')}
                            >
                                <div className="option-icon">
                                    <i className="fas fa-mobile-alt"></i>
                                </div>
                                <div className="option-text">
                                    <strong>Mobile Cam</strong>
                                    <span>Direct device camera feed</span>
                                </div>
                            </button>

                            <button 
                                className={`source-option-btn ${source === 'cctv' ? 'active' : ''}`}
                                onClick={() => handleSourceSelect('cctv')}
                            >
                                <div className="option-icon">
                                    <i className="fas fa-video"></i>
                                </div>
                                <div className="option-text">
                                    <strong>CCTV Cam</strong>
                                    <span>Wired IP camera network</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Monitor;
