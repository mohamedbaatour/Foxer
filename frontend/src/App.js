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
          <p className="version">V2.0 beta</p>
          <div id="wip-tooltip">WIP</div>
          <WipTooltipListener />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
