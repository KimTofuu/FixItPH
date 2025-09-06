"use client"; 

import Image from 'next/image';
import Link from 'next/link'; // Import Link
import { useState } from 'react';
import '../fixit-css.css';

export default function LoginPage() {
  const [isResident, setIsResident] = useState(true);

  const toggleForm = () => {
    setIsResident(!isResident);
  };

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix t_5.png" alt="Fixit Logo" className="logo" width={150} height={50} />
          <ul className="nav-list">
            <li>
              {/* This is the corrected Back button link */}
              <Link href="/" style={{ marginRight: '2rem' }}>
                <button className="back-btn">Back</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div id="header-text">
        <div className="container">
          <div className="row">
            <div className="col_2">
              <Image src="/images/community_5.png" alt="Community illustration" width={500} height={500} />
            </div>

            <div className="col_1">
              <div className="login-container">
                <h1 id="form-title">{isResident ? 'Resident Login' : 'Admin Login'}</h1>

                <form id="resident-form" className={isResident ? 'active' : ''}>
                  <input type="text" placeholder="Resident Username" required />
                  <input type="password" placeholder="Password" required />
                  <button type="submit">Log in</button>
                </form>

                <form id="admin-form" className={!isResident ? 'active' : ''}>
                  <input type="text" placeholder="Admin Username" required />
                  <input type="password" placeholder="Password" required />
                  <button type="submit">Log in</button>
                </form>
                
                <div className="toggle" onClick={toggleForm}>
                  {isResident ? 'Switch to Admin Login' : 'Switch to Resident Login'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}