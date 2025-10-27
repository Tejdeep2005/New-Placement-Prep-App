import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, Trophy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuizDetail = ({ user, onLogout, darkMode, setDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !result) {
      handleSubmit();
    }
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(response.data);
      setTimeLeft(response.data.time_limit * 60);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load quiz');
      navigate('/quizzes');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const timeTaken = (quiz.time_limit * 60) - timeLeft;
      
      const response = await axios.post(`${API}/quizzes/submit`, {
        quiz_id: id,
        answers: answers,
        time_taken: timeTaken
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
      toast.success(`Quiz completed! You scored ${response.data.score}/${response.data.total_questions}`);
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (result) {
    return (
      <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
        <div className="max-w-2xl mx-auto">
          <Card className="glass-effect p-8 border-teal-500/20 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Quiz Completed!</h1>
            
            <div className="grid grid-cols-2 gap-6 my-8">
              <div>
                <p className="text-gray-400 mb-2">Score</p>
                <p className="text-4xl font-bold text-teal-400">
                  {result.score}/{result.total_questions}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Points Earned</p>
                <p className="text-4xl font-bold text-yellow-400">
                  {result.points_earned}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/quizzes')}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
              data-testid="back-to-quizzes-button"
            >
              Back to Quizzes
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="quiz-detail-page">
        {/* Header */}
        <Card className="glass-effect p-6 border-teal-500/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
              <p className="text-gray-400">{quiz.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold text-teal-400 mb-2" data-testid="timer-display">
                <Clock className="w-6 h-6" />
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-400">{quiz.questions?.length || 0} Questions</p>
            </div>
          </div>
        </Card>

        {/* Questions */}
        {quiz.questions?.map((question, index) => (
          <Card key={question.id} className="glass-effect p-6 border-teal-500/20" data-testid={`question-${index}`}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {index + 1}. {question.question}
            </h3>
            
            <RadioGroup
              value={answers[question.id]}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2 mb-3" data-testid={`question-${index}-option-${optIndex}`}>
                  <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                  <Label
                    htmlFor={`${question.id}-${optIndex}`}
                    className="text-gray-300 cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}

        {/* Submit Button */}
        <Card className="glass-effect p-6 border-teal-500/20">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            data-testid="submit-quiz-button"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </Card>
      </div>
    </Layout>
  );
};

export default QuizDetail;
