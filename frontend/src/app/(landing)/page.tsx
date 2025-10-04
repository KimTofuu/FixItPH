import Image from 'next/image';
import Link from 'next/link';
import './fixit-css.css';

export default function Home() {
  return (
    <>
      <header>
        <nav>
          <Image 
            src="/images/Fix-it_logo_3.png" 
            alt="Fixit Logo"
            className="logo"
            width={160} 
            height={40} 
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
              <h1>Empowering citizens, <br /> improving communities.</h1>
              <p>The app for citizens to report local issues, track repairs, and improve communities together.</p>
              {/* This button is now correctly linked to the register page */}
              <Link href="/register">
                <button className="register-btn">Register</button>
              </Link>
          </div>
        </div>
      </div>


      <div id="about">
        <h1> About FixitPH </h1>
        <div className='about_row'>
          <p> FixitPH is a community-driven platform that empowers citizens to take an active role in improving their neighborhoods. 
            Through the app, users can easily report local issues such as potholes, broken streetlights, flooding, or other public concerns. 
            Each report is tracked until resolution, allowing residents to stay updated on repair progress. <br /> <br/>

            By connecting citizens with local authorities, FixitPH promotes transparency, faster response times, and stronger collaboration. 
            Together, we can build safer, cleaner, and more sustainable communities.</p>
          <Image
            src="/images/mockup-laptop.png"
            alt="FixitPH Laptop Mockup"
            width={800}    
            height={600}   
            className="laptop"
          />
        </div>
      </div>


      <div id="services">
        <h1> Services </h1>
        <div className='services_row1'> 
          <div className='services_card'>
            <Image
              src="/images/report_icon.png"
              alt="FixitPH Report Icon"
              width={190}    
              height={190}   
              className="service_image"
            />
            <p>Issue Reporting</p>
          </div>
          <div className='services_card'>
            <Image
              src="/images/tracking-icon.png"
              alt="FixitPH Track Icon"
              width={190}    
              height={190}   
              className="service_image"
            />
            <p>Real-Time Tracking</p>
          </div>
          <div className='services_card'>
            <Image
              src="/images/community-icon.png"
              alt="FixitPH Community Engagement Icon"
              width={190}    
              height={190}   
              className="service_image"
            />
            <p>Community Engagement</p>
          </div>
          <div className='services_card'>
            <Image
              src="/images/notification-icon.png"
              alt="FixitPH Notification and Alerts Icon"
              width={190}    
              height={190}   
              className="service_image"
            />
            <p>Notifications & Alerts</p>
          </div>
        </div>
      </div>
  
    </>
  );
}