import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';
import './LandingPage.css';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const statsRef = useRef(null);
    const scrollRef = useRef(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    const scroll = (direction) => {
        const { current } = scrollRef;
        if (current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Counter animation logic
                    if (entry.target.classList.contains('stat-item')) {
                        const numEl = entry.target.querySelector('.stat-number');
                        if (numEl.getAttribute('data-started')) return;
                        numEl.setAttribute('data-started', 'true');
                        
                        const target = parseFloat(numEl.getAttribute('data-target'));
                        const duration = 2000;
                        const start = 0;
                        const step = (timestamp) => {
                            if (!numEl.startTime) numEl.startTime = timestamp;
                            const progress = Math.min((timestamp - numEl.startTime) / duration, 1);
                            const current = (progress * (target - start) + start);
                            numEl.innerText = target % 1 === 0 ? Math.floor(current) : current.toFixed(1);
                            if (progress < 1) {
                                window.requestAnimationFrame(step);
                            }
                        };
                        window.requestAnimationFrame(step);
                    }
                }
            });
        }, { threshold: 0.05 });

        document.querySelectorAll('.reveal, .stat-item').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const features = [
        { icon: 'fa-prescription-bottle-alt', title: 'Saline Level Prediction', desc: 'Advanced AI monitors saline levels in real-time and predicts when a replacement is needed, preventing risks.' },
        { icon: 'fa-user-nurse', title: 'Posture Detection', desc: 'Continuous skeletal tracking detects patient falls, discomfort, or restricted movement instantly for rapid response.' },
        { icon: 'fa-sign-language', title: 'Hand Gestures', desc: 'Detect specific hand gestures to trigger alerts or requests without physical effort, empowering touchless communication.' },
        { icon: 'fa-user-shield', title: 'Unknown Person Detection', desc: 'Secure the environment with AI facial recognition that identifies unauthorized individuals entering the room.' },
        { icon: 'fa-bell', title: 'Smart Alerts', desc: 'Instant notifications sent to caretakers and staff when any critical event or gesture is detected by the AI.' },
        { icon: 'fa-video', title: '24/7 Monitoring', desc: 'Round-the-clock automated supervision that never sleeps, ensuring total patient safety and peace of mind.' },
    ];

    const steps = [
        { num: '01', icon: 'fa-user-plus', title: 'Register', desc: 'Create your account as a Patient, Caretaker, or Admin in seconds.' },
        { num: '02', icon: 'fa-link', title: 'Connect', desc: 'Patients search for caretakers by ID and send connection requests.' },
        { num: '03', icon: 'fa-heartbeat', title: 'Monitor', desc: 'Caretakers track patient vitals and receive emergency alerts instantly.' },
    ];

    return (
        <div className="landing-container">
            {/* Background Decorations */}
            <div className="mesh-bg"></div>
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <i className="fas fa-eye"></i>
                    <span className="app-name">Paryavekshan</span>
                </div>

                <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>

                <div className={`nav-content ${isMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="nav-navigation">
                        <button onClick={() => scrollTo('features')} className="nav-item">Features</button>
                        <button onClick={() => scrollTo('how-it-works')} className="nav-item">How it Works</button>
                    </div>
                    <div className="nav-links">
                        <ThemeSwitcher />
                        <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main className="hero">
                <div className="hero-content reveal">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span>
                        24/7 AI-Powered Supervision
                    </div>
                    <h1 className="hero-title">
                        The Future of Patient Safety <br />
                        <span>is Automated.</span>
                    </h1>
                    <p className="hero-description">
                        Paryavekshan uses advanced computer vision to monitor saline levels, patient posture, and security in real-time.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started <i className="fas fa-arrow-right"></i>
                        </Link>
                        <button 
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} 
                            className="btn btn-outline btn-lg"
                        >
                            Explore Platform
                        </button>
                    </div>
                    <div className="hero-stats-row">
                        <div className="mini-stat">
                            <strong>10k+</strong>
                            <span>Active Monitoring</span>
                        </div>
                        <div className="mini-stat">
                            <strong>99.9%</strong>
                            <span>Detection Accuracy</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual reveal">
                    <div className="hero-image-wrapper">
                        <img src="/paryavekshan_hero.png" alt="AI Monitoring Dashboard" />
                        <div className="hero-glow"></div>
                    </div>
                    <div className="hero-floating-card">
                        <i className="fas fa-check-circle"></i>
                        <div>
                            <span>Saline Level</span>
                            <strong>85% Normal</strong>
                        </div>
                    </div>
                </div>
            </main>

            {/* Brand Showcase Section */}
            <section className="brand-showcase">
                <div className="reveal">
                    <h2 className="massive-brand">Paryavekshan</h2>
                </div>
            </section>

            {/* Features Slider */}
            <section id="features" className="features-slider-section">
                <div className="container">
                    <div className="section-header reveal">
                        <h2>Explore <span>Features</span></h2>
                        <p>Deep dive into our specialized AI supervision modules.</p>
                    </div>

                    <div className="slider-wrapper reveal">
                        <button className="slider-btn left" onClick={() => scroll('left')}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <div className="features-scroll-container" ref={scrollRef}>
                            {features.map((f, i) => (
                                <div key={i} className="feature-card-v horizontal">
                                    <div className="feature-card-icon">
                                        <i className={`fas ${f.icon}`}></i>
                                    </div>
                                    <div className="feature-card-content">
                                        <h3>{f.title}</h3>
                                        <p>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="slider-btn right" onClick={() => scroll('right')}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="container">
                    <div className="section-header reveal">
                        <h2>How It <span>Works</span></h2>
                        <p>Get started in three simple steps.</p>
                    </div>
                    <div className="steps-row">
                        {steps.map((s, i) => (
                            <div key={i} className="step-card reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                                <span className="step-num">{s.num}</span>
                                <div className="step-icon"><i className={`fas ${s.icon}`}></i></div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card glass-panel reveal">
                        <h2>Ready to monitor patient?</h2>
                        <p>Join thousands of users already using Paryavekshan for AI-powered supervision.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <i className="fas fa-arrow-right"></i></Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="logo">
                                <i className="fas fa-eye"></i>
                                <span className="app-name">Paryavekshan</span>
                            </div>
                            <p>Next-generation AI patient monitoring for hospitals and home care.</p>
                        </div>
                        <div className="footer-links">
                            <h4>Platform</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How It Works</a>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </div>
                        <div className="footer-links">
                            <h4>Support</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <div className="footer-links">
                            <h4>Connect</h4>
                            <a href="#"><i className="fab fa-twitter"></i> Twitter</a>
                            <a href="#"><i className="fab fa-github"></i> GitHub</a>
                            <a href="#"><i className="fab fa-linkedin"></i> LinkedIn</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Paryavekshan AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
