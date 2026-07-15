import React, { useState } from 'react';
import { Save, Key } from 'lucide-react';

export default function Settings({ token, settings, refreshSettings }) {
  const [storeName, setStoreName] = useState(settings?.storeName || 'VaziVibe Boutique');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber || '255712345678');
  const [currency, setCurrency] = useState(settings?.currency || 'Tsh');
  const [locationName, setLocationName] = useState(settings?.locationName || '');
  const [googleMapsLink, setGoogleMapsLink] = useState(settings?.googleMapsLink || '');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Password mpya na ya kuthibitisha hazifanani.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        storeName,
        whatsappNumber,
        currency,
        locationName,
        googleMapsLink
      };

      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Imefeli kuhifadhi mipangilio.');
      }

      setSuccessMsg('Mipangilio imehifadhiwa kikamilifu!');
      setNewPassword('');
      setConfirmPassword('');
      refreshSettings();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade">
      <div className="admin-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Mipangilio ya Duka</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sanidi taarifa zako za mawasiliano, sarafu, na usalama.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: '1px solid rgba(220, 53, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          {/* General settings block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Taarifa za Duka</h3>
            
            <div className="form-group">
              <label className="form-label">Jina la Duka (Store Name)</label>
              <input 
                type="text" 
                className="form-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">WhatsApp Namba (Format: 255...)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="255712345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Weka kodi ya nchi mwanzo (Mfano 255 badala ya 0). Usiweke alama ya '+'.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Sarafu (Currency Symbol)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Tsh"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Eneo la Duka (Location Text)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Mfano: Kariakoo, Congo St, Dar es Salaam"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kiungo cha Google Maps (Link ya Ramani)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Kiungo cha Google Maps (https://maps.app.goo.gl/...)"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Security settings block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Usalama wa Akaunti</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Password Mpya (New Password)</label>
                <input 
                  type="password" 
                  className="form-input"
                  placeholder="Password mpya ikiwa unataka kubadili"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thibitisha Password Mpya</label>
                <input 
                  type="password" 
                  className="form-input"
                  placeholder="Thibitisha password mpya"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ width: '100%', maxWidth: '240px', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={18} /> {loading ? 'Inahifadhi...' : 'Hifadhi Mipangilio'}
        </button>
      </form>
    </div>
  );
}
