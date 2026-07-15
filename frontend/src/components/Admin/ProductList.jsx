import React, { useState } from 'react';
import { Plus, Edit, Trash, Upload, X, Search, Shirt } from 'lucide-react';

export default function ProductList({ products, loading, error, token, refreshProducts, settings }) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Women');
  const [description, setDescription] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const categories = ['Men', 'Women', 'Accessories', 'Shoes', 'Unisex'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  const currencySymbol = settings?.currency || 'Tsh';

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitle('');
    setPrice('');
    setBuyingPrice('');
    setStock('');
    setCategory('Women');
    setDescription('');
    setSelectedSizes([]);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setPrice(product.price);
    setBuyingPrice(product.buyingPrice !== undefined ? product.buyingPrice : '');
    setStock(product.stock !== undefined ? product.stock : '');
    setCategory(product.category);
    setDescription(product.description || '');
    setSelectedSizes(product.sizes || []);
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setFormError('');
    setShowModal(true);
  };

  const handleSizeToggle = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Je, una uhakika unataka kufuta bidhaa hii? Kitendo hiki hakirudishwi.')) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Imefeli kufuta bidhaa.');
      }
      
      refreshProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price || !category) {
      setFormError('Jaza Jina, Bei, na Aina ya bidhaa.');
      return;
    }

    if (!editingProduct && !imageFile) {
      setFormError('Tafadhali chagua picha ya bidhaa.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      formData.append('buyingPrice', buyingPrice || 0);
      formData.append('stock', stock || 0);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('sizes', JSON.stringify(selectedSizes));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
        
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Imefeli kuhifadhi bidhaa.');
      }

      setShowModal(false);
      refreshProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  return (
    <div className="anim-fade">
      <div className="admin-header">
        <div>
          <h2>Usimamizi wa Nguo</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Futa, hariri au ongeza nguo mpya dukani.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Ongeza Nguo Mpya
        </button>
      </div>

      {/* Search Filter for Products */}
      <div className="form-group" style={{ position: 'relative', maxWidth: '350px', marginBottom: '24px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Tafuta hapa..." 
          style={{ paddingLeft: '40px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Inapakia bidhaa...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: '20px' }}>Hitilafu: {error}</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <Shirt size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Hakuna nguo iliyopatikana</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Bonyeza "Ongeza Nguo Mpya" kuanza.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Picha</th>
                <th>Jina la Nguo</th>
                <th>Aina</th>
                <th>Bei ya Kuuza</th>
                <th>Bei ya Mtaji</th>
                <th>Stoki Store</th>
                <th>Saizi</th>
                <th style={{ textAlign: 'right' }}>Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="admin-thumbnail" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&auto=format&fit=crop';
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{product.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.description || 'Hakuna maelezo.'}
                    </div>
                  </td>
                  <td>
                    <span className="size-tag" style={{ background: 'rgba(197, 168, 128, 0.1)', color: 'var(--accent)', border: 'none' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatPrice(product.price)} {currencySymbol}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {formatPrice(product.buyingPrice || 0)} {currencySymbol}
                  </td>
                  <td>
                    {product.stock !== undefined ? (
                      product.stock <= 0 ? (
                        <span style={{ color: '#ff6b6b', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', padding: '2px 6px', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '4px' }}>
                          Imeisha (0)
                        </span>
                      ) : product.stock <= 3 ? (
                        <span style={{ color: '#ff9f43', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', padding: '2px 6px', background: 'rgba(255, 159, 67, 0.1)', borderRadius: '4px' }}>
                          Pungufu ({product.stock})
                        </span>
                      ) : (
                        <span style={{ color: '#28a745', fontWeight: '600', fontSize: '0.85rem', padding: '2px 6px', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '4px' }}>
                          {product.stock}
                        </span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map(size => (
                          <span key={size} style={{ fontSize: '0.7rem', padding: '2px 5px', border: '1px solid rgba(255,255,255,0.05)', background: '#1c1c1c', borderRadius: '3px' }}>
                            {size}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mmoja tu</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleOpenEdit(product)}
                      >
                        <Edit size={14} /> Hariri
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash size={14} /> Futa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            
            <div style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
                {editingProduct ? 'Hariri Bidhaa' : 'Ongeza Bidhaa Mpya'}
              </h3>
              
              {formError && (
                <div style={{ padding: '12px 16px', background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: '1px solid rgba(220, 53, 69, 0.2)', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '20px' }}>
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Jina la Nguo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Mfano: Blauz ya Hariri, Suruali ya Jeans"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={formLoading}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Bei ya Kuuza ({currencySymbol})</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Mfano: 25000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Bei ya Kununua/Mtaji ({currencySymbol})</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Mfano: 15000"
                      value={buyingPrice}
                      onChange={(e) => setBuyingPrice(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Stoki Iliyopo (Stock)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Mfano: 10"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Aina (Category)</label>
                    <select 
                      className="form-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={formLoading}
                      style={{ background: 'var(--bg-input)' }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Saizi Zinazopatikana</label>
                  <div className="size-checkbox-grid">
                    {availableSizes.map(size => (
                      <div key={size}>
                        <input 
                          type="checkbox" 
                          id={`size-${size}`}
                          className="size-checkbox-input"
                          checked={selectedSizes.includes(size)}
                          onChange={() => handleSizeToggle(size)}
                          disabled={formLoading}
                        />
                        <label htmlFor={`size-${size}`} className="size-checkbox-label">
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Maelezo (Description)</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Andika maelezo ya nguo hii (vifaa, urefu, n.k.)..."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={formLoading}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Picha ya Nguo</label>
                  <div className="image-upload-zone" onClick={() => document.getElementById('image-upload').click()}>
                    <Upload size={24} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bofya hapa kupakia picha</p>
                    <input 
                      type="file" 
                      id="image-upload" 
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={formLoading}
                    />
                    
                    {imagePreview && (
                      <div>
                        <img src={imagePreview} alt="Preview" className="image-upload-preview" />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setShowModal(false)}
                    disabled={formLoading}
                  >
                    Ghairi
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Inahifadhi...' : 'Hifadhi Bidhaa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
