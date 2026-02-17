import { useEffect, useState, Suspense, lazy } from 'react';
import './App.css';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer, CartDrawer, LoadingContainer } from './components';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getOrganizationSchema } from './utils/structuredData';
import { analytics, logEvent } from './firestore';
import { Toaster } from 'react-hot-toast';

// Route-level code splitting
const Home = lazy(() => import('./components/Home'));
const About = lazy(() => import('./components/About'));
const Hotlines = lazy(() => import('./components/Hotlines'));
const GetInvolved = lazy(() => import('./components/GetInvolved'));
const Events = lazy(() => import('./components/Events'));
const EventDetail = lazy(() => import('./components/EventDetail'));
const ArticleList = lazy(() => import('./components/ArticleList'));
const ArticleDetail = lazy(() => import('./components/ArticleDetail'));
const TributeGallery = lazy(() => import('./components/TributeGallery'));
const TributeDetail = lazy(() => import('./components/TributeDetail'));
const Donate = lazy(() => import('./components/Donate'));
const YourGift = lazy(() => import('./components/YourGift'));
const SupportingGiveBackJojo = lazy(() => import('./components/SupportingGiveBackJojo'));
const AccountSettings = lazy(() => import('./components/Navbar/AccountSettings'));
const Profile = lazy(() => import('./components/Navbar/Profile'));
const Notifications = lazy(() => import('./components/Navbar/Notifications'));
const Subscriptions = lazy(() => import('./components/Navbar/Subscriptions'));
const NotFound = lazy(() => import('./components/NotFound'));
const ArticleForm = lazy(() => import('./components/ArticleForm'));
const EditArticle = lazy(() => import('./components/EditArticle'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const ProductsPage = lazy(() => import('./components/ProductsPage'));
const CheckoutPage = lazy(() => import('./components/CheckOutPage'));
const SuccessPage = lazy(() => import('./components/SuccessPage'));
const DonationSuccess = lazy(() => import('./components/DonationSuccess'));
const AuthForm = lazy(() => import('./components/AuthForm'));
const EmailVerification = lazy(() => import('./components/EmailVerification'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const AdminOrders = lazy(() => import('./components/admin/AdminOrders'));

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
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.classList.remove('loading');
    }, 2000);
    document.body.classList.add('loading');
    return () => {
      clearTimeout(timer);
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

      <Suspense fallback={<LoadingContainer />}>
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
      </Suspense>

      <Footer />
      <CartDrawer />
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;