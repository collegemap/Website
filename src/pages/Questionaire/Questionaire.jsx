import React, { useState, useEffect } from "react";
import { FaBriefcase, FaGraduationCap, FaBook, FaUniversity, FaRocket } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import "./Questionaire.scss";

const Questionaire = () => {
    const navigate = useNavigate();
    const preferenceLabels = {
        placement_score: "Placement",
        higher_studies_score: "Higher Studies",
        academics_experience_score: "Academic Experience",
        campus_score: "Campus Experience",
        entrepreneurship_score: "Entrepreneurship Culture",
    };
    const preferenceIcons = {
        placement_score: <FaBriefcase />,
        higher_studies_score: <FaGraduationCap />,
        academics_experience_score: <FaBook />,
        campus_score: <FaUniversity />,
        entrepreneurship_score: <FaRocket />,
    };

    const categories = [
        "EWS", "EWS (PwD)", "OBC-NCL", "OBC-NCL (PwD)",
        "OPEN", "OPEN (PwD)", "SC", "SC (PwD)", "ST", "ST (PwD)"
    ];

    const initialPreferences = {
        placement_score: null,
        higher_studies_score: null,
        academics_experience_score: null,
        campus_score: null,
        entrepreneurship_score: null,
    };

    const [rank, setRank] = useState("");
    const [category, setCategory] = useState("");
    const [gender, setGender] = useState("");
    const [preferences, setPreferences] = useState(initialPreferences);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [eligibilityMessage, setEligibilityMessage] = useState("");
    const [isEligible, setIsEligible] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        localStorage.removeItem("rank");
        localStorage.removeItem("category");
        localStorage.removeItem("gender");
        localStorage.removeItem("preferences");
    }, []);

    const handleSelection = (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const checkEligibility = async (rankVal, categoryVal, genderVal) => {
        setEligibilityLoading(true);
        setEligibilityMessage("Checking eligibility...");
        setIsEligible(null);
        try {
            const eligibilityResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v1/institutes/check_eligibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rank: rankVal, category: categoryVal, gender: genderVal }),
            });

            if (eligibilityResponse.ok) {
                const eligibilityData = await eligibilityResponse.json();
                if (eligibilityData.institutes && eligibilityData.institutes.length > 0) {
                    setIsEligible(true);
                    localStorage.setItem("institutes", JSON.stringify(eligibilityData.institutes));
                    setEligibilityMessage("");
                } else {
                    setIsEligible(false);
                    setEligibilityMessage("You are not eligible for any IITs.");
                }
            } else {
                setIsEligible(false);
                setEligibilityMessage("You are not eligible for any IITs.");
            }
        } catch (err) {
            setIsEligible(false);
            setEligibilityMessage("Something went wrong. Please try again.");
        } finally {
            setEligibilityLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (rank <= 0) {
            setError("Rank must be a positive number.");
            return;
        }

        if (!rank || !category || !gender || Object.values(preferences).some((val) => val === null || val === "")) {
            setError("Please fill all fields and answer all questions.");
            return;
        }
        const selectedPreferences = Object.values(preferences).filter(val => val === true).length;

        if (selectedPreferences < 2) {
            setError("Please select at least **two preferences** marked as 'Yes'.");
            return;
        }
        setError("");
        setShowPopup(true);
    };

    const handleConfirm = async () => {
        setShowPopup(false);
        setLoading(true);

        localStorage.setItem("rank", rank);
        localStorage.setItem("category", category);
        localStorage.setItem("gender", gender);
        localStorage.setItem("preferences", JSON.stringify(preferences));

        const requestData = { rank, category, preferences, gender };

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v1/institutes/primary_result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                alert("Failed to submit data. Please try again.");
                return;
            }

            const data = await response.json();
            navigate("/results", { state: { responseData: data } });
        } catch (error) {
            alert("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowPopup(false);
    };

    return (
        <div className="questionnaire-container">
            <h1 className="title">Find your PERFECT IIT branch</h1>
            <div className="questionnaire-box">
                <div className="input-group">
                    <label>JEE Advanced Rank:</label>
                    <input
                        type="number"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        placeholder="Enter your rank"
                        min="1"
                    />
                </div>
                <div className="input-group">
                    <label>Your Category:</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>Your gender preferences:</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Select Gender</option>
                        <option value="Female-only (including Supernumerary)">Female-only (Including Supernumerary)</option>
                        <option value="gender-Neutral">Gender-Neutral</option>
                    </select>
                </div>


                {/* <div className="check-eligibility-container">
                    <button onClick={() => checkEligibility(rank, category, gender)} disabled={eligibilityLoading}>
                        {eligibilityLoading ? "Checking Eligibility..." : "Get Results"}
                    </button>
                    {eligibilityMessage && <p className="eligibility-message">{eligibilityMessage}</p>}
                </div> */}

                <div className="check-eligibility-container">
                    {!isEligible && (
                        <button onClick={() => checkEligibility(rank, category, gender)} disabled={eligibilityLoading}>
                            {eligibilityLoading ? "Checking Eligibility..." : "Get Results"}
                        </button>
                    )}
                    {eligibilityMessage && <p className="eligibility-message">{eligibilityMessage}</p>}
                </div>


                {isEligible && (
                    <>
                        <h1 className="ques">Which of these are important to you?</h1>
                        <div className="preferences-table">
                            <table>
                                <tbody>
                                    {Object.keys(preferences).map((key) => key !== "gender" && (
                                        <tr key={key}>
                                            <td>
                                                <span className="icon-label prefrence-icon-label">
                                                    <div className="prefrence-icon">{preferenceIcons[key]}</div>
                                                    <div className="prefrence-name">{preferenceLabels[key]}</div>
                                                </span>
                                            </td>

                                            <td>
                                                <label className={`yes-radio ${preferences[key] === true ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name={key}
                                                        value="yes"
                                                        checked={preferences[key] === true}
                                                        onChange={() => handleSelection(key, true)}
                                                    />
                                                    Yes
                                                </label>
                                            </td>
                                            <td>
                                                <label className={`no-radio ${preferences[key] === false ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name={key}
                                                        value="no"
                                                        checked={preferences[key] === false}
                                                        onChange={() => handleSelection(key, false)}
                                                    />
                                                    No
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="get-results-button" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Fetching..." : "Get Results"}
                        </button>
                    </>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>

            {showPopup && (
                <div className="confirmation-popup">
                    <div className="popup-content">
                        <p>Please note that preferences cannot be changed later.</p>
                        <p>Are you sure you want to submit your responses?</p>
                        <div className="popup-buttons">
                            <button className="confirm" onClick={handleConfirm}>Yes</button>
                            <button className="cancel" onClick={handleCancel}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questionaire;
