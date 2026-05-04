import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'Patient',
        hospitalName: '',
        hospitalLocation: ''
    });
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${BASE_URL}/api/auth/register`, formData);
            const msg = `Registered successfully! Your ID is: ${res.data.uniqueId}`;
            setMessage(msg);
            addToast(msg, 'success');
            setTimeout(() => navigate('/login'), 2500);
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed. Please try again.';
            setMessage(msg);
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
            <div className="auth-card glass-panel">
                <div className="auth-icon">
                    <i className="fas fa-eye"></i>
                </div>
                <h2>Create Account</h2>
                <p>Join our monitoring network today</p>
                {message && (
                    <p className={`status-msg ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Register as</label>
                        <div className="role-selector">
                            {['Patient', 'Staff', 'Caretaker', 'Family Member', 'Admin'].map(r => {
                                // Must match the backend User model enum exactly
                                const roleValue = r;
                                
                                const isActive = formData.role === roleValue;

                                return (
                                    <button 
                                        key={r} 
                                        type="button"
                                        className={`role-btn ${isActive ? 'active' : ''}`}
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            role: roleValue
                                        })}
                                    >
                                        {r}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {formData.role.toLowerCase() === 'admin' && (
                        <div className="admin-fields animate-fade-in">
                            <div className="form-group">
                                <label>Hospital Name</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-hospital input-icon"></i>
                                    <input type="text" placeholder="Enter hospital name" required
                                        value={formData.hospitalName}
                                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Hospital Location</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-map-marker-alt input-icon"></i>
                                    <input type="text" placeholder="City, State" required
                                        value={formData.hospitalLocation}
                                        onChange={(e) => setFormData({ ...formData, hospitalLocation: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <i className="fas fa-user input-icon"></i>
                            <input type="text" placeholder="Enter your full name" required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <i className="fas fa-envelope input-icon"></i>
                            <input type="email" placeholder="Enter your email" required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <i className="fas fa-lock input-icon"></i>
                            <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Register Now'}
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button 
                        type="button" 
                        className="btn btn-outline btn-block guest-btn"
                        onClick={() => {
                            const currentRole = formData.role.toLowerCase();
                            const guestUser = {
                                name: `Guest ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}`,
                                email: `guest_${currentRole}@example.com`,
                                role: currentRole,
                                isGuest: true
                            };
                            localStorage.setItem('token', 'guest-token-' + Date.now());
                            localStorage.setItem('user', JSON.stringify(guestUser));
                            addToast(`Logged in as Guest ${guestUser.name}`, 'success');
                            
                            if (currentRole === 'patient') navigate('/dashboard/patient');
                            else if (currentRole === 'caretaker') navigate('/dashboard/staff');
                            else if (currentRole === 'family') navigate('/dashboard/family');
                            else if (currentRole === 'admin') navigate('/dashboard/admin');
                            else navigate('/dashboard');
                        }}
                    >
                        <i className="fas fa-user-secret"></i> Continue as Guest
                    </button>

                    <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
                </form>
            </div>
        </div>
    );
};

export default Register;

