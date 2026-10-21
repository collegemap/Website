import React, { useEffect } from "react";

const RazorpayPayment = ({ amount, preferences, onSuccess }) => {

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        const token = localStorage.getItem("authToken");

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v1/payments/create_order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("RazorpayPayment: Error creating order:", data.message || 'Unknown error');
                return;
            }

            const options = {
                key: data.key,
                amount: data.amount,
                currency: "INR",
                name: "CollegeMap",
                description: "Pay to access advanced results",
                order_id: data.order_id,
                handler: async function (response) {
                    const token = localStorage.getItem("authToken");
                    try {
                        const verifyRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v1/payments/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            if (onSuccess) {
                                onSuccess();
                            }
                        } else {
                            console.error("RazorpayPayment: Payment verification failed:", verifyData.message);
                        }
                    } catch (error) {
                        console.error("RazorpayPayment: Error during payment verification:", error);
                    }
                },
                modal: {
                    ondismiss: function () {
                    }
                },
                theme: { color: "#3399cc" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("RazorpayPayment: Error initiating payment:", error);
        }
    };

    return (
        <button
            onClick={handlePayment}
            style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary3)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
        >
            Pay ₹{amount}
        </button>
    );
};

export default RazorpayPayment;