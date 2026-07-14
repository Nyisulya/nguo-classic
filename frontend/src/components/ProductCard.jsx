import React from 'react';
import { ShoppingBag, Eye } from 'lucide-react';

export default function ProductCard({ product, onQuickView, settings }) {
  const currencySymbol = settings?.currency || 'Tsh';
  const phone = settings?.whatsappNumber || '255712345678';
  
  // Format price with comma separators
  const formatPrice = (p) => {
    return new Intl.NumberFormat().format(p);
  };

  const handleWhatsAppOrder = (e) => {
    e.stopPropagation();
    
    const storeUrl = window.location.origin;
    const fullImageUrl = `${storeUrl}${product.imageUrl}`;
    
    const message = `Habari ${settings?.storeName || 'VaziVibe Boutique'}! Naomba kuagiza vazi hili:\n\n*Bidhaa:* ${product.title}\n*Bei:* ${formatPrice(product.price)} ${currencySymbol}\n*Aina:* ${product.category}\n*Picha:* ${fullImageUrl}\n\nJe, bado ipo?`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="product-card anim-fade">
      <div className="product-image-container" onClick={() => onQuickView(product)}>
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="product-image" 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop';
          }}
        />
        <div className="product-badge">Jipya</div>
      </div>
      
      <div className="product-info">
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <span className="product-price">{formatPrice(product.price)} {currencySymbol}</span>
        </div>
        
        <h3 className="product-title">{product.title}</h3>
        <p className="product-desc-preview">{product.description || 'Hakuna maelezo zaidi.'}</p>
        
        <div className="product-sizes">
          {product.sizes && product.sizes.length > 0 ? (
            product.sizes.map((size) => (
              <span key={size} className="size-tag">{size}</span>
            ))
          ) : (
            <span className="size-tag">Free Size</span>
          )}
        </div>
        
        <div className="product-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => onQuickView(product)}
            style={{ padding: '10px 16px' }}
          >
            <Eye size={16} /> Angalia
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleWhatsAppOrder}
            style={{ padding: '10px 16px' }}
          >
            <ShoppingBag size={16} /> Agiza
          </button>
        </div>
      </div>
    </div>
  );
}
