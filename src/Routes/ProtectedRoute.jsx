import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requirePayment = true }) => {
    const { isLoggedIn, isPaid, checkPaymentStatus } = useAuth();
    const [checkingPayment, setCheckingPayment] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchStatus = async () => {
            if (requirePayment && isPaid === null) {
                await checkPaymentStatus();
            }
            setCheckingPayment(false);
        };
        fetchStatus();
    }, [requirePayment, isPaid, checkPaymentStatus]);

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ redirectTo: location.pathname }} replace />;
    }

    if (checkingPayment) {
        return <p>Checking access...</p>;
    }

    if (requirePayment && !isPaid) {
        return <Navigate to="/ResultsPage" />;
    }

    return children;
};

export default ProtectedRoute;
