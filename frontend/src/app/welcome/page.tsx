"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import './welcome.css';

export default function WelcomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token found, redirect to login
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Don't render anything until we verify authentication
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
        </div>
      </div>
    </>
  );
}
