import { motion } from "framer-motion";
import "./SplashScreen.scss";
import bottomImage from "../../assets/logo/cm_bottom.png";
import topImage from "../../assets/logo/cm_top.png";

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="image-container">
                <motion.img
                    src={topImage}
                    alt="Bouncing"
                    className="top-image"
                    initial={{ y: -30 }}
                    animate={{ y: [-30, 0, -30] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.img
                    src={bottomImage}
                    alt="Static"
                    className="bottom-image"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
};

export default SplashScreen;
