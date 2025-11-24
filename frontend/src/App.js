import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import PrivacyPolicy from './pages/privacy-policy';
import Tasks from './pages/tasks';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/about';
import WipTooltipListener from './components/WipTooltipListener';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Tasks />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
          </Routes>
          <AnimatePresence>
            <motion.p className="version" transition={{ delay: 0.7, duration: 0.5, type: "spring", stiffness: 200, damping: 30 }} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}>V2.0 beta</motion.p>
          </AnimatePresence>
          <div id="wip-tooltip">WIP</div>
          <WipTooltipListener />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
