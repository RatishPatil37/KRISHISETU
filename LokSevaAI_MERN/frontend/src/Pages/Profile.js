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
    incomeClass: '',
    language: 'english'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

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
      setProfile(prev => ({ ...prev, ...response.data }));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If user doesn't exist in MongoDB, set basic info from auth
      setProfile(prev => ({
        ...prev,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || ''
      }));
      setIsLoading(false);
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
    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/profile', profile);
      setProfile(response.data);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
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
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Schemes
          </button>
          <h1>My Profile</h1>
        </div>
        <div className="profile-content">
          <div className="message error">
            You must be logged in to view your profile. Please log in first.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Schemes
        </button>
        <h1>My Profile</h1>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              disabled
              className="disabled-input"
            />
            <small>This field cannot be edited</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={profile.age}
              onChange={handleInputChange}
              disabled={!isEditing}
              min="1"
              max="120"
              placeholder="Enter your age"
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <select
              id="state"
              name="state"
              value={profile.state}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="">Select your state</option>
              {stateOptions.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="incomeClass">Income Class</label>
            <select
              id="incomeClass"
              name="incomeClass"
              value={profile.incomeClass}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="">Select income class</option>
              {incomeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Preferred Language</label>
            <select
              id="language"
              name="language"
              value={profile.language}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <button type="button" onClick={() => setIsEditing(true)} className="edit-btn">
                Edit Profile
              </button>
            ) : (
              <>
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;