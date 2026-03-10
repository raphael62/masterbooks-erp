import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import OfflineIndicator from './components/OfflineIndicator';
import SyncStatus from './components/SyncStatus';
import LoginBackground from './components/LoginBackground';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, signIn, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (loginData) => {
    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(loginData?.email, loginData?.password);

      if (signInError) {
        setError(signInError?.message || 'Invalid email or password.');
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <LoginBackground />
      {/* Offline Indicator */}
      <OfflineIndicator />
      {/* Header */}
      <header className="relative z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-foreground"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MasterBooks ERP</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Distribution Management System
                </p>
              </div>
            </div>

            {/* Sync Status */}
            <SyncStatus />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm 
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
      {/* Footer */}
      <footer className="relative z-10 bg-card/60 backdrop-blur-sm border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="Shield" size={16} className="text-success" />
                <span>Secure Login</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Globe" size={16} className="text-primary" />
                <span>Ghana Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Smartphone" size={16} className="text-secondary" />
                <span>Mobile Ready</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground text-center sm:text-right">
              <p>&copy; {new Date()?.getFullYear()} MasterBooks ERP. All rights reserved.</p>
              <p className="text-xs mt-1">Version 2.1.0 • Built for Ghana</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;