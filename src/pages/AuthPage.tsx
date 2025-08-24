import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        showNotification('Welcome back!', 'success');
      } else {
        await signup(username, email, password);
        showNotification('Account created successfully! Welcome!', 'success');
      }
      // The context will handle redirecting to the main app
    } catch (error: any) {
      showNotification(error.message || 'An error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-black">
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </h1>
          <p className="mt-2 text-slate-600">
            {isLogin ? 'Sign in to continue your learning journey.' : 'Join LearnSphere to get started.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username" name="username" type="text" value={username} onChange={e => setUsername(e.target.value)}
                required autoComplete="username" placeholder="Username"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" placeholder="Email address"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="Password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 flex justify-center items-center"
          >
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={toggleForm} className="font-semibold text-indigo-600 hover:underline ml-1">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;