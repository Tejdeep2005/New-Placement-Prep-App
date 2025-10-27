import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Code, Users, Play } from 'lucide-react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LiveBattlePage = ({ user, onLogout, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [battles, setBattles] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [code, setCode] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBattles();
  }, []);

  const fetchBattles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/battles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBattles(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load battles');
      setLoading(false);
    }
  };

  const createBattle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/battles/create?challenge_id=sample-challenge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Battle created!');
      fetchBattles();
    } catch (error) {
      toast.error('Failed to create battle');
    }
  };

  const joinBattle = async (battleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/battles/${battleId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const ws = io(BACKEND_URL.replace('/api', ''));
      ws.emit('join_battle', battleId);
      setSocket(ws);
      setActiveBattle(battleId);
      
      toast.success('Joined battle!');
    } catch (error) {
      toast.error('Failed to join battle');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="live-battle-page">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">Live Coding Battles ⚡</h1>
          <p className="text-gray-300">Compete in real-time with other coders!</p>
        </div>

        {activeBattle ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-effect p-6 border-teal-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Problem Statement</h3>
              <p className="text-gray-300 mb-4">Solve the coding challenge faster than your opponent!</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 rounded">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-400">2 Players</span>
                </div>
              </div>
            </Card>

            <Card className="glass-effect p-6 border-teal-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Code Editor</h3>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm bg-gray-900 border-gray-700 min-h-[400px]"
                placeholder="// Start coding..."
              />
              <Button className="w-full mt-4 bg-gradient-to-r from-teal-500 to-cyan-500">
                <Play className="w-4 h-4 mr-2" />
                Submit Solution
              </Button>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button
                onClick={createBattle}
                className="bg-gradient-to-r from-teal-500 to-cyan-500"
                data-testid="create-battle-button"
              >
                Create New Battle
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
              </div>
            ) : battles.length === 0 ? (
              <Card className="glass-effect p-12 border-teal-500/20 text-center">
                <p className="text-gray-400">No active battles. Create one to get started!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {battles.map((battle) => (
                  <Card key={battle.id} className="glass-effect p-6 border-teal-500/20" data-testid={`battle-card-${battle.id}`}>
                    <h3 className="text-xl font-semibold text-white mb-4">Coding Battle</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>{battle.players?.length || 0} / 2 players</span>
                      </div>
                      <div className="text-sm text-gray-400">Status: {battle.status}</div>
                    </div>
                    <Button
                      onClick={() => joinBattle(battle.id)}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
                      data-testid="join-battle-button"
                    >
                      Join Battle
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default LiveBattlePage;
