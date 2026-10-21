import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const EnhancedRedirect = () => {
    const navigate = useNavigate();
    const { user, isPaid, checkPaymentStatus, isLoggedIn } = useAuth();
    const [checkedStatus, setCheckedStatus] = useState(false);

    useEffect(() => {
        if (isLoggedIn && isPaid === null) {
            checkPaymentStatus().then(() => setCheckedStatus(true));
        } else if (!isLoggedIn) {
            navigate("/MobileLogin", { state: { redirectTo: "/EnhancedRedirect" } });
        } else {
            setCheckedStatus(true);
        }
    }, [isLoggedIn, isPaid, checkPaymentStatus, navigate]);

    useEffect(() => {
        if (!checkedStatus) return;

        const preferences = JSON.parse(localStorage.getItem("preferences") || "{}");
        const selectedYesAnswers = Object.keys(preferences).filter(key => preferences[key] === true);

        if (true) {
            navigate("/EnhancedQuestions", {
                state: {
                    preferences: selectedYesAnswers
                }
            });
        } else {
            navigate("/ResultsPage", {
                state: {
                    triggerPayment: true,
                    preferences: selectedYesAnswers
                }
            });
        }
    }, [checkedStatus, isPaid, navigate]);

    return <p>Redirecting...</p>;
};

export default EnhancedRedirect;
