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
import { useState, useEffect } from 'react';
import { ReactComponent as Fire } from './icons/fire.svg';

function App() {


  const formatDate = () => {
    const d = new Date()
    return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  }

  const InfoTime = () => {
    const [time, setTime] = useState(formatDate())

    useEffect(() => {
      const update = () => setTime(formatDate())

      update() // sync immediately
      const id = setInterval(update, 60_000)

      return () => clearInterval(id)
    }, [])

    return time
  }


  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Tasks />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
          </Routes>
                      <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="current-time"
            >
              {InfoTime()}

            </motion.p>
          <div id="wip-tooltip">WIP</div>
          <WipTooltipListener />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
