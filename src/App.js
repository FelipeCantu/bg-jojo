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
  LoadingContainer,
  CartDrawer,
  ProductPage,
  ProductsPage,
  CheckoutPage,
  SuccessPage,
  DonationSuccess,
  AuthForm,
  EmailVerification,
  PrivacyPolicy,
} from './components';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminOrders from './components/admin/AdminOrders';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getOrganizationSchema } from './utils/structuredData';
import { analytics, logEvent } from './firestore';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname]);

  return null;
};

const SlideUpRoute = ({ children, disableAnimation = false, noPadding = false }) => {
  if (disableAnimation) {
    return <div className={`route-container ${noPadding ? 'no-padding' : ''}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`route-container ${noPadding ? 'no-padding' : ''}`}
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
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      document.body.classList.remove('loading');
    }, 2000);

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
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getOrganizationSchema())}
        </script>
      </Helmet>
      <Navbar />
      <ScrollToTop />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/email-verification" element={<SlideUpRoute noPadding><EmailVerification /></SlideUpRoute>} />
          <Route path='/dashboard' element={<Navigate to="/profile" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<SlideUpRoute noPadding>{<Home />}</SlideUpRoute>} />
          <Route path="/about" element={<SlideUpRoute noPadding><About /></SlideUpRoute>} />
          <Route path="/hotlines" element={<SlideUpRoute><Hotlines /></SlideUpRoute>} />
          <Route path="/getinvolved" element={<SlideUpRoute noPadding><GetInvolved /></SlideUpRoute>} />
          <Route path="/events" element={<SlideUpRoute noPadding><Events /></SlideUpRoute>} />
          <Route path="/events/:id" element={<SlideUpRoute><EventDetail /></SlideUpRoute>} />
          <Route path="/articles" element={<SlideUpRoute noPadding><ArticleList /></SlideUpRoute>} />
          <Route path="/article/:id" element={<SlideUpRoute><ArticleDetail /></SlideUpRoute>} />
          <Route path="/edit-article/:articleId" element={<ProtectedRoute><SlideUpRoute><EditArticle /></SlideUpRoute></ProtectedRoute>} />
          <Route path="/tributes" element={<SlideUpRoute noPadding><TributeGallery /></SlideUpRoute>} />
          <Route path="/tribute/:slug" element={<SlideUpRoute><TributeDetail /></SlideUpRoute>} />
          <Route path="/yourgift" element={<SlideUpRoute noPadding><YourGift /></SlideUpRoute>} />
          <Route path="/donate" element={<SlideUpRoute noPadding><Donate /></SlideUpRoute>} />
          <Route path="/supporting-givebackjojo" element={<SlideUpRoute><SupportingGiveBackJojo /></SlideUpRoute>} />
          <Route path="/SupportingGiveBackJojo" element={<Navigate to="/supporting-givebackjojo" replace />} />
          <Route path="/products/:slug" element={<SlideUpRoute noPadding><ProductPage /></SlideUpRoute>} />
          <Route path="/products" element={<SlideUpRoute noPadding><ProductsPage /></SlideUpRoute>} />
          <Route path="/checkout" element={<SlideUpRoute><CheckoutPage /></SlideUpRoute>} />
          <Route path="/success" element={<SlideUpRoute><SuccessPage /></SlideUpRoute>} />
          <Route path="/donation-success" element={<SlideUpRoute noPadding><DonationSuccess /></SlideUpRoute>} />
          <Route path="/privacy" element={<SlideUpRoute><PrivacyPolicy /></SlideUpRoute>} />
          <Route
            path="/account-settings/*"
            element={
              <ProtectedRoute>
                <SlideUpRoute disableAnimation noPadding>
                  <AccountSettings />
                </SlideUpRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <SlideUpRoute disableAnimation noPadding>
                  <Profile />
                </SlideUpRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <SlideUpRoute disableAnimation noPadding>
                  <Notifications />
                </SlideUpRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <SlideUpRoute disableAnimation noPadding>
                  <Subscriptions />
                </SlideUpRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <SlideUpRoute disableAnimation noPadding>
                  <AdminOrders />
                </SlideUpRoute>
              </AdminRoute>
            }
          />
          <Route path="/create-article" element={<ProtectedRoute><SlideUpRoute noPadding><ArticleForm /></SlideUpRoute></ProtectedRoute>} />
          <Route path="*" element={<SlideUpRoute><NotFound /></SlideUpRoute>} />
        </Routes>
      </AnimatePresence>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default App;