import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterTenant from './pages/RegisterTenant';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import UsersList from './pages/UsersList';
import TenantsList from './pages/TenantsList';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function Layout({ children }) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterTenant />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/projects" element={
                    <ProtectedRoute>
                        <Layout>
                            <ProjectList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/projects/:projectId" element={
                    <ProtectedRoute>
                        <Layout>
                            <ProjectDetails />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/users" element={
                    <ProtectedRoute roles={['tenant_admin']}>
                        <Layout>
                            <UsersList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/tenants" element={
                    <ProtectedRoute roles={['super_admin']}>
                        <Layout>
                            <TenantsList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
