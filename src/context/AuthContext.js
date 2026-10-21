import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { clearCachedProfile } from "../services/supabaseService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isPaid, setIsPaid] = useState(null);


    const checkPaymentStatus = useCallback(async () => {
        // Backend verification removed as requested
        setIsPaid(true);
    }, []);


    useEffect(() => {
        const savedSession = localStorage.getItem("userSession");
        if (savedSession) {
            setUser(JSON.parse(savedSession));
            checkPaymentStatus();
        }
    }, [checkPaymentStatus]);

    const login = (userData) => {
        localStorage.setItem("userSession", JSON.stringify(userData));
        localStorage.setItem("authToken", userData.token);
        setUser(userData);
        checkPaymentStatus();
    };

    const logout = () => {
        localStorage.removeItem("userSession");
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("userEmail");
        clearCachedProfile();
        setUser(null);
        setIsPaid(null);
    };

    const isLoggedIn = !!user;

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, isPaid, login, logout, checkPaymentStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);