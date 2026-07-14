import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';

export default function ProductModal({ product, onClose, settings }) {
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );

  const currencySymbol = settings?.currency || 'Tsh';
  const phone = settings?.whatsappNumber || '255712345678';

  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  const handleOrder = () => {
    const storeUrl = window.location.origin;
    const fullImageUrl = `${storeUrl}${product.imageUrl}`;
    
    let message = `Habari ${settings?.storeName || 'VaziVibe Boutique'}! Naomba kuagiza vazi hili:\n\n*Bidhaa:* ${product.title}\n*Bei:* ${formatPrice(product.price)} ${currencySymbol}\n*Aina:* ${product.category}`;
    
    if (selectedSize) {
      message += `\n*Saizi Iliyochaguliwa:* ${selectedSize}`;
    }
    
    message += `\n*Picha:* ${fullImageUrl}\n\nJe, bado ipo na saizi hii inapatikana?`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="product-detail-grid">
          <div className="modal-image-container">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="modal-image"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop';
              }}
            />
          </div>
          
          <div className="modal-body">
            <span className="modal-category">{product.category}</span>
            <h2 className="modal-title">{product.title}</h2>
            <div className="modal-price">{formatPrice(product.price)} {currencySymbol}</div>
            
            <h4 className="modal-section-title">Maelezo ya Nguo</h4>
            <p className="modal-desc">{product.description || 'Bidhaa hii ina ubora wa hali ya juu na imetengenezwa kwa nyenzo za kudumu na nzuri. Wasiliana nasi kupata maelezo zaidi.'}</p>
            
            {product.sizes && product.sizes.length > 0 && (
              <>
                <h4 className="modal-section-title">Chagua Saizi yako</h4>
                <div className="size-selector">
                  {product.sizes.map((size) => (
                    <button 
                      key={size} 
                      className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <button 
              className="btn btn-primary" 
              onClick={handleOrder}
              style={{ marginTop: 'auto', width: '100%', padding: '16px' }}
            >
              <ShoppingBag size={20} /> Agiza Kupitia WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
