import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Trophy, Building } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChallengesPage = ({ user, onLogout, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [companyFilter]);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = companyFilter === 'all' ? `${API}/challenges` : `${API}/challenges?company=${companyFilter}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }});
      setChallenges(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load challenges');
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="challenges-page">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">Coding Challenges 💻</h1>
          <p className="text-gray-300">Solve company-specific problems and earn points!</p>
        </div>

        <Card className="glass-effect p-6 border-teal-500/20">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Amazon">Amazon</SelectItem>
              <SelectItem value="Microsoft">Microsoft</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
          </div>
        ) : challenges.length === 0 ? (
          <Card className="glass-effect p-12 border-teal-500/20 text-center">
            <p className="text-gray-400">No challenges found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="glass-effect border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer"
                onClick={() => navigate(`/challenge/${challenge.id}`)}
                data-testid={`challenge-card-${challenge.id}`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{challenge.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{challenge.description}</p>
                  
                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                      <Building className="w-3 h-3 inline mr-1" />
                      {challenge.company}
                    </span>
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      {challenge.language_support?.join(', ')}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Trophy className="w-4 h-4" />
                      {challenge.points}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChallengesPage;
