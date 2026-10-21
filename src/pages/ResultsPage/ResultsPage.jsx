import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ResultsPage.scss";
import VideoEmbedComponent from "../../components/VideoEmbedComponent/VideoEmbedComponent";

const ResultsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [userSession, setUserSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        const savedSession = localStorage.getItem("userSession");
        if (savedSession) {
            setUserSession(JSON.parse(savedSession));
        }

        const storedResults = localStorage.getItem("results");

        if (location.state?.responseData) {
            const rawInstitutes = location.state.responseData.institutes;
            setResults(rawInstitutes);
            localStorage.setItem("results", JSON.stringify(rawInstitutes));
            setLoading(false);
        } else if (storedResults) {
            setResults(JSON.parse(storedResults));
            setLoading(false);
        } else {
            fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v1/institutes/primary_result`)
                .then((res) => res.json())
                .then((data) => {
                    setResults(data.institutes);
                    localStorage.setItem("results", JSON.stringify(data.institutes));
                    setLoading(false);
                })
                .catch(() => {
                    alert("Failed to load results. Please check your connection.");
                    setLoading(false);
                });
        }
    }, [location.state]);

    const handleEnhancedResults = () => {
        if (isLoggedIn === null) {
            return;
        }

        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }

        const preferences = JSON.parse(localStorage.getItem("preferences") || "{}");
        const selectedYesAnswers = Object.keys(preferences).filter(key => preferences[key] === true);
        const userSession = JSON.parse(localStorage.getItem("userSession"));
        navigate("/EnhancedQuestions", {
            state: {
                preferences: selectedYesAnswers,
                userSession,
                institutes: results
            }
        });
    };

    if (loading) return <p>Loading results...</p>;

    return (
        <>
            {showLoginPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Please log in to access Advanced results.</p>
                        <button onClick={() => navigate("/MobileLogin", { state: { redirectTo: "/EnhancedQuestions" } })}>
                            Log In
                        </button>
                        <button className="popup-close" onClick={() => setShowLoginPopup(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="results-container">

                <div className="table-container">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th colSpan={2}>
                                    <h1>Best Institutes & Branches for You</h1>
                                </th>
                            </tr>
                            <tr>
                                <th>Institute Name</th>
                                <th>Available Branches</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((institute, index) => (
                                <tr key={index}>
                                    <td>{institute.name}</td>
                                    <td>{institute.department_name}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={2} className="enhanced-button-cell">
                                    <button className="enhanced-results" onClick={handleEnhancedResults}>
                                        Get Advanced recommendations @ ₹59
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <VideoEmbedComponent />
        </>
    );
};

export default ResultsPage;