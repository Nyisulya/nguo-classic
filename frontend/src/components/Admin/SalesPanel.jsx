import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, User, Phone, CheckCircle, TrendingUp, AlertTriangle, RefreshCw, ShoppingCart, Tag, ArrowUpRight } from 'lucide-react';

export default function SalesPanel({ token, products, refreshProducts, settings }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Cart / POS state
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  
  // Customer & Meta
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [overallDiscount, setOverallDiscount] = useState(0);

  const currencySymbol = settings?.currency || 'Tsh';

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Imefeli kupakia kumbukumbu ya mauzo.');
      const data = await response.json();
      // Sort sales by date descending
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSales(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  // Prefill price and size when product is selected
  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setCustomPrice(prod.price);
      setSelectedSize(prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : '');
    } else {
      setCustomPrice('');
      setSelectedSize('');
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if item is already in cart with same size
    const existingIndex = cart.findIndex(item => item.productId === selectedProductId && item.size === selectedSize);
    
    const itemQty = parseInt(quantity || 1, 10);
    const itemPrice = parseFloat(customPrice || prod.price);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += itemQty;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: prod.id,
          title: prod.title,
          price: itemPrice,
          buyingPrice: prod.buyingPrice || 0,
          quantity: itemQty,
          size: selectedSize,
          imageUrl: prod.imageUrl
        }
      ]);
    }

    // Reset single item state
    setSelectedProductId('');
    setSelectedSize('');
    setQuantity(1);
    setCustomPrice('');
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSaveSale = async () => {
    if (cart.length === 0) {
      alert('Kikapu kiko wazi! Tafadhali ongeza bidhaa kwanza.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          size: item.size
        })),
        discount: parseFloat(overallDiscount || 0),
        customerName,
        customerPhone,
        date: saleDate
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Imefeli kurekodi mauzo.');

      setSuccessMsg('Mauzo yamefanikiwa kurekodiwa kikamilifu!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOverallDiscount(0);
      
      // Refresh database states
      await fetchSales();
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Je, una uhakika unataka kufuta mauzo haya? Stoki ya bidhaa zilizouzwa itarudishwa store.')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Imefeli kufuta mauzo.');

      setSuccessMsg('Kumbukumbu ya mauzo imefutwa na bidhaa zimerudishwa store!');
      await fetchSales();
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Financial summary calculations
  const totalSalesVal = sales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalProfitVal = sales.reduce((acc, curr) => acc + (curr.profit || 0), 0);
  const totalDiscountVal = sales.reduce((acc, curr) => acc + (curr.discount || 0), 0);
  const totalCostVal = totalSalesVal - totalProfitVal;
  const profitMargin = totalSalesVal > 0 ? ((totalProfitVal / totalSalesVal) * 100).toFixed(1) : 0;

  // Selected product metadata for POS helper
  const activeProduct = products.find(p => p.id === selectedProductId);
  const sizesAvailable = activeProduct?.sizes || [];

  // Low Stock products listing
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock <= 3);

  // SVG Chart data preparation (Group sales by date for the last 7 days containing sales)
  const salesByDate = {};
  sales.forEach(sale => {
    const dateStr = new Date(sale.createdAt).toLocaleDateString('sw-TZ', { month: 'short', day: 'numeric' });
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { sales: 0, profit: 0 };
    }
    salesByDate[dateStr].sales += sale.totalAmount;
    salesByDate[dateStr].profit += sale.profit;
  });

  const chartData = Object.keys(salesByDate)
    .slice(0, 7) // Last 7 days with sales
    .reverse()
    .map(date => ({
      date,
      sales: salesByDate[date].sales,
      profit: salesByDate[date].profit
    }));

  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => Math.max(d.sales, d.profit))) : 1000;

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: '1px solid rgba(220, 53, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* POS Quick Recorder & Smart Analysis Summary Split */}
      <div className="sales-split-grid">
        
        {/* POS Panel */}
        <div className="stat-card glass" style={{ height: 'fit-content', padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> Rekodi Mauzo (Quick POS)
          </h3>
          
          <form onSubmit={handleAddToCart} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Select Product */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Tafuta au Chagua Nguo</label>
              <select
                className="form-input"
                style={{ background: 'var(--bg-input)' }}
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <option value="">-- Chagua Bidhaa --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock !== undefined && p.stock <= 0}>
                    {p.title} (Stock: {p.stock !== undefined ? p.stock : 'N/A'}) - {formatPrice(p.price)} {currencySymbol}
                  </option>
                ))}
              </select>
            </div>

            {selectedProductId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="anim-fade">
                <div className="grid-2-col-responsive">
                  {/* Size Choice */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Saizi</label>
                    {sizesAvailable.length > 0 ? (
                      <select
                        className="form-input"
                        style={{ background: 'var(--bg-input)' }}
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                      >
                        {sizesAvailable.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value="Free Size" disabled />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Idadi</label>
                    <input
                      type="number"
                      min="1"
                      max={activeProduct?.stock || 999}
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    />
                    {activeProduct?.stock !== undefined && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        Max: {activeProduct.stock} pcs dukani
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Selling Price */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Bei ya Kuuza ({currencySymbol}) - Prefilled</label>
                  <input
                    type="number"
                    className="form-input"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Ongeza kwenye Mauzo
                </button>
              </div>
            )}
          </form>

          {/* Cart View */}
          {cart.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }} className="anim-fade">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Bidhaa za Kusajili:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {cart.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <img src={item.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Saizi: {item.size || 'Mmoja tu'} | Qty: {item.quantity} x {formatPrice(item.price)}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(index)}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Customer details for transaction */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(197, 168, 128, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--accent-glow)' }}>
                <div className="grid-2-col-responsive">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Mteja (Jina)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="Jina la Mteja"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} /> Simu (WhatsApp)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="255..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-12-1-col-responsive">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> Tarehe ya Mauzo</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem', colorScheme: 'dark' }}
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><Tag size={12} style={{ display: 'inline', marginRight: '4px' }} /> Punguzo (Discount)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="0"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Subtotal, Discount & Profit calculations live */}
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '4px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Jumla Ndogo:</span>
                    <span>{formatPrice(cart.reduce((acc, c) => acc + c.price * c.quantity, 0))} {currencySymbol}</span>
                  </div>
                  {overallDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff6b6b', marginBottom: '4px' }}>
                      <span>Punguzo (Discount):</span>
                      <span>-{formatPrice(overallDiscount)} {currencySymbol}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px', color: 'var(--accent)' }}>
                    <span>Jumla Kamili:</span>
                    <span>{formatPrice(cart.reduce((acc, c) => acc + c.price * c.quantity, 0) - overallDiscount)} {currencySymbol}</span>
                  </div>
                  
                  {/* Smart profit estimate */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745', fontSize: '0.8rem', marginTop: '6px', fontWeight: '500' }}>
                    <span>Kadirio la Faida:</span>
                    <span>+{formatPrice(cart.reduce((acc, c) => acc + (c.price - c.buyingPrice) * c.quantity, 0) - overallDiscount)} {currencySymbol}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                  onClick={handleSaveSale}
                  disabled={actionLoading}
                >
                  <CheckCircle size={18} /> {actionLoading ? 'Inasajili...' : 'Usajili & Katisha Stock'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alerts & Sales chart split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Low Stock Panel */}
          <div className="stat-card glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff9f43' }}>
              <AlertTriangle size={18} /> Bidhaa Zilizopungua (Stock Low Alerts)
            </h3>
            {lowStockProducts.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(40, 167, 69, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(40,167,69,0.1)' }}>
                Safi sana! Bidhaa zote zina stoki ya kutosha.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                {lowStockProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(225, 100, 100, 0.03)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={p.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: p.stock === 0 ? '#ff6b6b' : '#ff9f43', background: p.stock === 0 ? 'rgba(220,53,69,0.1)' : 'rgba(255,159,67,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                      {p.stock === 0 ? 'Imeisha' : `${p.stock} zimebaki`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Trend Chart (Last 7 Days) */}
          <div className="stat-card glass" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Mwenendo wa Mauzo na Faida (Siku 7)
            </h3>
            {chartData.length === 0 ? (
              <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Bado hakuna mauzo yaliyorekodiwa kupata takwimu.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {chartData.map((d, i) => {
                  const salesWidth = (d.sales / maxVal) * 100;
                  const profitWidth = (d.profit / maxVal) * 100;
                  return (
                    <div key={i} style={{ fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '500' }}>{d.date}</span>
                        <span>Mauzo: {formatPrice(d.sales)} | Faida: <span style={{ color: '#28a745' }}>{formatPrice(d.profit)}</span></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                        {/* Sales Bar */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${salesWidth}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                        </div>
                        {/* Profit Bar */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${profitWidth}%`, height: '100%', background: '#28a745', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></span> Mauzo
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#28a745', borderRadius: '50%' }}></span> Faida Safi
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales History Log */}
      <div className="stat-card glass" style={{ padding: '24px' }}>
        <div className="admin-header" style={{ marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'inherit' }}>Kumbukumbu ya Mauzo (Sales History)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Orodha ya mauzo yote yaliyorekodiwa dukani kwako.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Pakia kumbukumbu...</div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            Hakuna kumbukumbu ya mauzo bado. Anza kurekodi mauzo hapo juu.
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID / Tarehe</th>
                  <th>Nguo Zilizouzwa</th>
                  <th>Mteja</th>
                  <th>Punguzo</th>
                  <th>Jumla Kuu</th>
                  <th>Faida iliyopatikana</th>
                  <th style={{ textAlign: 'right' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="anim-fade">
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>#{sale.id.slice(-6)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(sale.createdAt).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sale.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.85rem' }}>
                            {item.title} <span style={{ color: 'var(--text-muted)' }}>({item.size || 'Uni'})</span> x {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      {sale.customerName ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{sale.customerName}</div>
                          {sale.customerPhone && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Walk-in Customer</span>
                      )}
                    </td>
                    <td style={{ color: sale.discount > 0 ? '#ff6b6b' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {sale.discount > 0 ? `-${formatPrice(sale.discount)} ${currencySymbol}` : '-'}
                    </td>
                    <td style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {formatPrice(sale.totalAmount)} {currencySymbol}
                    </td>
                    <td style={{ color: sale.profit >= 0 ? '#28a745' : '#ff6b6b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {sale.profit >= 0 ? '+' : ''}{formatPrice(sale.profit)} {currencySymbol}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={actionLoading}
                      >
                        <Trash2 size={12} /> Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
