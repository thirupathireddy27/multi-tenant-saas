import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const UsersList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'user' });

    // Assuming we can get tenant ID from user context or we need to pass it
    // user object has tenantId
    const tenantId = user.tenantId;

    const fetchUsers = async () => {
        try {
            if (tenantId) {
                const res = await userApi.listTenantUsers(tenantId, { limit: 100 });
                if (res.data.success) {
                    setUsers(res.data.data.users);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) fetchUsers();
        else setLoading(false);
    }, [tenantId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await userApi.addToTenant(tenantId, newUser);
            setShowModal(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await userApi.delete(id);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting user');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 w-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 mt-2">Manage tenant users</p>
                </div>
                {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn"
                        onClick={() => setShowModal(true)}
                    >
                        + Add User
                    </motion.button>
                )}
            </div>

            <motion.div
                className="table-container overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 bg-gray-50/50">Details</th>
                            <th className="px-6 py-4 bg-gray-50/50">Role</th>
                            <th className="px-6 py-4 bg-gray-50/50">Status</th>
                            <th className="px-6 py-4 bg-gray-50/50">Actions</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {users.map((u) => (
                            <motion.tr
                                key={u.id}
                                variants={rowVariants}
                                whileHover={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                            >
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{u.fullName}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 font-medium text-sm transition-colors">
                                        Delete
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
                {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No users found.</div>
                )}
            </motion.div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Add User</h2>
                        <form onSubmit={handleCreate}>
                            <div>
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={newUser.fullName}
                                    onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label>Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="tenant_admin">Tenant Admin</option>
                                </select>
                            </div>
                            <div className="button-group">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersList;
