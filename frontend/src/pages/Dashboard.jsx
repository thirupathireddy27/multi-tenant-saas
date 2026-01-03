import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projectRes = await projectApi.list({ limit: 5 });
                if (projectRes.data.success) {
                    setRecentProjects(projectRes.data.data.projects);
                    setStats(prev => ({ ...prev, totalProjects: projectRes.data.data.total }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

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
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-8"
                style={{ textAlign: 'left' }}
            >
                Dashboard
            </motion.h1>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            >
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="card flex flex-col justify-center min-h-[200px]">
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Projects</h3>
                    <p className="text-6xl font-bold my-2 text-indigo-600">{stats.totalProjects}</p>
                </motion.div>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="card flex flex-col justify-center min-h-[200px]">
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Welcome</h3>
                    <p className="text-3xl font-bold my-2 text-slate-800">{user.fullName}</p>
                    <p className="text-base text-slate-500">{user.role}</p>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem', backgroundColor: 'transparent' }}>
                    <h2 className="text-2xl font-bold text-gray-800 m-0">Recent Projects</h2>
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all font-semibold shadow-sm text-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        View All <span className="text-lg">&rarr;</span>
                    </Link>
                </div>

                {recentProjects.length === 0 ? (
                    <div className="card text-center py-8">
                        <p className="text-gray-500">No projects yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recentProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="project-card group"
                            >
                                <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{project.name}</h3>
                                        <span className={`status-pill status-${project.status}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p style={{ color: '#4b5563', marginBottom: '1.5rem', height: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {project.description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#6b7280', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <span>Tasks: {project.taskCount || 0}</span>
                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;
