import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';

const RegisterTenant = () => {
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        adminFullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.adminPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.registerTenant({
                tenantName: formData.tenantName,
                subdomain: formData.subdomain,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword,
                adminFullName: formData.adminFullName
            });

            if (response.data.success) {
                alert('Registration successful! Please login.');
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem 0' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Register Organization</h2>
                {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <input
                            type="text"
                            name="tenantName"
                            className="form-input"
                            value={formData.tenantName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subdomain</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                name="subdomain"
                                className="form-input"
                                value={formData.subdomain}
                                onChange={handleChange}
                                required
                                pattern="[a-z0-9-]+"
                                title="Lowercase letters, numbers and hyphens only"
                            />
                            <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>.app.com</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Full Name</label>
                        <input
                            type="text"
                            name="adminFullName"
                            className="form-input"
                            value={formData.adminFullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Email</label>
                        <input
                            type="email"
                            name="adminEmail"
                            className="form-input"
                            value={formData.adminEmail}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="adminPassword"
                            className="form-input"
                            value={formData.adminPassword}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.875rem' }}>
                            <input type="checkbox" required /> I agree to the <a href="#">Terms & Conditions</a>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterTenant;
