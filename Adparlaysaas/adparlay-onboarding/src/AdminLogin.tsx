import React, { useState } from 'react';
import { useFirebase } from './FirebaseContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useFirebase();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans">
      <div className="bg-panel rounded-3xl shadow-2xl p-10 max-w-md w-full border border-border">
        <h1 className="text-3xl font-extrabold text-heading mb-8 text-center tracking-tight">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-heading mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-base font-semibold text-heading mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl shadow-lg font-bold text-lg hover:bg-primary/90 transition-colors mt-4">Sign In</button>
        </form>
        {error && <div className="mt-6 text-center text-error font-semibold">{error}</div>}
      </div>
    </div>
  );
};

export default AdminLogin; 