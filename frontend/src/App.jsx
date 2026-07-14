import React, { useState, useEffect } from 'react';
import { Search, Store, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';
import LockedScreen from './components/LockedScreen';
import SuperadminLogin from './components/Superadmin/Login';
import SuperadminDashboard from './components/Superadmin/Dashboard';

// Helper to resolve subdomain on frontend
const getSubdomain = () => {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.endsWith('.localhost')) {
    return hostname.replace('.localhost', '');
  }
  
  if (hostname.endsWith('.mitindo.nyisu.com')) {
    return hostname.replace('.mitindo.nyisu.com', '');
  }
  
  const parts = hostname.split('.');
  if (parts.length > 2 && hostname !== 'mitindo.nyisu.com' && hostname !== 'localhost') {
    return parts[0];
  }
  
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('vazivibe_token') || '');
  
  // Settings & Products State
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  
  // Expiry & Tenant states
  const [isExpired, setIsExpired] = useState(false);
  const [lockData, setLockData] = useState(null);
  const [shopNotFound, setShopNotFound] = useState(false);
  
  // Superadmin States
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superToken, setSuperTokenState] = useState(localStorage.getItem('superadmin_token') || '');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['All', 'Men', 'Women', 'Accessories', 'Shoes'];

  const subdomain = getSubdomain();
  const isMainDomain = !subdomain;

  // Fetch store settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.status === 403) {
        const data = await res.json();
        if (data.expired) {
          setIsExpired(true);
          setLockData(data);
          return;
        }
      }
      if (res.status === 404) {
        setShopNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setProductsError('Imefeli kupakia mipangilio ya duka.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch public products based on filter/search
  const fetchProducts = async () => {
    setProductsError('');
    try {
      let url = '/api/products?';
      if (selectedCategory && selectedCategory !== 'All') {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Imefeli kupakia bidhaa.');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setProductsError(err.message);
    }
  };

  // Verify Admin Token
  const verifyToken = async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        setIsAdmin(true);
        setToken(authToken);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error verifying token:', err);
    }
  };

  // Verify Superadmin Token
  const verifySuperToken = async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/superadmin/verify', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        setIsSuperAdmin(true);
        setSuperTokenState(authToken);
      } else {
        handleSuperLogout();
      }
    } catch (err) {
      console.error('Error verifying super token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMainDomain) {
      fetchSettings();
    } else {
      if (superToken) {
        verifySuperToken(superToken);
      } else {
        setLoading(false);
      }
    }
  }, [isMainDomain]);

  useEffect(() => {
    if (!isMainDomain && settings && !isExpired && !shopNotFound) {
      fetchProducts();
    }
  }, [selectedCategory, searchQuery, settings, isExpired, shopNotFound, isMainDomain]);

  useEffect(() => {
    if (!isMainDomain && token) {
      verifyToken(token);
    }
  }, [token, isMainDomain]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setIsAdmin(true);
    setActiveTab('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('vazivibe_token');
    setToken('');
    setIsAdmin(false);
    setActiveTab('shop');
  };

  const handleSuperLoginSuccess = (newToken) => {
    setSuperTokenState(newToken);
    setIsSuperAdmin(true);
  };

  const handleSuperLogout = () => {
    localStorage.removeItem('superadmin_token');
    setSuperTokenState('');
    setIsSuperAdmin(false);
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  // Loading Screen
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0B0A0A', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Store size={40} style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite', marginBottom: '16px' }} />
          <div>Inapakia...</div>
        </div>
      </div>
    );
  }

  // Shop Not Found Screen
  if (shopNotFound) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0B0A0A', color: 'var(--text-main)', padding: '20px' }}>
        <div className="login-card glass" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
          <Store size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.75rem', fontFamily: "'Playfair Display', serif", marginBottom: '12px' }}>Duka Halikupatikana</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>Duka unalolijaribu kulifikia halijasajiliwa kwenye mfumo wetu wa mitindo.nyisu.com.</p>
          <a href="http://mitindo.nyisu.com" className="btn btn-primary" style={{ width: '100%' }}>Nenda Mwanzo</a>
        </div>
      </div>
    );
  }

  // Expired / Locked Screen
  if (isExpired) {
    return (
      <LockedScreen 
        storeName={lockData?.storeName} 
        message={lockData?.message} 
        whatsappNumber={lockData?.whatsappNumber} 
      />
    );
  }

  // Superadmin View (Base Domain)
  if (isMainDomain) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0A0A', color: 'var(--text-main)' }}>
        {!isSuperAdmin ? (
          <SuperadminLogin onLoginSuccess={handleSuperLoginSuccess} />
        ) : (
          <div className="container" style={{ padding: '0 24px 40px' }}>
            <SuperadminDashboard token={superToken} onLogout={handleSuperLogout} />
          </div>
        )}
      </div>
    );
  }

  // Tenant Shop View (Subdomain)
  return (
    <>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {activeTab === 'shop' ? (
        <div className="anim-fade" style={{ paddingTop: '80px' }}>
          {/* Hero Section */}
          <section className="hero">
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }}>
              <div className="hero-content anim-slide-up">
                <span className="hero-tag">Msimu Mpya wa Mavazi 2026</span>
                <h1 className="hero-title">
                  Vaa Kifahari,<br />
                  Jiamini na <span>{settings?.storeName || 'VaziVibe'}</span>
                </h1>
                <p className="hero-desc">
                  Gundua mikusanyiko yetu mipya ya nguo za kijanja na za kisasa zenye ubora wa juu kabisa. Chagua unachopenda kisha agiza kwa urahisi kupitia WhatsApp kwa kubonyeza kitufe kimoja tu!
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <a href="#katalogi" className="btn btn-primary">
                    Angalia Nguo Zote <ArrowRight size={16} />
                  </a>
                  <a href={`https://wa.me/${settings?.whatsappNumber || '255712345678'}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    Wasiliana Nasi
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Catalog Section */}
          <section id="katalogi" style={{ padding: '80px 0 20px' }}>
            <div className="container">
              <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '12px' }}>Katalogi ya Nguo</h2>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
                Tafuta nguo uipendayo, chagua saizi na rangi, na uagize papo hapo. Tunatuma popote nchini Tanzania.
              </p>

              {/* Controls (Search & Category Tabs) */}
              <div className="controls-container">
                <div className="search-bar-container">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Tafuta nguo hapa (mfano Suruali, Blauz, Rangi)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="filter-tabs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'All' ? 'Zote' : cat === 'Men' ? 'Wanaume' : cat === 'Women' ? 'Wanawake' : cat === 'Accessories' ? 'Vikorokoro' : 'Viatu'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              {productsError ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#ff6b6b' }}>
                  Hitilafu imetokea wakati wa kupakia bidhaa. Tafadhali jaribu tena.
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginTop: '40px' }}>
                  <Store size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3>Samahani, hakuna nguo mpya kwa sasa</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Jaribu kutafuta bidhaa nyingine au kubadilisha aina (category).</p>
                </div>
              ) : (
                <div className="grid-products">
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onQuickView={setSelectedProduct} 
                      settings={settings}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick View Modal */}
          {selectedProduct && (
            <ProductModal 
              product={selectedProduct} 
              onClose={() => setSelectedProduct(null)} 
              settings={settings}
            />
          )}

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="footer-grid">
                <div>
                  <h3 className="footer-logo">
                    <Store size={22} className="whatsapp-green" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    <span>{settings?.storeName || 'VaziVibe'}</span> Boutique
                  </h3>
                  <p className="footer-desc" style={{ marginBottom: '20px' }}>
                    Duka la kijanja la mavazi ya kisasa na ya kipekee nchini. Tunalenga kukuwezesha kung'ara kwa bei nafuu sana.
                  </p>
                </div>
                
                <div>
                  <h4 className="footer-title">Mawasiliano</h4>
                  <ul className="footer-links" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Phone size={14} className="whatsapp-green" /> +{settings?.whatsappNumber || '255712345678'}
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e1306c' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> @vazivibe_boutique
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <MapPin size={14} style={{ color: 'var(--accent)' }} /> Kariakoo, Dar es Salaam
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="footer-title">Saa za Kazi</h4>
                  <ul className="footer-links" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <li style={{ marginBottom: '8px' }}>Jumatatu - Jumamosi: 02:00 Asubuhi - 02:00 Usiku</li>
                    <li style={{ marginBottom: '8px' }}>Jumapili: 04:00 Asubuhi - 12:00 Jioni</li>
                  </ul>
                </div>
              </div>

              <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} {settings?.storeName || 'VaziVibe'} Boutique. Haki zote zimehifadhiwa.</p>
                <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#333' }}>Imetengenezwa ki-professional kwa ajili ya biashara yako.</p>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
          {isAdmin ? (
            <div className="container">
              <Dashboard 
                token={token} 
                onLogout={handleLogout} 
                settings={settings} 
                fetchSettings={fetchSettings}
              />
            </div>
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      )}
    </>
  );
}
