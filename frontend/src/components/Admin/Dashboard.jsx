import React, { useState, useEffect } from 'react';
import { Shirt, Settings, LayoutDashboard, Plus, DollarSign, LogOut } from 'lucide-react';
import ProductList from './ProductList';
import SettingsPanel from './Settings';

export default function Dashboard({ token, onLogout, settings, fetchSettings }) {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Imefeli kupakia bidhaa.');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalValue = products.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const currencySymbol = settings?.currency || 'Tsh';

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  return (
    <div className="admin-container anim-slide-up">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <button 
          className={`admin-tab-btn ${activeSubTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('products')}
        >
          <Shirt size={18} /> Bidhaa Zote
        </button>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={18} /> Mipangilio
        </button>
      </aside>

      {/* Main Admin Workspace */}
      <main style={{ minWidth: 0 }}>
        {/* Quick Stats overview cards */}
        {activeSubTab === 'products' && (
          <div className="stats-grid anim-fade">
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Jumla ya Bidhaa</span>
              <div className="stat-num">{products.length}</div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Thamani ya Bidhaa</span>
              <div className="stat-num">{formatPrice(totalValue)} {currencySymbol}</div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>WhatsApp Namba</span>
              <div className="stat-num" style={{ fontSize: '1.25rem', fontFamily: 'inherit', fontWeight: '600', marginTop: '12px' }}>
                +{settings?.whatsappNumber || '255712345678'}
              </div>
            </div>
          </div>
        )}

        <div className="admin-content">
          {activeSubTab === 'products' ? (
            <ProductList 
              products={products} 
              loading={loading} 
              error={error} 
              token={token} 
              refreshProducts={fetchProducts} 
              settings={settings}
            />
          ) : (
            <SettingsPanel 
              token={token} 
              settings={settings} 
              refreshSettings={fetchSettings}
            />
          )}
        </div>
      </main>
    </div>
  );
}
