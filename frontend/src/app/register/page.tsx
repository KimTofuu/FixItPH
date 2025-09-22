"use client"; 

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../fixit-css.css'; 

async function registerUser(formData: {
  fName: string;
  lName: string;
  email: string;
  password: string;
  confirmPassword: string;
  barangay: string;
  municipality: string;
  contact: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  return res.json();
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    fName: '',
    lName: '',
    email: '',
    password: '',
    confirmPassword: '',
    barangay: '',
    municipality: '',
    contact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registerUser(form);
    alert(result.message || "Registration complete!");
  };

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix-it_logo_2.png" alt="Fixit Logo" className="logo" width={160} height={40} />
          <ul className="nav-list">
            <li>
              <Link href="/" style={{ marginRight: '2rem' }}>
                <button className="back-btn">Back</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

    
      <div className="register">
        <div className="register-container">
          <h1 id="form-title">Register</h1>
          <form onSubmit={handleSubmit}>
            <input name="fName" type="text" placeholder="First Name" value={form.fName} onChange={handleChange} required />
            <input name="lName" type="text" placeholder="Last Name" value={form.lName} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
            <input name="barangay" type="text" placeholder="Barangay" value={form.barangay} onChange={handleChange} required />
            <input name="municipality" type="text" placeholder="Municipality" value={form.municipality} onChange={handleChange} required />
            <input type="tel" id="contact" name="contact" placeholder="Enter contact number" pattern="[0-9]{10,15}" value={form.contact} onChange={handleChange} required />
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </>
  );
}
