import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectList = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    const fetchProjects = async () => {
        try {
            const res = await projectApi.list({ limit: 100 });
            if (res.data.success) {
                setProjects(res.data.data.projects);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await projectApi.create(newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating project');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectApi.delete(id);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting project');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 w-full"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 mt-2">Manage your projects and tasks</p>
                </div>
                {(user.role === 'tenant_admin' || user.role === 'user') && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal(true)}
                        className="btn"
                    >
                        + New Project
                    </motion.button>
                )}
            </motion.div>

            {projects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card text-center py-12"
                >
                    <p className="text-gray-500 text-lg">No projects found. Create one to get started!</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            variants={itemVariants}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="project-card relative group"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{project.name}</h3>
                                </Link>
                                <span className={`status-pill status-${project.status}`}>
                                    {project.status}
                                </span>
                            </div>
                            <p style={{ color: '#4b5563', marginBottom: '1.5rem', height: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {project.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#6b7280' }}>Tasks: {project.taskCount || 0}</span>
                                    {user.role === 'super_admin' && (
                                        <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginTop: '0.25rem' }}>
                                            {project.tenantName}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                    {/* Delete Button for Tenant Admin/Super Admin */}
                                    {(user.role === 'tenant_admin' || user.role === 'super_admin' || user.role === 'user') && (
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleDelete(project.id); }}
                                            className="status-pill"
                                            style={{
                                                background: '#fee2e2',
                                                color: '#ef4444',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">New Project</h2>
                        <form onSubmit={handleCreate}>
                            <div>
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                    placeholder="e.g., Website Redesign"
                                />
                            </div>
                            <div>
                                <label>Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    rows="3"
                                    className="w-full mt-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Brief description of the project..."
                                />
                            </div>
                            <div className="button-group">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
