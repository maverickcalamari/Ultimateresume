
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectUri = params.get("redirect_uri") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, redirect_uri: redirectUri }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate(data.redirectUri || "/");
    } else {
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
