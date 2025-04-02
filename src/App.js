import { useEffect } from 'react';
import './App.css';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import {
  Home,
  Navbar,
  GetInvolved,
  About,
  Hotlines,
  Events,
  EventDetail,
  ArticleList,
  ArticleDetail,
  TributeGallery,
  TributeDetail,
  Donate,
  YourGift,
  SupportingGiveBackJojo,
  AccountSettings,
  Profile,
  Notifications,
  Subscriptions,
  Footer,
  NotFound,
  ArticleForm,
  EditArticle
} from './components';
import { motion, AnimatePresence } from 'framer-motion';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Enhanced animation wrapper with smooth slide-up effect
const SlideUpRoute = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          type: 'spring',
          damping: 20,
          stiffness: 100,
          mass: 0.5
        }
      }}
      exit={{ 
        opacity: 0, 
        y: 100,
        transition: {
          duration: 0.3,
          ease: 'easeInOut'
        }
      }}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100vh - 120px)' // Adjust based on header/footer height
      }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();

  return (
    <div className="App">
      <Navbar />
      <ScrollToTop />
      
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Redirect / to /home */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Main routes with enhanced slide-up animation */}
          <Route path="/home" element={<SlideUpRoute><Home /></SlideUpRoute>} />
          <Route path="/about" element={<SlideUpRoute><About /></SlideUpRoute>} />
          <Route path="/hotlines" element={<SlideUpRoute><Hotlines /></SlideUpRoute>} />
          <Route path="/getinvolved" element={<SlideUpRoute><GetInvolved /></SlideUpRoute>} />
          <Route path="/events" element={<SlideUpRoute><Events /></SlideUpRoute>} />
          <Route path="/events/:id" element={<SlideUpRoute><EventDetail /></SlideUpRoute>} />
          <Route path="/articles" element={<SlideUpRoute><ArticleList /></SlideUpRoute>} />
          <Route path="/article/:id" element={<SlideUpRoute><ArticleDetail /></SlideUpRoute>} />
          <Route path="/edit-article/:articleId" element={<SlideUpRoute><EditArticle /></SlideUpRoute>} />
          <Route path="/tributes" element={<SlideUpRoute><TributeGallery /></SlideUpRoute>} />
          <Route path="/tribute/:slug" element={<SlideUpRoute><TributeDetail /></SlideUpRoute>} />
          <Route path="/yourgift" element={<SlideUpRoute><YourGift /></SlideUpRoute>} />
          <Route path="/donate" element={<SlideUpRoute><Donate /></SlideUpRoute>} />
          <Route path="/SupportingGiveBackJojo" element={<SlideUpRoute><SupportingGiveBackJojo /></SlideUpRoute>} />
          <Route path="/account-settings/*" element={<SlideUpRoute><AccountSettings /></SlideUpRoute>} />
          <Route path="/profile" element={<SlideUpRoute><Profile /></SlideUpRoute>} />
          <Route path="/notifications" element={<SlideUpRoute><Notifications /></SlideUpRoute>} />
          <Route path="/subscriptions" element={<SlideUpRoute><Subscriptions /></SlideUpRoute>} />
          <Route path="/create-article" element={<SlideUpRoute><ArticleForm /></SlideUpRoute>} />

          {/* 404 route */}
          <Route path="*" element={<SlideUpRoute><NotFound /></SlideUpRoute>} />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  );
}


export default App;