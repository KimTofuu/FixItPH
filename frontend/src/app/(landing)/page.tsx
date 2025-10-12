"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./LandingPage.module.css"; 

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.landingPage}>
      <header>
        <nav className={styles.nav}>
          <Image 
            src="/images/Fix-it_logo_3.png" 
            alt="Fixit Logo"
            className={styles.logo}
            width={160} 
            height={40} 
          />

          {/* Burger Icon */}
          <div 
            className={`${styles.burger} ${menuOpen ? styles.open : ""}`} 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* Nav List */}
          <ul className={`${styles.navList} ${menuOpen ? styles.active : ""}`}>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
            <li><a href="#services" onClick={() => setMenuOpen(false)}>Services</a></li>
            <li>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <button className={styles.loginBtn}>Log In</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      
      <section id="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Empowering citizens, <br /> improving communities.</h1>
          <p>The app for citizens to report local issues, track repairs, and improve communities together.</p>
          <Link href="/register">
            <button className={styles.registerBtn}>Register</button>
          </Link>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <h1> About FixitPH </h1>
        <div className={styles.aboutRow}>
          <p>
            FixitPH is a community-driven platform that empowers citizens to take an active role in improving their neighborhoods. 
            Through the app, users can easily report local issues such as potholes, broken streetlights, flooding, or other public concerns. 
            Each report is tracked until resolution, allowing residents to stay updated on repair progress. <br /><br/>
            By connecting citizens with local authorities, FixitPH promotes transparency, faster response times, and stronger collaboration. 
            Together, we can build safer, cleaner, and more sustainable communities.
          </p>
          <Image
            src="/images/mockup-laptop.png"
            alt="FixitPH Laptop Mockup"
            width={800}    
            height={600}   
            className={styles.laptop}
          />
        </div>
      </section>

      <section id="services" className={styles.services}>
        <h1> Services </h1>
        <div className={styles.servicesRow}>
          <div className={styles.servicesCard}>
            <Image src="/images/report_icon.png" alt="Report" width={120} height={120} className={styles.serviceImage}/>
            <p>Issue Reporting</p>
          </div>
          <div className={styles.servicesCard}>
            <Image src="/images/tracking-icon.png" alt="Tracking" width={120} height={120} className={styles.serviceImage}/>
            <p>Real-Time Tracking</p>
          </div>
          <div className={styles.servicesCard}>
            <Image src="/images/community-icon.png" alt="Community" width={120} height={120} className={styles.serviceImage}/>
            <p>Community Engagement</p>
          </div>
          <div className={styles.servicesCard}>
            <Image src="/images/notification-icon.png" alt="Notifications" width={120} height={120} className={styles.serviceImage}/>
            <p>Notifications & Alerts</p>
          </div>
        </div>
      </section>
    </div>
  );
}
