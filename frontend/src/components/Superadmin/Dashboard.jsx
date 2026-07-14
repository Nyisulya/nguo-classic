import React, { useState, useEffect } from 'react';
import { Store, Plus, Users, Calendar, AlertTriangle, Trash2, Edit, Settings, Key, Clock, LogOut, Save } from 'lucide-react';

export default function SuperadminDashboard({ token, onLogout }) {
  const [activeSubTab, setActiveSubTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Settings Panel
  const [superSettings, setSuperSettings] = useState({ whatsappNumber: '' });
  const [superSettingsLoading, setSuperSettingsLoading] = useState(false);
  const [superSettingsSuccess, setSuperSettingsSuccess] = useState('');
  const [newSuperPassword, setNewSuperPassword] = useState('');
  const [confirmSuperPassword, setConfirmSuperPassword] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Form states
  const [subdomain, setSubdomain] = useState('');
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [adminPassword, setAdminPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Edit form states
  const [editStoreName, setEditStoreName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [extendDays, setExtendDays] = useState(0);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/superadmin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Imefeli kupakia orodha ya maduka.');
      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuperSettings = async () => {
    try {
      const response = await fetch('/api/superadmin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuperSettings(data);
      }
    } catch (err) {
      console.error("Error fetching super settings", err);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchSuperSettings();
  }, []);

  const handleAddTenant = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          storeName: storeName.trim(),
          ownerName: ownerName.trim(),
          whatsappNumber: whatsappNumber.trim(),
          expiresAt: expiresAt.toISOString(),
          adminPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Imefeli kuongeza duka.');
      }

      setShowAddModal(false);
      // Reset form
      setSubdomain('');
      setStoreName('');
      setOwnerName('');
      setWhatsappNumber('');
      setExpiryDays(30);
      setAdminPassword('');
      fetchTenants();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = (tenant) => {
    setSelectedTenant(tenant);
    setEditStoreName(tenant.storeName);
    setEditOwnerName(tenant.ownerName);
    setEditWhatsappNumber(tenant.whatsappNumber);
    setEditStatus(tenant.status);
    setExtendDays(0);
    setNewAdminPassword('');
    setModalError('');
    setShowEditModal(true);
  };

  const handleEditTenant = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      let expiresAt = selectedTenant.expiresAt;
      if (extendDays > 0) {
        const currentExpiry = new Date(selectedTenant.expiresAt);
        const baseline = currentExpiry > new Date() ? currentExpiry : new Date();
        baseline.setDate(baseline.getDate() + parseInt(extendDays));
        expiresAt = baseline.toISOString();
      }

      const payload = {
        storeName: editStoreName.trim(),
        ownerName: editOwnerName.trim(),
        whatsappNumber: editWhatsappNumber.trim(),
        status: editStatus,
        expiresAt
      };

      if (newAdminPassword.trim() !== '') {
        payload.adminPassword = newAdminPassword;
      }

      const response = await fetch(`/api/superadmin/tenants/${selectedTenant.subdomain}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Imefeli kusasisha duka.');
      }

      setShowEditModal(false);
      fetchTenants();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTenant = async (subdomain) => {
    if (!window.confirm(`Una uhakika unataka kufuta kabisa duka la "${subdomain}"? Data zote za bidhaa na mipangilio zitafutwa!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/tenants/${subdomain}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Imefeli kufuta duka.');
      }

      fetchTenants();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSuperSettings = async (e) => {
    e.preventDefault();
    setSuperSettingsSuccess('');
    setError('');

    if (newSuperPassword && newSuperPassword !== confirmSuperPassword) {
      setError('Password mpya na ya kuthibitisha hazifanani.');
      return;
    }

    setSuperSettingsLoading(true);
    try {
      const payload = {
        whatsappNumber: superSettings.whatsappNumber
      };
      if (newSuperPassword) {
        payload.newPassword = newSuperPassword;
      }

      const response = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Imefeli kuhifadhi mipangilio.');
      }

      setSuperSettingsSuccess('Mipangilio imehifadhiwa kikamilifu!');
      setNewSuperPassword('');
      setConfirmSuperPassword('');
      fetchSuperSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSuperSettingsLoading(false);
    }
  };

  const activeCount = tenants.filter(t => t.status === 'active' && t.remainingDays > 0).length;
  const expiredCount = tenants.filter(t => t.status === 'suspended' || t.remainingDays <= 0).length;

  return (
    <div className="admin-container anim-slide-up" style={{ paddingTop: '20px' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>Superadmin</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mifumo & Maduka</p>
        </div>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tenants')}
        >
          <Store size={18} /> Maduka Yote ({tenants.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={18} /> Mipangilio Mkuu
        </button>
        <button 
          className="admin-tab-btn" 
          onClick={onLogout}
          style={{ marginTop: 'auto', color: '#ff6b6b' }}
        >
          <LogOut size={18} /> Toka Nje
        </button>
      </aside>

      {/* Main Workspace */}
      <main style={{ minWidth: 0, flex: 1 }}>
        {activeSubTab === 'tenants' ? (
          <div className="anim-fade">
            {/* Stats Overview */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="form-label" style={{ marginBottom: 0 }}>Jumla ya Maduka</span>
                <div className="stat-num">{tenants.length}</div>
              </div>
              <div className="stat-card">
                <span className="form-label" style={{ marginBottom: 0 }}>Maduka Active</span>
                <div className="stat-num" style={{ color: '#28a745' }}>{activeCount}</div>
              </div>
              <div className="stat-card">
                <span className="form-label" style={{ marginBottom: 0 }}>Maduka yaliyofungwa/Expired</span>
                <div className="stat-num" style={{ color: '#ff6b6b' }}>{expiredCount}</div>
              </div>
            </div>

            {/* Actions & Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 20px' }}>
              <div>
                <h2>Orodha ya Maduka</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sajili na usimamie subdomains za wauzaji wako.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Sajili Duka Jipya
              </button>
            </div>

            {/* Tenants List Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                Inapakia orodha ya maduka...
              </div>
            ) : error ? (
              <div style={{ padding: '16px', background: 'rgba(220,53,69,0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.2)' }}>
                Hitilafu: {error}
              </div>
            ) : tenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <Store size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h3>Hakuna duka lililosajiliwa kwa sasa</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Bonyeza kitufe cha 'Sajili Duka Jipya' kuongeza mteja wako wa kwanza.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 20px' }}>Subdomain / Duka</th>
                      <th style={{ padding: '16px 20px' }}>Mmiliki</th>
                      <th style={{ padding: '16px 20px' }}>WhatsApp</th>
                      <th style={{ padding: '16px 20px' }}>Siku Zilizobaki</th>
                      <th style={{ padding: '16px 20px' }}>Hali</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Vitendo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => {
                      const isExpired = tenant.remainingDays <= 0;
                      const isSuspended = tenant.status !== 'active';
                      return (
                        <tr key={tenant.subdomain} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: '600' }}>{tenant.storeName}</div>
                            <a 
                              href={`http://${tenant.subdomain}.mitindo.nyisu.com`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}
                            >
                              {tenant.subdomain}.mitindo.nyisu.com
                            </a>
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{tenant.ownerName}</td>
                          <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>+{tenant.whatsappNumber}</td>
                          <td style={{ padding: '16px 20px' }}>
                            {isSuspended ? (
                              <span style={{ color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={14} /> Limesitishwa
                              </span>
                            ) : isExpired ? (
                              <span style={{ color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                <Clock size={14} /> Imeisha (imejifunga)
                              </span>
                            ) : (
                              <span style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> {tenant.remainingDays} Siku
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span 
                              style={{ 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                background: (isSuspended || isExpired) ? 'rgba(220,53,69,0.1)' : 'rgba(40,167,69,0.1)',
                                color: (isSuspended || isExpired) ? '#ff6b6b' : '#28a745'
                              }}
                            >
                              {(isSuspended || isExpired) ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                onClick={() => handleOpenEdit(tenant)}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#ff6b6b', borderColor: 'rgba(220,53,69,0.2)' }}
                                onClick={() => handleDeleteTenant(tenant.subdomain)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Superadmin Settings */
          <div className="anim-fade">
            <div style={{ marginBottom: '24px' }}>
              <h2>Mipangilio ya Mfumo</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Badilisha namba ya usaidizi kwa wateja na usalama wa akaunti ya Superadmin.</p>
            </div>

            {superSettingsSuccess && (
              <div style={{ padding: '12px 16px', background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px' }}>
                {superSettingsSuccess}
              </div>
            )}

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: '1px solid rgba(220, 53, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '24px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSuperSettings} className="glass" style={{ padding: '32px', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>WhatsApp ya Usaidizi (Helpdesk)</h3>
                  
                  <div className="form-group">
                    <label className="form-label">WhatsApp Namba ya Admin (Format: 255...)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="255756670798"
                      value={superSettings.whatsappNumber || ''}
                      onChange={(e) => setSuperSettings({ ...superSettings, whatsappNumber: e.target.value })}
                      disabled={superSettingsLoading}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Namba hii itaonyeshwa kwenye skrini ya maduka yaliyofungwa ili wamiliki waweze kuwasiliana nawe kwa ajili ya malipo.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Kubadilisha Password ya Superadmin</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Password Mpya (New Password)</label>
                      <input 
                        type="password" 
                        className="form-input"
                        placeholder="Password mpya"
                        value={newSuperPassword}
                        onChange={(e) => setNewSuperPassword(e.target.value)}
                        disabled={superSettingsLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Thibitisha Password Mpya</label>
                      <input 
                        type="password" 
                        className="form-input"
                        placeholder="Thibitisha password"
                        value={confirmSuperPassword}
                        onChange={(e) => setConfirmSuperPassword(e.target.value)}
                        disabled={superSettingsLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={superSettingsLoading}
                style={{ width: '100%', maxWidth: '240px', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> {superSettingsLoading ? 'Inahifadhi...' : 'Hifadhi Mipangilio'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* --- ADD TENANT MODAL --- */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} className="anim-fade">
          <div className="glass" style={{ maxWidth: '600px', width: '100%', borderRadius: '12px', padding: '32px', overflowY: 'auto', maxHeight: '90vh' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Sajili Duka Jipya</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Weka taarifa za mteja ili kumuundia subdomain yake.</p>

            {modalError && (
              <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.2)', fontSize: '0.88rem', marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddTenant}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Subdomain (Herufi ndogo tu)</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', paddingRight: '12px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ border: 'none', background: 'transparent', margin: 0, flex: 1 }}
                      placeholder="k.m. dada"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>.mitindo.nyisu.com</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jina la Duka (Store Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="k.m. Dada Boutique"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Jina la Mmiliki (Owner Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="k.m. Anna Nyisu"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Namba (k.m. 255756670798)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="255..."
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Idadi ya Siku za Kuanza (Duration Days)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password ya Merchant Admin</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Password ya kuingia duka lake"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={modalLoading}>
                  Ghairi
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Inasajili...' : 'Kamilisha Usajili'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / EXTEND TENANT MODAL --- */}
      {showEditModal && selectedTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} className="anim-fade">
          <div className="glass" style={{ maxWidth: '600px', width: '100%', borderRadius: '12px', padding: '32px', overflowY: 'auto', maxHeight: '90vh' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Dhibiti Duka la "{selectedTenant.subdomain}"</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Badilisha mipangilio au ongeza muda wa duka la mteja.</p>

            {modalError && (
              <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.2)', fontSize: '0.88rem', marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditTenant}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Jina la Duka (Store Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jina la Mmiliki (Owner Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">WhatsApp Namba (Format: 255...)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editWhatsappNumber}
                    onChange={(e) => setEditWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hali ya Duka (Status)</label>
                  <select 
                    className="form-input" 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '100%', height: '48px', padding: '0 16px', borderRadius: '8px' }}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Active (Linafanya kazi)</option>
                    <option value="suspended">Suspended (Limesimamishwa)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ongeza Siku za Matumizi</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Siku zilizobaki: {selectedTenant.remainingDays}</span>
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Weka idadi ya siku k.m. 30"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Badilisha Password ya Merchant</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Weka password mpya ikiwa unataka kubadili"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={modalLoading}>
                  Ghairi
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Inahifadhi...' : 'Hifadhi Mabadiliko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
