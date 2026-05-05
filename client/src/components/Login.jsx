import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import { BASE_URL } from '../api';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '', role: 'Patient' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const roles = ['Patient', 'Caretaker', 'Family Member', 'Staff', 'Admin'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${BASE_URL}/api/auth/login`, formData);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Check if the role matches the selected role (optional but often requested)
            if (res.data.user.role !== formData.role) {
                setError(`Incorrect role selected. You are registered as ${res.data.user.role}.`);
                setLoading(false);
                return;
            }

            addToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                const { role } = res.data.user;
                if (role === 'Patient') navigate('/dashboard/patient');
                else if (role === 'Caretaker') navigate('/dashboard/caretaker');
                else if (role === 'Family Member') navigate('/dashboard/family');
                else if (role === 'Staff') navigate('/dashboard/staff');
                else if (role === 'Admin') navigate('/dashboard/admin');
            }, 800);
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
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
                <h2>Welcome Back</h2>
                <p>Login to your account to continue</p>
                {error && <p className="status-msg error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Login as</label>
                        <div className="role-selector">
                            {roles.map(r => (
                                <button 
                                    key={r} 
                                    type="button"
                                    className={`role-btn ${formData.role === r ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: r })}
                                >
                                    {r}
                                </button>
                            ))}
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
                            <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Login'}
                    </button>
                    
                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button 
                        type="button" 
                        className="btn btn-outline btn-block guest-btn"
                        onClick={() => {
                            const guestUser = {
                                name: `Guest ${formData.role}`,
                                email: `guest_${formData.role.toLowerCase().replace(' ', '_')}@example.com`,
                                role: formData.role,
                                isGuest: true
                            };
                            localStorage.setItem('token', 'guest-token-' + Date.now());
                            localStorage.setItem('user', JSON.stringify(guestUser));
                            addToast(`Logged in as Guest ${formData.role}`, 'success');
                            
                            const { role } = guestUser;
                            if (role === 'Patient') navigate('/dashboard/patient');
                            else if (role === 'Caretaker') navigate('/dashboard/caretaker');
                            else if (role === 'Family Member') navigate('/dashboard/family');
                            else if (role === 'Staff') navigate('/dashboard/staff');
                            else if (role === 'Admin') navigate('/dashboard/admin');
                        }}
                    >
                        <i className="fas fa-user-secret"></i> Continue as Guest
                    </button>

                    <p className="auth-footer">Don't have an account? <Link to="/register">Register</Link></p>
                </form>
            </div>
        </div>
    );
};

export default Login;

