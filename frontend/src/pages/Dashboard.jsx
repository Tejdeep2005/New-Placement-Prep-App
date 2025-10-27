import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Code, Trophy, Users, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ quizzes: 0, challenges: 0, interviews: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch user's recent activity (this is a simplified version)
      setStats({
        quizzes: 12,
        challenges: 8,
        interviews: 3
      });
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Take Quiz', desc: 'Test your knowledge', icon: Brain, path: '/quizzes', color: 'from-purple-500 to-pink-500' },
    { title: 'Code Challenge', desc: 'Solve problems', icon: Code, path: '/challenges', color: 'from-blue-500 to-cyan-500' },
    { title: 'Mock Interview', desc: 'Practice with AI', icon: Brain, path: '/mock-interview', color: 'from-green-500 to-teal-500' },
    { title: 'Live Battle', desc: 'Compete live', icon: Trophy, path: '/live-battle', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="student-dashboard">
        {/* Welcome Section */}
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="welcome-message">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-300">Ready to level up your skills today?</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-400">{user?.level || 1}</div>
                <div className="text-sm text-gray-400">Level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{user?.points || 0}</div>
                <div className="text-sm text-gray-400">Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect p-6 border-teal-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Quizzes Completed</p>
                <p className="text-3xl font-bold text-white">{stats.quizzes}</p>
              </div>
              <Brain className="w-12 h-12 text-purple-400" />
            </div>
          </Card>
          
          <Card className="glass-effect p-6 border-teal-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Challenges Solved</p>
                <p className="text-3xl font-bold text-white">{stats.challenges}</p>
              </div>
              <Code className="w-12 h-12 text-blue-400" />
            </div>
          </Card>
          
          <Card className="glass-effect p-6 border-teal-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Mock Interviews</p>
                <p className="text-3xl font-bold text-white">{stats.interviews}</p>
              </div>
              <Target className="w-12 h-12 text-green-400" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, idx) => (
              <Card
                key={idx}
                className="glass-effect border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer group"
                onClick={() => navigate(action.path)}
                data-testid={`quick-action-${action.title.toLowerCase().replace(' ', '-')}`}
              >
                <div className="p-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Badges Section */}
        <Card className="glass-effect p-8 border-teal-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Badges</h2>
          {user?.badges && user.badges.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {user.badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <Award className="w-12 h-12 text-yellow-400 mb-2" />
                  <span className="text-sm text-gray-300">{badge}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Complete challenges to earn badges!</p>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
