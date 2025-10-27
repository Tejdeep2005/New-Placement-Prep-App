import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Code, Trophy, Users, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ user, onLogout, darkMode, setDarkMode, children }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user?.role === 'admin' ? [
    { path: '/admin', label: 'Admin Dashboard', icon: Trophy },
    { path: '/quizzes', label: 'Quizzes', icon: Brain },
    { path: '/challenges', label: 'Challenges', icon: Code },
  ] : [
    { path: '/dashboard', label: 'Dashboard', icon: Trophy },
    { path: '/quizzes', label: 'Quizzes', icon: Brain },
    { path: '/challenges', label: 'Challenges', icon: Code },
    { path: '/mock-interview', label: 'Mock Interview', icon: Brain },
    { path: '/live-battle', label: 'Live Battle', icon: Code },
    { path: '/friends', label: 'Friends', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900">
      {/* Navigation */}
      <nav className="glass-effect border-b border-teal-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-2xl font-bold gradient-text">
                PrepArena
              </Link>
              
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button variant="ghost" className="text-gray-300 hover:text-white" data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 glass-effect px-4 py-2 rounded-full border border-teal-500/20">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-white font-semibold" data-testid="user-points">{user?.points || 0} pts</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="hidden md:flex"
                data-testid="theme-toggle-button"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hidden md:flex text-red-400 hover:text-red-300"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-teal-500/20 bg-gray-900/95 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <div className="pt-4 border-t border-teal-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Points:</span>
                  <span className="text-white font-semibold">{user?.points || 0}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="w-full text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
