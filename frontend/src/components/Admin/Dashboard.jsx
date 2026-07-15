import React, { useState, useEffect } from 'react';
import { Shirt, Settings, LayoutDashboard, Plus, DollarSign, LogOut } from 'lucide-react';
import ProductList from './ProductList';
import SettingsPanel from './Settings';
import SalesPanel from './SalesPanel';

export default function Dashboard({ token, onLogout, settings, fetchSettings }) {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Accent Color Theme state
  const [theme, setTheme] = useState(settings?.theme || localStorage.getItem('vazivibe_theme') || 'gold');

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings]);

  useEffect(() => {
    const themes = {
      gold: { accent: '#C5A880', hover: '#B4966E', glow: 'rgba(197, 168, 128, 0.15)' },
      emerald: { accent: '#2ec4b6', hover: '#0f9f90', glow: 'rgba(46, 196, 182, 0.15)' },
      rose: { accent: '#e63946', hover: '#d62828', glow: 'rgba(230, 57, 70, 0.15)' },
      purple: { accent: '#9b5de5', hover: '#8338ec', glow: 'rgba(155, 93, 229, 0.15)' },
      blue: { accent: '#00b4d8', hover: '#0077b6', glow: 'rgba(0, 180, 216, 0.15)' }
    };
    const activeTheme = themes[theme] || themes.gold;
    document.documentElement.style.setProperty('--accent', activeTheme.accent);
    document.documentElement.style.setProperty('--accent-hover', activeTheme.hover);
    document.documentElement.style.setProperty('--accent-glow', activeTheme.glow);
    localStorage.setItem('vazivibe_theme', theme);
  }, [theme]);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      });
      if (fetchSettings) fetchSettings();
    } catch (err) {
      console.error('Error saving theme settings:', err);
    }
  };

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

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error fetching sales for stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  const handleRefreshAll = async () => {
    await fetchProducts();
    await fetchSales();
  };

  const currencySymbol = settings?.currency || 'Tsh';

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  // Stats calculation
  const totalSalesVal = sales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalProfitVal = sales.reduce((acc, curr) => acc + (curr.profit || 0), 0);
  const totalRetailVal = products.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.stock || 0)), 0);
  const totalBuyingVal = products.reduce((acc, curr) => acc + ((curr.buyingPrice || 0) * (curr.stock || 0)), 0);
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

  return (
    <div className="admin-container anim-fade">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        {/* Desktop-only Branding Header */}
        <div className="sidebar-desktop-only" style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 'bold', display: 'block' }}>
            Jopo la Admin
          </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: "'Playfair Display', serif", display: 'block', marginTop: '4px', color: 'var(--text-main)' }}>
            {settings?.storeName || 'VaziVibe'}
          </span>
        </div>

        <div className="sidebar-group-title">Biashara</div>
        
        <button 
          className={`admin-tab-btn ${activeSubTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('products')}
        >
          <Shirt size={18} /> Bidhaa & Stoki
        </button>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sales')}
        >
          <DollarSign size={18} /> Mauzo & POS
        </button>

        <div className="sidebar-group-title">Mfumo</div>

        <button 
          className={`admin-tab-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={18} /> Mipangilio ya Duka
        </button>

        {/* Theme Picker */}
        <div className="sidebar-group-title">Rangi ya Mfumo</div>
        <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'gold', color: '#C5A880', name: 'Dhahabu' },
            { id: 'emerald', color: '#2ec4b6', name: 'Zamaradi' },
            { id: 'rose', color: '#e63946', name: 'Waridi' },
            { id: 'purple', color: '#9b5de5', name: 'Urujuani' },
            { id: 'blue', color: '#00b4d8', name: 'Bluu' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: t.color,
                border: theme === t.id ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                boxShadow: theme === t.id ? '0 0 6px ' + t.color : 'none',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              title={t.name}
            />
          ))}
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main style={{ minWidth: 0 }}>
        {/* Quick Stats overview cards for Products */}
        {activeSubTab === 'products' && (
          <div className="stats-grid anim-fade">
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Aina za Mavazi</span>
              <div className="stat-num">{products.length}</div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Thamani ya Stoki (Kuuza)</span>
              <div className="stat-num">{formatPrice(totalRetailVal)} {currencySymbol}</div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Stoki ya Mtaji (Kununua)</span>
              <div className="stat-num">{formatPrice(totalBuyingVal)} {currencySymbol}</div>
            </div>
            <div className="stat-card" style={{ border: outOfStockCount > 0 ? '1px solid rgba(220, 53, 69, 0.2)' : '1px solid var(--border-color)' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Bidhaa Zilizoisha (Stock 0)</span>
              <div className="stat-num" style={{ color: outOfStockCount > 0 ? '#ff6b6b' : 'var(--text-muted)' }}>{outOfStockCount}</div>
            </div>
          </div>
        )}

        {/* Quick Stats overview cards for Sales */}
        {activeSubTab === 'sales' && (
          <div className="stats-grid anim-fade">
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Jumla ya Mauzo</span>
              <div className="stat-num" style={{ color: 'var(--accent)' }}>{formatPrice(totalSalesVal)} {currencySymbol}</div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Faida Kamili (Net Profit)</span>
              <div className="stat-num" style={{ color: totalProfitVal >= 0 ? '#28a745' : '#ff6b6b' }}>
                {totalProfitVal >= 0 ? '+' : ''}{formatPrice(totalProfitVal)} {currencySymbol}
              </div>
            </div>
            <div className="stat-card">
              <span className="form-label" style={{ marginBottom: 0 }}>Margin ya Faida</span>
              <div className="stat-num">
                {totalSalesVal > 0 ? ((totalProfitVal / totalSalesVal) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        )}

        <div className="admin-content">
          {activeSubTab === 'products' && (
            <ProductList 
              products={products} 
              loading={loading} 
              error={error} 
              token={token} 
              refreshProducts={handleRefreshAll} 
              settings={settings}
            />
          )}

          {activeSubTab === 'sales' && (
            <SalesPanel 
              token={token}
              products={products}
              refreshProducts={handleRefreshAll}
              settings={settings}
            />
          )}

          {activeSubTab === 'settings' && (
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
