import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// import SplashScreen from "./components/SplashScreen/SplashScreen";
import Layout from "./components/Layout/Layout";
import LandingPage from "./pages/LandingPage/LandingPage";
import Questionaire from "./pages/Questionaire/Questionaire";
import ResultsPage from "./pages/ResultsPage/ResultsPage";
import MobileLogin from "./pages/MobileLogin/MobileLogin";
import EnhancedQuestions from "./pages/EnhancedQuestions/EnhancedQuestions";
import AboutUs from "./pages/AboutUs/AboutUs";
import AboutIITs from "./pages/AboutIITs/AboutIITs";
import BranchComparison from "./pages/BranchComparison/BranchComparison";
import CollegePredictor from "./pages/CollegePredictor/CollegePredictor";
import CollegePredictorResults from "./pages/CollegePredictor/CollegePredictorResults";
import ContactUs from "./pages/ContactUs/ContactUs";
import HowItWorks from "./pages/HowItWorks/HowItWorks";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import Team from "./components/Team/Team";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy/CancellationRefundPolicy";
import TermsAndConditions from "./pages/TermsAndConditions/TermsAndConditions";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import ProtectedRoute from "./Routes/ProtectedRoute";
import ComingSoon from "./pages/ComingSoon/ComingSoon";
import SeminarPage from "./pages/SeminarPage/SeminarPage";
import ResourcesPage from "./pages/ResourcesPage/ResourcesPage";
import NewsPage from "./pages/NewsPage/NewsPage";
import CBTPortal from "./pages/CBTPortal/CBTPortal";
import TestInterface from "./pages/CBTPortal/TestInterface";
import CustomTestBuilder from "./pages/CBTPortal/CustomTestBuilder";
import CBTDashboard from "./pages/CBTPortal/CBTDashboard";
import HomePage from "./pages/Home/HomePage";
import PYQPage from "./pages/PYQPage/PYQPage";
import PYQAdvancedPage from "./pages/PYQAdvancedPage/PYQAdvancedPage";
import EnergyBatch from "./pages/EnergyBatch/EnergyBatch";
import TalkToIITian from "./pages/TalkToIITian/TalkToIITian";
import Home2 from "./pages/Home_2/Home2";
import Login2 from "./pages/Login_2/login2";
import UserTypeModal from "./components/UserTypeModal/UserTypeModal";
import StudyWithIITian from "./pages/StudyWithIITians/StudyWithIITians";
import CollegePredictortool from './pages/CollegePredictor/CollegePredictortool';
import BranchComparisonIntro from './pages/BranchComparison/BranchComparisonIntro';
// Lazy-loaded: pulls in josaaCutoffs.json (1.3 MB) only when user visits /colleges/...
const CollegeCutoffPage = lazy(() => import('./pages/CollegeCutoffPage/CollegeCutoffPage'));

// Blog pages — lazy-loaded so the markdown renderer isn't in the main bundle
const BlogList = lazy(() => import('./pages/Blog/BlogList'));
const BlogPost = lazy(() => import('./pages/Blog/BlogPost'));

// Smart home that switches between JEE home (HomePage) and College home (Home2)
// based on the cached userType preference — same URL for both.
function SmartHome() {
  const [userType, setUserType] = useState(
    () => localStorage.getItem('userType') || 'jee'
  );

  useEffect(() => {
    const handler = () => {
      setUserType(localStorage.getItem('userType') || 'jee');
    };
    window.addEventListener('userTypeChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('userTypeChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return (
    <>
      <UserTypeModal />
      {userType === 'college' ? <Home2 /> : <HomePage />}
    </>
  );
}


function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/blog")) {
      return;
    }

    if (typeof window.gtag !== "function") {
      return;
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("authToken");
      setIsLoggedIn(!!token);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // if (showSplash) {
  //   return <SplashScreen />;
  // }

  return (
    <Router>
      <ScrollToTop />
      <RouteAnalyticsTracker />
      <Layout isLoggedIn={isLoggedIn}>
        <Routes>
          {/* /home now redirects to / — SmartHome picks the right page from cache */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/lp" element={<LandingPage />} />
          <Route path="/" element={<SmartHome />} />
          <Route path="/Questionaire" element={<Questionaire />} />
          {/* <Route path="/ResultsPage" element={<ResultsPage />} /> */}
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/MobileLogin" element={<MobileLogin />} />
          <Route path="/login" element={<Login2 />} />
          {/* Correct placement of ProtectedRoute */}
          {/* <Route path="/EnhancedQuestions" element={<ProtectedRoute requirePayment={false}><EnhancedQuestions /></ProtectedRoute>} /> */}
          <Route path="/EnhancedQuestions" element={<ProtectedRoute requirePayment={false}><EnhancedQuestions /></ProtectedRoute>} />

          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/College" element={<AboutIITs />} />
          {/* <Route path="/Contact-Us" element={<ContactUs />} /> */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/HowItWorks" element={<HowItWorks />} />
          <Route path="/Privacy-Policy" element={<PrivacyPolicy />} />
          {/* <Route path="/Our-Team" element={<Team />} /> */}
          <Route path="/team" element={<Team />} />
          {/* <Route path="/Cancellation-and-Refund" element={<CancellationRefundPolicy />} /> */}
          <Route path="/refund" element={<CancellationRefundPolicy />} />
          <Route path="/Terms-and-Conditions" element={<TermsAndConditions />} />
          <Route path="/ComingSoon" element={<ComingSoon />} />
          <Route path="/seminar" element={<SeminarPage />} />
          <Route path="/Resources" element={<ResourcesPage />} />
          <Route path="/resource" element={<ResourcesPage />} />
          <Route path="/Resources/:resourceType" element={<ResourcesPage />} />
          <Route path="/pyq" element={<PYQPage />} />
          {/* <Route path="/pyq-advanced" element={<PYQAdvancedPage />} /> */}
          <Route path="/news" element={<NewsPage />} />
          {/* <Route path="/BranchComparision" element={<BranchComparison />} /> */}
          <Route path="/CollegePredictor" element={<CollegePredictor />} />
          <Route path="/CollegePredictor/results" element={<CollegePredictorResults />} />
          <Route path="/EnergyBatch" element={<EnergyBatch />} />
          <Route path="/StudyWithIITians" element={<StudyWithIITian/>} />
          <Route path="/TalkToIITians" element={<TalkToIITian />} />
          {/* <Route path="/cbt-portal" element={<CBTPortal />} /> */}
          <Route path="/exams" element={<CBTPortal />} />
          {/* <Route path="/cbt-portal/custom-test" element={<CustomTestBuilder />} /> */}
          <Route path="/exams/custom" element={<CustomTestBuilder />} />
          <Route path="/exams/test/:testId" element={<TestInterface />} />
          <Route path="/exams/dashboard" element={<CBTDashboard />} />
          <Route path="/CollegePredictor/tool" element={<CollegePredictortool />} />
          <Route path="/BranchComparision" element={<BranchComparisonIntro />} />
          <Route path="/BranchComparision/tool" element={<BranchComparison />} />
          {/* Programmatic SEO: one template → 571 indexed pages. Lazy-loaded so
              the 1.3MB josaaCutoffs.json is NEVER in the main bundle. */}
          <Route
            path="/colleges/:institute/:branch/cutoff"
            element={
              <Suspense fallback={null}>
                <CollegeCutoffPage />
              </Suspense>
            }
          />
          {/* Blog */}
          <Route path="/blog" element={<Suspense fallback={null}><BlogList /></Suspense>} />
          <Route path="/blog/:slug" element={<Suspense fallback={null}><BlogPost /></Suspense>} />
          {/* Add other routes as needed */}
        </Routes>
      </Layout>

    </Router>
  );
}

export default App;