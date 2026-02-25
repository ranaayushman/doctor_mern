import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <Loader fullPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requiredRole) {
        // user.role is the primary check; fall back to isDoctor flag for legacy tokens
        const effectiveRole = user?.role
            || (user?.isDoctor === true ? 'doctor' : null)
            || (user?.isDoctor === false ? 'patient' : null);

        if (effectiveRole !== requiredRole) {
            return <Navigate to="/" />;
        }
    }

    return children;
};