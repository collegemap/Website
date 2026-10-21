import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Header.scss";
import logo from "../../assets/logo/CM_logo_color_transp.png"

const Header = () => {
    const navigate = useNavigate();
    const { isLoggedIn, logout } = useAuth();
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="bg-eerie-black text-white py-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center px-6">
                <Link to="/" className="text-2xl font-bold text-turquoise"><img src={logo} alt="Logo" className="h-10" /></Link>

                <nav>
                    <ul className="flex space-x-6">
                        <li><Link to="/" className="hover:text-turquoise">Home</Link></li>
                        <li><Link to="/About-Us" className="hover:text-turquoise">About Us</Link></li>
                        {/* <li><Link to="/about" className="hover:text-turquoise">About</Link></li> */}
                        {/* <li><Link to="/contact" className="hover:text-turquoise">Contact</Link></li> */}
                    </ul>
                </nav>

                {isLoggedIn ? (
                    <button className="bg-red-500 px-4 py-2 rounded" onClick={handleLogout}>
                        Sign Out
                    </button>
                ) : (
                    <Link to="/login" className="bg-green-500 px-4 py-2 rounded">
                        Login
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Header;
