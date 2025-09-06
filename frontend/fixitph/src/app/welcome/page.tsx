"use client";

import Image from 'next/image';
import Link from 'next/link';
import '../fixit-css.css';

export default function WelcomePage() {
  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix t_5.png" alt="Fixit Logo" className="logo" width={150} height={50} />
          <ul className="nav-list">
            <li>
            
              <Link href="/" style={{ marginRight: '2rem' }}>
                <button className="back-btn">Logout</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', textAlign: 'center' }}>
        <div>
          <h1>Welcome, Resident!</h1>
          <p>You have successfully logged in.</p>
          <p>This is your dashboard page.</p>
        </div>
      </div>
    </>
  );
}
