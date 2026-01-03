import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, taskApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]); // For assignment
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });

    const fetchData = async () => {
        try {
            // Get Project (Using list with ID implicit filter not ideal, but we need details.
            // Wait, I implemented GET /api/projects? but what about /api/projects/:id?
            // In projectController.js, I DID implement updateProject and deleteProject but NOT getProject.
            // listProjects returns all.
            // I should use the list and find? Or implement GET /:id.
            // For now, I will assume GET /:id is NOT available and use list filtered?
            // Wait, standard practice is to have GET.
            // I will implement GET Project in Backend real quick in next step.
            // For now I assume it exists: projectApi.get(projectId). 
            // If it fails, I'll fix backend.

            // Actually, I can filter the list if backend doesn't support it yet to avoid breaking flow.
            // But let's assume I fix backend. 
            // Update: I will fix backend in next tool call.

            const pRes = await projectApi.get(projectId);
            // Wait, if I didn't implement it in backend, this will 404.
            // I'll stick to 'list' then filter for now to be safe, OR fix backend.
            // Let's fix backend properly.

            // Proceed assuming backend fixed.
            if (pRes.data.success) {
                setProject(pRes.data.data);
            }

            const tRes = await taskApi.list(projectId);
            if (tRes.data.success) {
                setTasks(tRes.data.data.tasks);
            }

            // Get users for assignment
            if (user.role === 'tenant_admin' || user.tenantId) {
                const uRes = await userApi.listTenantUsers(user.tenantId, { limit: 100 });
                if (uRes.data.success) {
                    setMembers(uRes.data.data.users);
                }
            }

        } catch (err) {
            console.error(err);
            // navigate('/projects'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await taskApi.create(projectId, {
                ...newTask,
                assignedTo: newTask.assignedTo || null
            });
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskApi.updateStatus(taskId, newStatus);
            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error(err);
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
    if (!project) return <div className="p-6 text-center text-gray-500">Project not found</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                    <span className={`status-pill status-${project.status}`}>
                        {project.status}
                    </span>
                </div>
                <p className="text-gray-600 text-lg">{project.description}</p>
            </motion.div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn"
                    onClick={() => setShowTaskModal(true)}
                >
                    + Add Task
                </motion.button>
            </div>

            <motion.div
                className="table-container overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 bg-gray-50/50">Title</th>
                            <th className="px-6 py-4 bg-gray-50/50">Assigned To</th>
                            <th className="px-6 py-4 bg-gray-50/50">Priority</th>
                            <th className="px-6 py-4 bg-gray-50/50">Status</th>
                            <th className="px-6 py-4 bg-gray-50/50">Due Date</th>
                            <th className="px-6 py-4 bg-gray-50/50">Actions</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {tasks.map(task => (
                            <motion.tr
                                key={task.id}
                                variants={rowVariants}
                                whileHover={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {task.assignedTo ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                {task.assignedTo.fullName.charAt(0)}
                                            </div>
                                            {task.assignedTo.fullName}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`status-pill priority-${task.priority}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="todo">Todo</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={async () => {
                                            if (confirm('Delete task?')) {
                                                try {
                                                    await taskApi.delete(task.id);
                                                    fetchData();
                                                } catch (e) { alert('Error deleting task'); }
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-600 font-medium text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
                {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No tasks found. Create one to get started!</div>
                )}
            </motion.div>

            {showTaskModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">New Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                    placeholder="Task Title"
                                />
                            </div>
                            <div>
                                <label>Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    rows="3"
                                    className="w-full mt-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Task details..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label>Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label>Assign To</label>
                                    <select
                                        value={newTask.assignedTo}
                                        onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="button-group">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
