import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from '../../api';
import "./EnhancedQuestions.scss";
import * as XLSX from 'xlsx';
import RazorPayment from "../../components/RazorpayPayment/RazorpayPayment";

const EnhancedQuestions = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedYesAnswers, setSelectedYesAnswers] = useState([]);
    const [comparisons, setComparisons] = useState([]);
    const [institutes, setInstitutes] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isDownloadReady, setIsDownloadReady] = useState(false);
    const [courseDuration, setCourseDuration] = useState([]);
    const [consistencyScore, setConsistencyScore] = useState(null);
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const [showConsistencyPopup, setShowConsistencyPopup] = useState(false);
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);


    const institutesDropdownRef = useRef(null);
    const courseDropdownRef = useRef(null);


    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const preferenceDisplayNames = {
        placement_score: "Placements",
        higher_studies_score: "Higher Studies",
        academics_experience_score: "Academic Experience",
        campus_score: "Campus Experience",
        entrepreneurship_score: "Entrepreneurship Culture"
    };

    const [enhancedResultData, setEnhancedResultData] = useState(null);

    const importanceLevels = [
        { label: "Extremely more", value: 9 },
        { label: "Very strongly more", value: 7 },
        { label: "Strongly more", value: 5 },
        { label: "Moderately more", value: 3 },
        { label: "Equally", value: 1 },
        { label: "Moderately less", value: 1 / 3 },
        { label: "Strongly less", value: 1 / 5 },
        { label: "Very strongly less", value: 1 / 7 },
        { label: "Extremely less", value: 1 / 9 },
    ];

    useEffect(() => {
        let receivedPreferences = location.state?.preferences;

        if (!receivedPreferences || receivedPreferences.length === 0) {
            console.warn("No preferences received from navigation. Falling back to local storage.");
            const storedPreferences = JSON.parse(localStorage.getItem("preferences") || "{}");
            receivedPreferences = Object.keys(storedPreferences).filter(key => storedPreferences[key] === true);
        }

        setSelectedYesAnswers(receivedPreferences);

        if (receivedPreferences.length > 1) {
            const generatedComparisons = [];
            for (let i = 0; i < receivedPreferences.length - 1; i++) {
                for (let j = i + 1; j < receivedPreferences.length; j++) {
                    generatedComparisons.push({
                        preference1: receivedPreferences[i],
                        preference2: receivedPreferences[j],
                        comparison: "",
                    });
                }
            }
            setComparisons(generatedComparisons);
        }

        const storedInstitutes = JSON.parse(localStorage.getItem("institutes"));

        if (Array.isArray(storedInstitutes) && storedInstitutes.length > 0) {
            const institutesWithSelection = storedInstitutes.map(inst => ({
                ...inst,
                selected: true
            }));
            setInstitutes([{ institute_name: 'Select All', institute_id: 'all' }, ...institutesWithSelection]);
        } else {
            console.warn("No institutes in localStorage.");
            setInstitutes([{ institute_name: 'Select All', institute_id: 'all' }]);
        }

        setCourseDuration(['4', '5']);

    }, [location, navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (institutesDropdownRef.current && !institutesDropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
                setCourseDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleComparisonChange = (index, value) => {
        const updatedComparisons = [...comparisons];
        updatedComparisons[index].comparison = value;
        setComparisons(updatedComparisons);
    };

    const handleInstituteSelect = (instituteId) => {
        setInstitutes(prevInstitutes => {
            if (instituteId === 'all') {
                const allSelected = prevInstitutes.slice(1).every(inst => inst.selected);
                return prevInstitutes.map(inst => ({ ...inst, selected: !allSelected }));
            } else {
                return prevInstitutes.map(inst =>
                    inst.institute_id === instituteId ? { ...inst, selected: !inst.selected } : inst
                );
            }
        });
    };

    const handleCourseDurationSelect = (duration) => {
        setCourseDuration(prev => {
            if (prev.includes(duration)) {
                return prev.filter(val => val !== duration);
            } else {
                return [...prev, duration];
            }
        });
    };

    const handleSubmitButtonClick = () => {
        if (comparisons.some(comp => comp.comparison === "")) {
            alert("Please fill out all comparisons before proceeding.");
            return;
        }
        if (courseDuration.length === 0) {
            alert("Please select course duration before proceeding.");
            return;
        }
        if (institutes.filter(inst => inst.selected && inst.institute_id !== 'all').length === 0) {
            alert("Please select at least one institute.");
            return;
        }
        performConsistencyCheck();
    };

    const performConsistencyCheck = async () => {
        const requestData = comparisons.map(comparison => {
            const comparisonKey = `${comparison.preference1}-${comparison.preference2}`;
            const comparisonValue = importanceLevels.find(level => level.label === comparison.comparison)?.value;

            return {
                comparisonKey,
                comparisonValue,
            };
        });

        function safeParse(key) {
            const raw = localStorage.getItem(key);
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
        }

        const rank = safeParse("rank");
        const category = safeParse("category");
        const gender = safeParse("gender");

        const instituteIds = institutes.filter(inst => inst.selected && inst.institute_id !== 'all').map(inst => inst.institute_id);

        const finalData = {
            comparisons: requestData,
            rank,
            category,
            gender,
            preferred_institute_ids: instituteIds,
            course_duration: courseDuration,
        };
        try {
            const consistencyResponse = await api.post('/api/v1/institutes/check_consistancy', { comparisons: requestData });


            if (consistencyResponse && consistencyResponse.data && typeof consistencyResponse.data === 'object') {
                const consistency = consistencyResponse.data.consistency_score;
                if (consistency != null) {
                    setConsistencyScore(consistency);
                    setShowConsistencyPopup(true);
                    setEnhancedResultData(finalData);
                } else {
                    console.error("Consistency score is missing in the JSON response.");
                    alert("Error: Consistency score is missing from the server response.");
                }
            } else {
                console.error("Invalid JSON response received:", consistencyResponse?.data);
                alert("Error: Received an invalid response from the server.");
            }

        } catch (error) {
            console.error("Error during consistency check:", error);
            if (error.response && error.response.data) {
                console.error("Response data:", error.response.data);
                if (typeof error.response.data === 'string' && error.response.headers['content-type']?.includes('application/json')) {
                    try {
                        const errorDetails = JSON.parse(error.response.data);
                        alert(`Something went wrong: ${errorDetails.message || 'Please try again.'}`);
                    } catch (parseError) {
                        alert("Something went wrong! Please try again.");
                    }
                } else {
                    alert("Something went wrong! Please try again.");
                }
            } else {
                alert("Network error occurred. Please check your connection.");
            }
        }
    };

    const handleConsistencyConfirm = async () => {
        setShowConsistencyPopup(false);
        generateResult();
    };

    const generateResult = async () => {
        const authToken = localStorage.getItem("authToken");

        if (!authToken) {
            alert("Authentication token not found. Please log in again.");
            navigate("/login");
            return;
        }
        try {
            const resultResponse = await api.post('/api/v1/institutes/enhanced_result', enhancedResultData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            setEnhancedResultData(resultResponse.data);
            setIsDownloadReady(true);
            setShowPaymentGateway(false);
            setShowDownloadButton(true);
        } catch (error) {
            console.error("Error fetching enhanced result:", error);
            if (error.response && error.response.status === 403) {
                setShowPaymentGateway(true);
                setIsDownloadReady(false);
                setShowDownloadButton(false);
            } else {
                alert("Failed to generate result. Please try again.");
                setShowPaymentGateway(false);
                setIsDownloadReady(false);
                setShowDownloadButton(false);
            }
        }
    };

    const handleDownloadPDF = async () => {
        try {
            if (enhancedResultData && Array.isArray(enhancedResultData.institutes)) {
                const worksheetData = enhancedResultData.institutes.map(inst => ({
                    Institute: inst.name,
                    Department: inst.department_name
                }));

                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Institutes");

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Advanced_result.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();

            } else {
                console.error("No Advanced result data available or invalid format.");
                alert("No data to download or data is not in the expected format.");
            }
        } catch (error) {
            console.error("Error downloading Excel file:", error);
            alert("Failed to download Excel. Something's fishy. 🐟");
        }
    };


    const onPaymentSuccess = async () => {
        setShowPaymentGateway(false);
        generateResult();
    };

    return (
        <>
            {showConsistencyPopup && (
                <div className="confirmation-popup">
                    <div className="popup-content">
                        <h2>Consistency Check</h2>
                        <p>Your consistency score is <strong>{consistencyScore}/100</strong>.</p>
                        <p>Are you sure you want to continue? You won’t be able to modify responses later.</p>
                        <div className="popup-buttons">
                            <button className="confirm" onClick={handleConsistencyConfirm}>Yes, Continue</button>
                            <button className="cancel" onClick={() => {
                                setShowConsistencyPopup(false);
                                setIsDownloadReady(false);
                                setShowDownloadButton(false);
                            }}>No, Go Back</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="enhanced-container">
                <div className="enhanced-questions-table">
                    {selectedYesAnswers.length === 0 ? (
                        <p>No preferences were selected in the previous step.</p>
                    ) : comparisons.length > 0 ? (
                        <>
                            <h1 className="title">Select what is important to you:</h1>
                            <table className="comparison-table">
                                <tbody className="compare-table-body">
                                    {comparisons.map((comparison, index) => (
                                        <tr key={index} className="table-row-compare">
                                            <td className="comparison-text">
                                                {preferenceDisplayNames[comparison.preference1] || comparison.preference1}
                                            </td>
                                            <td>
                                                <div className="drop-compare">
                                                    <span>are</span>
                                                    <select
                                                        className="comparison-dropdown"
                                                        value={comparison.comparison}
                                                        onChange={(e) => handleComparisonChange(index, e.target.value)}
                                                    >
                                                        <option value="">Select</option>
                                                        {importanceLevels.map((level, i) => (
                                                            <option key={i} value={level.label}>
                                                                {level.label} important
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span>than</span>
                                                </div>
                                            </td>
                                            <td className="comparison-text">
                                                {preferenceDisplayNames[comparison.preference2] || comparison.preference2}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>

                    ) : (
                        <p>Not enough preferences selected to generate comparisons. But you can select your prefered institutes and course duration.</p>
                    )}

                    <div className="institutes-selection">
                        <h2 className="title">Select Institutes</h2>
                        <div className="dropdown-wrapper" ref={institutesDropdownRef}>
                            <div className="dropdown-display" onClick={() => {
                                setDropdownOpen(prev => !prev);
                                setCourseDropdownOpen(false);
                            }}>
                                <div className="dropdown_text">{(() => {
                                    const selected = institutes.filter(i => i.selected && i.institute_id !== 'all').map(i => i.institute_name);
                                    return selected.length === 0
                                        ? "Select Institutes"
                                        : selected.slice(0, 2).join(", ") + (selected.length > 2 ? ", ..." : "");
                                })()}</div>
                                <span className="arrow">{dropdownOpen ? "▲" : "▼"}</span>
                            </div>

                            {dropdownOpen && (
                                <div className="dropdown-list">
                                    {institutes.map(inst => (
                                        <label key={inst.institute_id ?? `unknown-${inst.institute_name}`} className="dropdown-option">
                                            <input
                                                type="checkbox"
                                                checked={inst.selected}
                                                onChange={() => handleInstituteSelect(inst.institute_id)}
                                            />
                                            {inst.institute_name}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="duration-selection">
                        <h2 className="title">Select Course Duration</h2>
                        <div className="dropdown-wrapper" ref={courseDropdownRef}>
                            <div className="dropdown-display" onClick={() => {
                                setCourseDropdownOpen(prev => !prev);
                                setDropdownOpen(false);
                            }}
                            >
                                <div className="dropdown_text">
                                    {courseDuration.length === 0
                                        ? "Select Course Duration"
                                        : courseDuration.map(val => `${val}-Year Course`).join(", ")
                                    }
                                </div>
                                <span className="arrow">{courseDropdownOpen ? "▲" : "▼"}</span>
                            </div>

                            {courseDropdownOpen && (
                                <div className="dropdown-list">
                                    {[{ label: "4-Year Course", value: "4" }, { label: "5-Year Course", value: "5" }].map((item) => (
                                        <label key={item.value} className="dropdown-option">
                                            <input
                                                type="checkbox"
                                                checked={courseDuration.includes(item.value)}
                                                onChange={() => handleCourseDurationSelect(item.value)}
                                            />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit button: Always visible */}
                    {!showPaymentGateway && !showDownloadButton && (
                        <button className="submit-button" onClick={handleSubmitButtonClick}>
                            Submit
                        </button>
                    )}

                    {/* Payment Gateway: Show only if 403 is received */}
                    {showPaymentGateway && (
                        <div className="payment-gateway-section">
                            <p>Please complete the payment to proceed with generating your advanced results.</p>
                            <RazorPayment
                                amount={59}
                                onSuccess={onPaymentSuccess}
                                className="payment_button"
                            />
                            <button className="cancel-payment" onClick={() => setShowPaymentGateway(false)}>
                                Cancel Payment
                            </button>
                        </div>
                    )}

                    {/* Download button: Show only if download is ready (after successful API call or payment) */}
                    {isDownloadReady && showDownloadButton && (
                        <button className="download-button" onClick={handleDownloadPDF}>
                            Download Result
                        </button>
                    )}

                    {/* Message for already paid users: This logic is now handled by directly showing the download button */}
                    {/* {isPaid && enhancedResultData && (
                        <p className="download-message">
                            You have already paid and can download your result.
                        </p>
                    )} */}
                </div>
            </div>
        </>
    );
};

export default EnhancedQuestions;