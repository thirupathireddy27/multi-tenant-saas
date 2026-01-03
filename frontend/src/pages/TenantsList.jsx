import React, { useEffect, useState } from 'react';
import { tenantApi } from '../services/api';

const TenantsList = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTenants = async () => {
        try {
            const res = await tenantApi.list({ limit: 100 });
            if (res.data.success) {
                setTenants(res.data.data.tenants);
            }
        } catch (err) {
            console.error('Failed to fetch tenants:', err);
            setError('Failed to load tenants. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    if (loading) return <div className="container" style={{ paddingTop: '2rem' }}>Loading tenants...</div>;
    if (error) return <div className="container" style={{ paddingTop: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Tenants</h1>
                {/* Add Tenant button could go here if implemented */}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Subdomain</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(t => (
                            <tr key={t.id}>
                                <td style={{ fontWeight: '500' }}>{t.name}</td>
                                <td><span style={{ fontFamily: 'monospace' }}>{t.subdomain}</span></td>
                                <td>
                                    {t.status === 'active'
                                        ? <span className="badge badge-green">Active</span>
                                        : <span className="badge badge-red">{t.status}</span>
                                    }
                                </td>
                                <td><span className="badge badge-gray">{t.subscription_plan}</span></td>
                                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No tenants found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TenantsList;
