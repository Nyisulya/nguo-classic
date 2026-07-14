import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function SuperadminLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Tafadhali ingiza password ya Superadmin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password ya Superadmin sio sahihi.');
      }

      localStorage.setItem('superadmin_token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper anim-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="login-card glass" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div 
            style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(197, 168, 128, 0.1)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent)',
              marginBottom: '16px'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Superadmin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Usimamizi Mkuu wa Maduka ya Mitindo</p>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '12px 16px', 
              background: 'rgba(220, 53, 69, 0.1)', 
              color: '#ff6b6b', 
              border: '1px solid rgba(220, 53, 69, 0.2)',
              borderRadius: '8px', 
              fontSize: '0.88rem', 
              marginBottom: '20px' 
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password ya Superadmin</label>
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '40px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Inafungua...' : 'Ingia Kwenye Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
