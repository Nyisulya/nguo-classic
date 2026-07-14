import React from 'react';
import { ShoppingBag, Lock, LogOut, Store } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, settings, isAdmin, onLogout }) {
  return (
    <nav className="navbar-wrapper scrolled">
      <div className="container navbar-container">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setActiveTab('shop'); }}>
          <Store size={26} className="whatsapp-green" />
          <span>{settings?.storeName || 'VaziVibe'}</span> Boutique
        </a>
        
        <ul className="nav-links">
          <li>
            <a 
              href="#shop" 
              className={`nav-link ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveTab('shop'); }}
            >
              Dukani
            </a>
          </li>
          <li>
            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <a 
                  href="#admin" 
                  className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('admin'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Lock size={16} /> Admin Dashboard
                </a>
                <button 
                  onClick={onLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LogOut size={14} /> Toka
                </button>
              </div>
            ) : (
              <a 
                href="#admin" 
                className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('admin'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Lock size={16} /> Ingia
              </a>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
