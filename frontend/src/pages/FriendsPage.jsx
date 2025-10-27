import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, UserMinus, Mail } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FriendsPage = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [friends, setFriends] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load friends');
      setLoading(false);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/friends/request`, 
        { friend_email: friendEmail },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Friend request sent!');
      setFriendEmail('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send friend request');
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend removed');
      fetchFriends();
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode}>
      <div className="space-y-8" data-testid="friends-page">
        <div className="glass-effect p-8 rounded-2xl border border-teal-500/20">
          <h1 className="text-4xl font-bold text-white mb-4">Friends 👥</h1>
          <p className="text-gray-300">Connect and compete with friends!</p>
        </div>

        <Card className="glass-effect p-6 border-teal-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Add Friend</h3>
          <form onSubmit={sendFriendRequest} className="flex gap-4">
            <Input
              type="email"
              placeholder="Enter friend's email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
              data-testid="friend-email-input"
              required
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
              data-testid="send-friend-request-button"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </form>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mx-auto"></div>
          </div>
        ) : friends.length === 0 ? (
          <Card className="glass-effect p-12 border-teal-500/20 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No friends yet. Add some to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <Card key={friend.id} className="glass-effect p-6 border-teal-500/20" data-testid={`friend-card-${friend.id}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {friend.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{friend.name}</h3>
                    <p className="text-sm text-gray-400">{friend.email}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-teal-400">{friend.points || 0}</p>
                    <p className="text-xs text-gray-400">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-400">{friend.level || 1}</p>
                    <p className="text-xs text-gray-400">Level</p>
                  </div>
                </div>

                <Button
                  onClick={() => removeFriend(friend.id)}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  data-testid="remove-friend-button"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FriendsPage;
