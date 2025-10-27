import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChallengeDetail = ({ user, onLogout, darkMode, setDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/challenges/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenge(response.data);
      setCode(response.data.starter_code?.[language] || '// Start coding here...');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load challenge');
      navigate('/challenges');
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(challenge.starter_code?.[newLang] || '// Start coding here...');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/challenges/submit`, {
        challenge_id: id,
        code: code,
        language: language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
      toast.success(response.data.status === 'Accepted' ? 'Challenge solved!' : 'Some tests failed');
    } catch (error) {
      toast.error('Failed to submit code');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (result && result.status === 'Accepted') {
    return (
      <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
        <div className="max-w-2xl mx-auto">
          <Card className="glass-effect p-8 border-teal-500/20 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Challenge Solved!</h1>
            <p className="text-gray-400 mb-4">Passed {result.passed_tests}/{result.total_tests} tests</p>
            <p className="text-yellow-400 text-2xl font-bold mb-6">+{result.points_earned} points</p>
            <Button onClick={() => navigate('/challenges')} className="bg-gradient-to-r from-teal-500 to-cyan-500">
              Back to Challenges
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="grid lg:grid-cols-2 gap-6" data-testid="challenge-detail-page">
        <div className="space-y-6">
          <Card className="glass-effect p-6 border-teal-500/20">
            <h1 className="text-2xl font-bold text-white mb-4">{challenge.title}</h1>
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">{challenge.company}</span>
              <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-sm">{challenge.difficulty}</span>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
          </Card>

          <Card className="glass-effect p-6 border-teal-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">Test Cases</h3>
            {challenge.test_cases?.map((test, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-800/50 rounded">
                <p className="text-sm text-gray-400">Input: <span className="text-teal-400">{JSON.stringify(test.input)}</span></p>
                <p className="text-sm text-gray-400">Output: <span className="text-teal-400">{JSON.stringify(test.output)}</span></p>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-effect p-6 border-teal-500/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Code Editor</h3>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {challenge.language_support?.map((lang) => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm bg-gray-900 border-gray-700 min-h-[400px]"
              data-testid="code-editor-textarea"
            />
          </Card>

          {result && result.status !== 'Accepted' && (
            <Card className="glass-effect p-4 border-red-500/20 bg-red-500/5">
              <p className="text-red-400">Failed {result.total_tests - result.passed_tests}/{result.total_tests} tests</p>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
            data-testid="submit-code-button"
          >
            <Play className="w-4 h-4 mr-2" />
            {submitting ? 'Running...' : 'Submit Code'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ChallengeDetail;
