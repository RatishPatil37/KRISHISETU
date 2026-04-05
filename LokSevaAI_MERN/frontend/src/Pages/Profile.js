import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    phone: '',
    age: '',
    state: '',
    district: '',
    taluka: '',
    location: '',
    incomeClass: '',
    income_value: '',
    language: 'english'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/');
      return;
    }
    if (!authLoading && authUser) {
      fetchUserProfile();
    }
  }, [authUser, authLoading, navigate]);

  const fetchUserProfile = async () => {
    if (!authUser?.email) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/users/profile/${authUser.email}`);
      const data = response.data.user || response.data;
      
      setProfile(prev => ({ 
        ...prev, 
        ...data,
        name: data.name || data.full_name || prev.name, 
        location: data.location || data.village || prev.location
      }));
      setIsLoading(false);
      // Auto-edit if vital info is missing
      if (!data.phone || (!data.name && !data.full_name)) {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If user doesn't exist in MongoDB, set basic info from auth
      setProfile(prev => ({
        ...prev,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || ''
      }));
      setIsLoading(false);
      setIsEditing(true); // Automatically open edit window for new user
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
      setCaptchaError('Incorrect CAPTCHA answer. Please try again.');
      setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
      setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaInput('');
      return;
    }
    setCaptchaError('');
    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/profile', profile);
      const data = response.data.user || response.data;
      setProfile(prev => ({ ...prev, ...data }));
      setIsEditing(false);
      setMessage('Profile up to date! Redirecting...');
      setTimeout(() => navigate('/'), 1500); // Redirect to main dashboard
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const incomeOptions = [
    { value: 'BPL', label: 'Below Poverty Line' },
    { value: 'LIG', label: 'Low Income Group' },
    { value: 'MIG', label: 'Middle Income Group' },
    { value: 'HIG', label: 'High Income Group' }
  ];

  const stateOptions = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'हिंदी' },
    { value: 'marathi', label: 'मराठी' },
    { value: 'tamil', label: 'தமிழ்' },
    { value: 'telugu', label: 'తెలుగు' }
  ];

  if (authLoading || isLoading) {
    return <div className="profile-wrapper"><div className="loading">Loading profile...</div></div>;
  }

  if (!authUser) {
    return <div className="profile-wrapper"><div className="loading">Please log in from main page.</div></div>;
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-box">
        {/* Left Side: Aesthetic theme image */}
        <div className="profile-image-panel">
          <div className="overlay-text">
            <h2>Welcome to KrishiSetu</h2>
            <p>Your modern portal to agricultural prosperity and government schemes.</p>
          </div>
        </div>
        
        {/* Right Side: Form */}
        <div className="profile-form-section">
          <div className="profile-header">
            <button className="back-btn" onClick={() => navigate('/')}>
              ← Back to Schemes
            </button>
            <h1>My Profile</h1>
            <p className="profile-subtitle">Complete your details to unlock smart scheme recommendations.</p>
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="profile-content">
            <form onSubmit={handleSubmit} className="profile-form custom-grid-form">
              <div className="form-group full-width">
                <label>Locked Email</label>
                <input type="email" name="email" value={profile.email} disabled className="disabled-input input-field" />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={profile.name || ''} onChange={handleInputChange} disabled={!isEditing} required className="input-field" />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" value={profile.phone || ''} onChange={handleInputChange} disabled={!isEditing} required className="input-field" placeholder="10-digit mobile" />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={profile.age || ''} onChange={handleInputChange} disabled={!isEditing} min="1" max="120" className="input-field" placeholder="Years" />
              </div>

              <div className="form-group">
                <label>State</label>
                <select name="state" value={profile.state || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field">
                  <option value="">Select state</option>
                  {stateOptions.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>District</label>
                <input type="text" name="district" value={profile.district || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field" placeholder="Your district" />
              </div>

              <div className="form-group">
                <label>Taluka</label>
                <input type="text" name="taluka" value={profile.taluka || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field" placeholder="Your taluka" />
              </div>

              <div className="form-group">
                <label>Village / Location</label>
                <input type="text" name="location" value={profile.location || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field" placeholder="Your village" />
              </div>

              <div className="form-group">
                <label>Annual Income (₹)</label>
                <input type="number" name="income_value" value={profile.income_value || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field" placeholder="e.g. 120000" />
              </div>

              <div className="form-group">
                <label>Income Class</label>
                <select name="incomeClass" value={profile.incomeClass || ''} onChange={handleInputChange} disabled={!isEditing} className="input-field">
                  <option value="">Select income class</option>
                  {incomeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Language</label>
                <select name="language" value={profile.language || 'english'} onChange={handleInputChange} disabled={!isEditing} className="input-field">
                  {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              {isEditing && (
                <div className="form-group full-width captcha-section">
                  <label>Verification (CAPTCHA) *</label>
                  <p className="captcha-desc">Please solve this simple math puzzle so we know you are not a bot:</p>
                  <div className="captcha-row">
                    <span className="captcha-equation">{captchaNum1} + {captchaNum2} = </span>
                    <input 
                      type="number" 
                      value={captchaInput} 
                      onChange={(e) => setCaptchaInput(e.target.value)} 
                      required 
                      className="input-field captcha-input"
                      placeholder="?" 
                    />
                  </div>
                  {captchaError && <small className="error-text">{captchaError}</small>}
                </div>
              )}

              <div className="form-actions full-width">
                {!isEditing ? (
                  <button type="button" onClick={() => setIsEditing(true)} className="edit-btn btn">Edit Profile</button>
                ) : (
                  <>
                    <button type="button" onClick={() => {
                        setIsEditing(false);
                        setCaptchaError('');
                    }} className="cancel-btn btn">Cancel</button>
                    <button type="submit" className="save-btn btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save & Continue →'}</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;