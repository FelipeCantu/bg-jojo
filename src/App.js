import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar/Navbar';
import GetInvolved from './components/GetInvolved';
import About from './components/About';
import Hotlines from './components/Hotlines';
import Events from './components/Events';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Footer from './components/Footer';
import NotFound from './components/NotFound'; // Add this component
import Articles from './components/Articles'
import Remembering from './components/Remembering'

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/Home" />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/Hotlines" element={<Hotlines />} />
          <Route path="/GetInvolved" element={<GetInvolved />} />
          <Route path="/Events" element={<Events />} />
          <Route path="/Articles" element={<Articles />} />
          <Route path="/Remembering" element={<Remembering />} />
          {/* Add a fallback route for undefined paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
