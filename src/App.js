import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar/Navbar';
import GetInvolved from './components/GetInvolved';
import About from './components/About';
import Hotlines from './components/Hotlines';
import Events from './components/Events';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import ArticleList from './components/ArticleList'
import ArticleDetail from './components/ArticleDetail';
import TributeGallery from "./components/TributeGallery";
import TributeDetail from "./components/TributeDetail";
import Donate from './components/Donate'
import YourGift from './components/YourGift';
import SupportingGiveBackJojo from './components/SupportingGiveBackJojo'
import AccountSettings from './components/Navbar/AccountSettings';
import Profile from './components/Navbar/Profile';
import Notifications from './components/Navbar/Notifications';
import Subscriptions from './components/Navbar/Subscriptions';

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          {/* Redirect / to /home */}
          <Route path="/" element={<Navigate to="/home" />} />
          
          {/* Define main routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/hotlines" element={<Hotlines />} />
          <Route path="/getinvolved" element={<GetInvolved />} />
          <Route path="/events" element={<Events />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/tributes" element={<TributeGallery />} />
          <Route path='/YourGift' element={<YourGift />} />
          <Route path="/tribute/:slug" element={<TributeDetail />} />
          <Route path='/Donate' element={<Donate />} />
          <Route path='/SupportingGiveBackJojo' element={<SupportingGiveBackJojo />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} /> 
          <Route path="/subscriptions" element={<Subscriptions />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
