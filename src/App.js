import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar/Navbar';
import GetInvolved from './components/GetInvolved';
import About from './components/About';
import Hotlines from './components/Hotlines';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

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
        </Routes>
      </Router>
    </div>
  );
}

export default App;
