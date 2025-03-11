import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
  ArticleForm 
} from './components';

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
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/tributes" element={<TributeGallery />} />
          <Route path="/tribute/:slug" element={<TributeDetail />} />
          <Route path="/yourgift" element={<YourGift />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/supporting-givebackjojo" element={<SupportingGiveBackJojo />} />
          <Route path="/account-settings/*" element={<AccountSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/create-article" element={<ArticleForm />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
