import React from 'react';
import { Lock, Phone, MessageSquare } from 'lucide-react';

export default function LockedScreen({ storeName, message, whatsappNumber }) {
  // Format WhatsApp Link
  const formattedNumber = whatsappNumber.replace('+', '');
  const encodedText = encodeURIComponent(
    `Habari, mimi ni msimamizi wa duka la "${storeName || 'Boutique'}" kwenye mitindo.nyisu.com. Mfumo wangu umejifunga na ningependa kuongeza muda wa matumizi.`
  );
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedText}`;

  return (
    <div className="login-wrapper anim-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0B0A0A', padding: '20px' }}>
      <div className="login-card glass" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(220, 53, 69, 0.1)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ff6b6b',
              border: '1px solid rgba(220, 53, 69, 0.2)',
              boxShadow: '0 0 20px rgba(220, 53, 69, 0.15)'
            }}
          >
            <Lock size={36} />
          </div>
        </div>

        <h1 style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif", color: 'var(--text-main)', marginBottom: '16px' }}>
          Mfumo Umejifunga
        </h1>

        <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '20px 0', margin: '20px 0' }}>
          <p style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '12px', fontSize: '1.1rem' }}>
            {storeName || 'Duka hili'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {message || "Samahani, duka hili limefungwa kwa muda kwa sababu muda wa matumizi ya huduma umeisha."}
          </p>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Tafadhali wasiliana na msimamizi wa mfumo (Admin) ili kuongeza muda wa matumizi au kufanya malipo na kuendelea kutumia duka lako.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
          >
            <MessageSquare size={18} />
            Wasiliana Nasi WhatsApp
          </a>
          
          {whatsappNumber && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Phone size={14} style={{ color: 'var(--accent)' }} />
              <span>+{whatsappNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
