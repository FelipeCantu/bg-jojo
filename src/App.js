import { useEffect, useState } from 'react';
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
  EditArticle,
  // ProductPage,
  // ProductsPage,
  LoadingContainer,
  // CartDrawer,
  // CheckoutPage,
} from './components';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

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
        minHeight: 'calc(100vh - 120px)'
      }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (replace with actual asset loading if needed)
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      document.body.classList.remove('loading');
    }, 2000);

    // Add loading class to body immediately
    document.body.classList.add('loading');

    return () => {
      clearTimeout(loadingTimer);
      document.body.classList.remove('loading');
    };
  }, []);

  if (isLoading) {
    return <LoadingContainer />;
  }

  return (
    <div className="App">
      <Navbar />
      <ScrollToTop />
      
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/home" replace />} />
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
          {/* <Route path="/products/:slug" element={<SlideUpRoute><ProductPage /></SlideUpRoute>} />
          <Route path="/products" element={<SlideUpRoute><ProductsPage /></SlideUpRoute>} />
          <Route path="/checkout" element={<SlideUpRoute><CheckoutPage /></SlideUpRoute>} /> */}
          {/* <Route path="/success" element={<SlideUpRoute><SuccessPage /></SlideUpRoute>} /> */}

          <Route path="*" element={<SlideUpRoute><NotFound /></SlideUpRoute>} />
        </Routes>
      </AnimatePresence>

      <Footer />
      {/* <CartDrawer /> */}
    </div>
  );
}

export default App;