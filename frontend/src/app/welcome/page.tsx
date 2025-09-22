"use client";

import Image from 'next/image';
import Link from 'next/link';
import '../fixit-css.css';

export default function WelcomePage() {
  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
        </nav>
      </header>

      <div className="welcome">
        <div className="welcome-container">
          <h1>Welcome, Resident!</h1>
          <p>You have successfully logged in.</p>
          <p>This is your dashboard page.</p>
          <Link href="/user-map">
                <button className="continue-btn">Continue</button>
          </Link>
        </div>
      </div>
    </>
  );
}
