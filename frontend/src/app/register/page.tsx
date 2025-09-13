"use client"; 

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../fixit-css.css'; // This path is correct for a file in src/app/register/

async function registerUser(formData: {
  fName: string;
  lName: string;
  email: string;
  password: string;
  confirmPassword: string;
  barangay: string;
  municipality: string;
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registerUser(form);
    // handle result (show message, redirect, etc.)
    alert(result.message || "Registration complete!");
    // Optionally redirect here
  };

  return (
    <>
      <header>
        <nav>
          <Image src="/images/Fix t_5.png" alt="Fixit Logo" className="logo" width={150} height={50} />
          <ul className="nav-list">
            <li>
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
                <form onSubmit={handleSubmit}>
                  <input name="fName" type="text" placeholder="First Name" value={form.fName} onChange={handleChange} required />
                  <input name="lName" type="text" placeholder="Last Name" value={form.lName} onChange={handleChange} required />
                  <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                  <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
                  <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
                  <input name="barangay" type="text" placeholder="Barangay" value={form.barangay} onChange={handleChange} required />
                  <input name="municipality" type="text" placeholder="Municipality" value={form.municipality} onChange={handleChange} required />
                  <input type="tel" id="contact" name="contact" placeholder="Enter contact number" pattern="[0-9]{10,15}" required />
                  <button type="submit">Register</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
