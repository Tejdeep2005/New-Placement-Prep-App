import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "@/App.css";

// Pages
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import QuizzesPage from "@/pages/QuizzesPage";
import QuizDetail from "@/pages/QuizDetail";
import ChallengesPage from "@/pages/ChallengesPage";
import ChallengeDetail from "@/pages/ChallengeDetail";
import MockInterviewPage from "@/pages/MockInterviewPage";
import LiveBattlePage from "@/pages/LiveBattlePage";
import FriendsPage from "@/pages/FriendsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import AdminDashboard from "@/pages/AdminDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    checkAuth();
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <LandingPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/quizzes" element={user ? <QuizzesPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/quiz/:id" element={user ? <QuizDetail user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/challenges" element={user ? <ChallengesPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/challenge/:id" element={user ? <ChallengeDetail user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/mock-interview" element={user ? <MockInterviewPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/live-battle" element={user ? <LiveBattlePage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/friends" element={user ? <FriendsPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/leaderboard" element={user ? <LeaderboardPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
