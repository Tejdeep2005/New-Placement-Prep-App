import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MockInterviewPage = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/mock-interview/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviewId(response.data.interview_id);
      setMessages([{ role: 'assistant', content: response.data.message }]);
      toast.success('Mock interview started!');
    } catch (error) {
      toast.error('Failed to start interview');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/mock-interview/${interviewId}/message`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Failed to send message');
    }
    setLoading(false);
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="mock-interview-page">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">AI Mock Interview 🤖</h1>
          <p className="text-gray-300">Practice with Claude AI interviewer</p>
        </div>

        {!interviewId ? (
          <Card className="glass-effect p-12 border-teal-500/20 text-center">
            <Brain className="w-20 h-20 text-teal-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Ready for your mock interview?</h2>
            <p className="text-gray-400 mb-6">Claude AI will ask you technical and behavioral questions</p>
            <Button
              onClick={startInterview}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
              data-testid="start-interview-button"
            >
              Start Interview
            </Button>
          </Card>
        ) : (
          <>
            <Card className="glass-effect p-6 border-teal-500/20 h-[500px] overflow-y-auto scrollbar-thin">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${idx}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-teal-500/20 text-white'
                          : 'bg-gray-800/50 text-gray-300'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="glass-effect p-4 border-teal-500/20">
              <div className="flex gap-4">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  className="bg-gray-800/50 border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  data-testid="message-input"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500"
                  data-testid="send-message-button"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MockInterviewPage;
