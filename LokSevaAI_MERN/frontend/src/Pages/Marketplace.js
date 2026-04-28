import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Marketplace.css';
import { ShoppingBag, Plus, MapPin, Phone, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['All', 'Crops', 'Seeds', 'Tools', 'Livestock', 'Fertilizers'];

const Marketplace = ({ isDarkMode, language, dictionary }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Crops',
    price: '',
    unit: 'kg',
    quantity: '',
    description: '',
    location: '',
    image_url: 'https://images.unsplash.com/photo-1592982537447-6f296d194bea?auto=format&fit=crop&q=80&w=1000'
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (user?.id) {
      try {
        const res = await axios.get(`/api/users/profile?uid=${user.id}`);
        if (res.data.success) {
          setUserProfile(res.data.user);
          setNewProduct(prev => ({
            ...prev,
            location: res.data.user.district || ''
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/marketplace');
      if (res.data.success) {
        setProducts(res.data.products);
        setFilteredProducts(res.data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user || !userProfile) {
      alert("Please login and update your profile first.");
      return;
    }

    try {
      const productData = {
        ...newProduct,
        farmer_name: userProfile.full_name || user.email,
        farmer_phone: userProfile.phone || '',
        user_id: user.id
      };

      const res = await axios.post('/api/marketplace/add', productData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchProducts();
        setNewProduct({
          name: '',
          category: 'Crops',
          price: '',
          unit: 'kg',
          quantity: '',
          description: '',
          location: userProfile.district || '',
          image_url: 'https://images.unsplash.com/photo-1592982537447-6f296d194bea?auto=format&fit=crop&q=80&w=1000'
        });
      }
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product. Please check your network.");
    }
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div>
          <h1>{dictionary.market_title}</h1>
          <p className="market-subtitle">{dictionary.market_subtitle}</p>
        </div>
        <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          {dictionary.list_produce}
        </button>
      </header>

      <div className="market-filters">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{dictionary.loading_market}</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image-wrapper">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="img-fallback" style={{ display: 'none' }}>
                  <span>🌿</span>
                  <span>{product.category}</span>
                </div>
              </div>
              <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">
                  ₹{product.price} <span>/ {product.unit}</span>
                </div>
                <div className="product-location">
                  <MapPin size={14} />
                  {product.location}
                  {product.user_id === user?.id && (
                    <span className="owner-badge">{dictionary.your_listing}</span>
                  )}
                </div>
                <div className="farmer-details">
                   <div className="farmer-name">{product.farmer_name || 'Farmer'}</div>
                   <div className="farmer-contact">📞 {product.farmer_phone || 'No phone'}</div>
                </div>
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                <div className="product-actions">
                  <button 
                    className="contact-btn primary"
                    onClick={() => window.open(`tel:${product.farmer_phone}`)}
                  >
                    <Phone size={16} />
                    {dictionary.call}
                  </button>
                  <button 
                    className="contact-btn whatsapp"
                    onClick={() => {
                      let digits = (product.farmer_phone || "").replace(/\D/g, "");
                      if (digits.length === 10) digits = "91" + digits;
                      const msg = encodeURIComponent(`Hi, I saw your ${product.name} on KrishiSetu Marketplace. Is it still available?`);
                      window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
                    }}
                  >
                    <MessageSquare size={16} />
                    {dictionary.whatsapp}
                  </button>
                  {product.user_id === user?.id && (
                    <button 
                      className="contact-btn delete"
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this listing?")) {
                          try {
                            await axios.delete(`/api/marketplace/${product._id}`);
                            fetchProducts();
                          } catch (err) {
                            alert("Failed to delete.");
                          }
                        }
                      }}
                    >
                      <X size={16} />
                      {dictionary.remove}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#666' }}>
              {dictionary.no_products}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title">{dictionary.list_your_produce}</h2>
              <X className="close-icon" onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>{dictionary.product_name}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Organic Wheat" 
                  required 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }} className="form-group">
                <div style={{ flex: 1 }}>
                  <label>{dictionary.category}</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>{dictionary.quantity}</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    required 
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }} className="form-group">
                <div style={{ flex: 1 }}>
                  <label>{dictionary.price}</label>
                  <input 
                    type="number" 
                    placeholder="2500" 
                    required 
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>{dictionary.unit}</label>
                  <select 
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{dictionary.location}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pune" 
                  required 
                  value={newProduct.location}
                  onChange={e => setNewProduct({...newProduct, location: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>{dictionary.product_image}</label>
                <div className="image-upload-wrapper">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="file-input"
                    id="product-image-upload"
                  />
                  <label htmlFor="product-image-upload" className="file-label">
                    {newProduct.image_url.startsWith('data:') ? `✅ ${dictionary.image_selected}` : `📁 ${dictionary.upload_photo}`}
                  </label>
                  {newProduct.image_url.startsWith('data:') && (
                    <img src={newProduct.image_url} alt="Preview" className="upload-preview" />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>{dictionary.description}</label>
                <textarea 
                  rows="3" 
                  placeholder="Quality details, harvest date, etc."
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>{dictionary.cancel}</button>
                <button type="submit" className="btn-primary">{dictionary.post_listing}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
