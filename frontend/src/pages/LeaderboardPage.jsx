import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Crown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaderboardPage = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load leaderboard');
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="leaderboard-page">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">Global Leaderboard 🏆</h1>
          <p className="text-gray-300">Top performers worldwide</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="glass-effect p-12 border-teal-500/20 text-center">
            <p className="text-gray-400">No data available yet.</p>
          </Card>
        ) : (
          <Card className="glass-effect border-teal-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Points</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                        entry.id === user?.id ? 'bg-teal-500/10' : ''
                      }`}
                      data-testid={`leaderboard-entry-${idx}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {entry.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{entry.name}</p>
                            <p className="text-sm text-gray-400">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-white font-bold">{entry.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-sm font-semibold">
                          Level {entry.level}
                        </span>
                      </td>
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

export default LeaderboardPage;
