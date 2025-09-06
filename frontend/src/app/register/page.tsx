"use client"; 

import Image from 'next/image';
import Link from 'next/link';
import '../fixit-css.css'; // This path is correct for a file in src/app/register/

export default function RegisterPage() {
  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix t_5.png" alt="Fixit Logo" className="logo" width={150} height={50} />
          <ul className="nav-list">
            <li>
              {/* Back button now correctly links to the homepage */}
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
              <div className="register-container">
                <h1 id="form-title">Register</h1>

                <form>
                  {/* Input tags must be self-closing (/>) */}
                  <input type="text" placeholder="First Name" required />
                  <input type="text" placeholder="Last Name" required />
                  <input type="text" placeholder="Barangay" required />
                  <input type="text" placeholder="Municipality" required />
                  <input type="text" placeholder="Username" required />
                  <input type="password" placeholder="Password" required />
                  <input type="password" placeholder="Confirm Password" required />
                  <Link href="/welcome">
                  <button type="submit">Register</button>
                  </Link>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
