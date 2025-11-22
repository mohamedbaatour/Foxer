import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import PrivacyPolicy from './pages/privacy-policy';
import Tasks from './pages/tasks';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Tasks />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
