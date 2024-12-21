// Install dependencies with: npm install react-router-dom axios

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li>
      </ul>
    </nav>
  );
}

function LandingPage() {
  return <h1>Welcome to the Real-Time Collaboration Tool</h1>;
}

function Login() {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const { email, password } = event.target.elements;
    try {
      const response = await axios.post("http://localhost:5000/login", {
        email: email.value,
        password: password.value,
      });
      alert(response.data.message);
    } catch (err) {
      alert("Login failed: " + err.response.data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <label>Email: <input type="email" name="email" /></label>
      <label>Password: <input type="password" name="password" /></label>
      <button type="submit">Login</button>
    </form>
  );
}

function Register() {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const { name, email, password } = event.target.elements;
    try {
      const response = await axios.post("http://localhost:5000/register", {
        name: name.value,
        email: email.value,
        password: password.value,
      });
      alert(response.data.message);
    } catch (err) {
      alert("Registration failed: " + err.response.data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <label>Name: <input type="text" name="name" /></label>
      <label>Email: <input type="email" name="email" /></label>
      <label>Password: <input type="password" name="password" /></label>
      <button type="submit">Register</button>
    </form>
  );
}

export default App;
