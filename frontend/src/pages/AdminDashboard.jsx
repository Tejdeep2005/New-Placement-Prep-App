import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Brain, Code, Plus, Trash2, BarChart } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [stats, setStats] = useState({});
  const [quizzes, setQuizzes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'algorithms',
    difficulty: 'medium',
    time_limit: 30,
    points: 100,
    questions: []
  });

  // Challenge form state
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    company: 'Google',
    difficulty: 'medium',
    points: 150,
    language_support: ['Python', 'JavaScript', 'Java'],
    test_cases: [],
    starter_code: { python: '# Start coding here', javascript: '// Start coding here' }
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'overview') {
        const statsRes = await axios.get(`${API}/admin/stats`, { headers });
        const usersRes = await axios.get(`${API}/admin/users`, { headers });
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } else if (activeTab === 'quizzes') {
        const response = await axios.get(`${API}/quizzes`, { headers });
        setQuizzes(response.data);
      } else if (activeTab === 'challenges') {
        const response = await axios.get(`${API}/challenges`, { headers });
        setChallenges(response.data);
      }

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load admin data');
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/quizzes`, quizForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quiz created successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to create quiz');
    }
  };

  const deleteQuiz = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quiz deleted');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const createChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/challenges`, challengeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Challenge created successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to create challenge');
    }
  };

  const deleteChallenge = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/challenges/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Challenge deleted');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="admin-dashboard">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard 🎛️</h1>
          <p className="text-gray-300">Manage all platform content and users</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto">
          {['overview', 'quizzes', 'challenges', 'users'].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className={activeTab === tab ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : ''}
              data-testid={`tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-effect p-6 border-teal-500/20">
              <Users className="w-10 h-10 text-teal-400 mb-4" />
              <p className="text-gray-400 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.total_users || 0}</p>
            </Card>
            <Card className="glass-effect p-6 border-teal-500/20">
              <Brain className="w-10 h-10 text-purple-400 mb-4" />
              <p className="text-gray-400 text-sm mb-1">Total Quizzes</p>
              <p className="text-3xl font-bold text-white">{stats.total_quizzes || 0}</p>
            </Card>
            <Card className="glass-effect p-6 border-teal-500/20">
              <Code className="w-10 h-10 text-blue-400 mb-4" />
              <p className="text-gray-400 text-sm mb-1">Total Challenges</p>
              <p className="text-3xl font-bold text-white">{stats.total_challenges || 0}</p>
            </Card>
            <Card className="glass-effect p-6 border-teal-500/20">
              <BarChart className="w-10 h-10 text-green-400 mb-4" />
              <p className="text-gray-400 text-sm mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-white">
                {(stats.total_quiz_attempts || 0) + (stats.total_challenge_attempts || 0)}
              </p>
            </Card>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500" data-testid="create-quiz-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-gray-900 border-teal-500/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Quiz</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    <Input
                      placeholder="Quiz Title"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Textarea
                      placeholder="Description"
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Select value={quizForm.category} onValueChange={(v) => setQuizForm({ ...quizForm, category: v })}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="algorithms">Algorithms</SelectItem>
                        <SelectItem value="data-structures">Data Structures</SelectItem>
                        <SelectItem value="system-design">System Design</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Time Limit (minutes)"
                      value={quizForm.time_limit}
                      onChange={(e) => setQuizForm({ ...quizForm, time_limit: parseInt(e.target.value) })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Button onClick={createQuiz} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500">
                      Create Quiz
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="glass-effect p-6 border-teal-500/20" data-testid={`quiz-item-${quiz.id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{quiz.questions?.length || 0} questions</span>
                    <Button
                      onClick={() => deleteQuiz(quiz.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      data-testid="delete-quiz-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500" data-testid="create-challenge-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-gray-900 border-teal-500/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Challenge</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    <Input
                      placeholder="Challenge Title"
                      value={challengeForm.title}
                      onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Textarea
                      placeholder="Description"
                      value={challengeForm.description}
                      onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Input
                      placeholder="Company"
                      value={challengeForm.company}
                      onChange={(e) => setChallengeForm({ ...challengeForm, company: e.target.value })}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Button onClick={createChallenge} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500">
                      Create Challenge
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="glass-effect p-6 border-teal-500/20" data-testid={`challenge-item-${challenge.id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2">{challenge.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{challenge.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-teal-400">{challenge.company}</span>
                    <Button
                      onClick={() => deleteChallenge(challenge.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      data-testid="delete-challenge-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="glass-effect border-teal-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Points</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-800/50" data-testid={`user-row-${u.id}`}>
                      <td className="px-6 py-4 text-white">{u.name}</td>
                      <td className="px-6 py-4 text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-teal-500/10 text-teal-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{u.points || 0}</td>
                      <td className="px-6 py-4 text-white">{u.level || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
