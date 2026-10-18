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
  Footer,
  NotFound,
  ProductPage,
  ProductsPage,
  PrivacyPolicy,
  TermsOfService,
  Contact,
  ZellePage,
} from './components';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getOrganizationSchema } from './utils/structuredData';
import StickyActionBar from './components/StickyActionBar';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Fade out the static splash from index.html once the app has rendered.
  // Wait briefly for the web fonts so text doesn't visibly swap, but never longer than 800ms.
  // (document.fonts.ready alone resolves immediately if no font request has started yet.)
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (!splash) return undefined;

    let removeTimer;
    const fontsReady = document.fonts
      ? Promise.all(['400 1em Roboto', '700 1em Roboto', '600 1em Montserrat']
        .map((font) => document.fonts.load(font))).catch(() => {})
      : Promise.resolve();
    const maxWait = new Promise((resolve) => setTimeout(resolve, 800));

    Promise.race([fontsReady, maxWait]).then(() => {
      splash.classList.add('splash-hide');
      removeTimer = setTimeout(() => splash.remove(), 450);
    });

    return () => clearTimeout(removeTimer);
  }, []);

  return (
    <div className="App">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getOrganizationSchema())}
        </script>
      </Helmet>
      <Navbar />
      <StickyActionBar />
      <ScrollToTop />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Accounts and user-submitted articles were removed; old links go home */}
          {['/auth', '/login', '/signup', '/email-verification', '/dashboard', '/profile',
            '/account-settings/*', '/notifications', '/subscriptions', '/admin/*',
            '/create-article', '/edit-article/:articleId'].map((path) => (
            <Route key={path} path={path} element={<Navigate to="/home" replace />} />
          ))}

          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<SlideUpRoute noPadding>{<Home />}</SlideUpRoute>} />
          <Route path="/about" element={<SlideUpRoute noPadding><About /></SlideUpRoute>} />
          <Route path="/hotlines" element={<SlideUpRoute><Hotlines /></SlideUpRoute>} />
          <Route path="/getinvolved" element={<SlideUpRoute noPadding><GetInvolved /></SlideUpRoute>} />
          <Route path="/events" element={<SlideUpRoute noPadding><Events /></SlideUpRoute>} />
          <Route path="/events/:id" element={<SlideUpRoute noPadding><EventDetail /></SlideUpRoute>} />
          <Route path="/articles" element={<SlideUpRoute noPadding><ArticleList /></SlideUpRoute>} />
          <Route path="/article/:id" element={<SlideUpRoute><ArticleDetail /></SlideUpRoute>} />
          <Route path="/tributes" element={<SlideUpRoute noPadding><TributeGallery /></SlideUpRoute>} />
          <Route path="/tribute/:slug" element={<SlideUpRoute noPadding><TributeDetail /></SlideUpRoute>} />
          <Route path="/yourgift" element={<SlideUpRoute noPadding><YourGift /></SlideUpRoute>} />
          <Route path="/donate" element={<SlideUpRoute noPadding><Donate /></SlideUpRoute>} />
          <Route path="/supporting-givebackjojo" element={<SlideUpRoute noPadding><SupportingGiveBackJojo /></SlideUpRoute>} />
          <Route path="/zelle" element={<SlideUpRoute noPadding><ZellePage /></SlideUpRoute>} />
          <Route path="/SupportingGiveBackJojo" element={<Navigate to="/supporting-givebackjojo" replace />} />
          <Route path="/products/:slug" element={<SlideUpRoute noPadding><ProductPage /></SlideUpRoute>} />
          <Route path="/products" element={<SlideUpRoute noPadding><ProductsPage /></SlideUpRoute>} />
          {/* Checkout and donations moved to Zeffy; keep old links landing somewhere useful */}
          <Route path="/checkout" element={<Navigate to="/products" replace />} />
          <Route path="/success" element={<Navigate to="/products" replace />} />
          <Route path="/donation-success" element={<Navigate to="/donate" replace />} />
          <Route path="/privacy" element={<SlideUpRoute noPadding><PrivacyPolicy /></SlideUpRoute>} />
          <Route path="/terms" element={<SlideUpRoute noPadding><TermsOfService /></SlideUpRoute>} />
          <Route path="/contact" element={<SlideUpRoute noPadding><Contact /></SlideUpRoute>} />
          <Route path="*" element={<SlideUpRoute noPadding><NotFound /></SlideUpRoute>} />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default App;