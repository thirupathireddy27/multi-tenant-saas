import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/dashboard" className="nav-brand">
                    Multi-Tenant SaaS
                </Link>
                <div className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/projects">Projects</Link>

                    {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
                        <>
                            {/* Tasks are nested under projects, but maybe a global task view? */}
                        </>
                    )}

                    {user.role === 'tenant_admin' && (
                        <Link to="/users">Users</Link>
                    )}

                    {user.role === 'super_admin' && (
                        <Link to="/tenants">Tenants</Link>
                    )}

                    <span style={{ marginLeft: '1.5rem', fontWeight: 'bold' }}>{user.fullName} ({user.role})</span>
                    <button onClick={handleLogout} className="btn" style={{ marginLeft: '1rem', background: '#e5e7eb' }}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
