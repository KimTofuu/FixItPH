"use client"; 

import Image from 'next/image';
import Link from 'next/link'; // Import Link
import { useState } from 'react';
import '../fixit-css.css';
import { useRouter } from 'next/navigation';

async function loginUser(formData: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  return res.json();
}

export default function LoginPage() {
  const [form, setForm] = useState({
      email: '',
      password: '',
    });

    const router = useRouter();
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await loginUser(form);
      if (result.token) {
        router.push('/user-feed');
      } else {
        alert(result.message || "Login failed");
      }
    };
  const [isResident, setIsResident] = useState(true);

  const toggleForm = () => {
    setIsResident(!isResident);
  };

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
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

     
            <div className="login">
              <div className="login-container">
                <h1 id="form-title">{isResident ? 'Resident Login' : 'Admin Login'}</h1>

                <form id="resident-form" className={isResident ? 'active' : ''} onSubmit={handleSubmit}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Resident Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
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
    </>
  );
}