import Image from 'next/image';
import Link from 'next/link';
import './fixit-css.css';

export default function Home() {
  return (
    <>
      <header>
        <nav>
          <Image 
            src="/images/Fix t_5.png" 
            alt="Fixit Logo"
            className="logo"
            width={150} 
            height={50} 
          />
          <ul className="nav-list">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li>
              <Link href="/login" style={{ marginRight: '2rem' }}>
                <button className="login-btn">Log In</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      
      <div id="header-text">
        <div className="container">
          <div className="row">
            <div className="col_2">
              <Image 
                src="/images/community_5.png"
                alt="Community illustration"
                width={500}
                height={500}
              />
            </div>

            <div className="col_1">
              <h1>Empowering citizens, <br /> improving communities.</h1>
              <p>The app for citizens to report local issues, track repairs, and improve communities together.</p>
              {/* This button is now correctly linked to the register page */}
              <Link href="/register">
                <button className="register-btn">Register</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}