"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import './welcome.css';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    barangay: '',
    municipality: '',
    contact: '',
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const isNew = searchParams.get('new');
    
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      window.history.replaceState({}, '', '/welcome');
      setIsAuthenticated(true);
      
      // Show profile form for new Google users
      if (isNew === 'true') {
        checkProfileCompletion();
      }
    } else {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
        checkProfileCompletion();
      }
    }
  }, [router, searchParams]);

  const checkProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const user = await res.json();
        // Show form if barangay or municipality is missing
        if (!user.barangay || !user.municipality) {
          setShowProfileForm(true);
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        toast.success('Profile completed!');
        setShowProfileForm(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className="logo" width={160} height={40} />
        </nav>
      </header>

      <div className="welcome">
        <div className="welcome-container">
          {showProfileForm ? (
            <>
              <h1>Complete Your Profile</h1>
              <form onSubmit={handleProfileSubmit} style={{ marginTop: '20px' }}>
                <input
                  type="text"
                  placeholder="Barangay"
                  value={profileData.barangay}
                  onChange={(e) => setProfileData({ ...profileData, barangay: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <input
                  type="text"
                  placeholder="Municipality"
                  value={profileData.municipality}
                  onChange={(e) => setProfileData({ ...profileData, municipality: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <input
                  type="tel"
                  placeholder="Contact Number (Optional)"
                  value={profileData.contact}
                  onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <button type="submit" className="continue-btn">Complete Profile</button>
                <button 
                  type="button" 
                  onClick={() => setShowProfileForm(false)}
                  style={{ marginLeft: '10px' }}
                  className="continue-btn"
                >
                  Skip for Now
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Welcome, Resident!</h1>
              <p>With FixItPH, you can: <br/>
                <span>
                  Report local issues like potholes, flooding, and broken streetlights<br/>
                  Track the status of your reports<br/>
                  View community updates and resolutions
                </span>
              </p>
              <Link href="/user-map">
                <button className="continue-btn">Continue</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
