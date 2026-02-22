import { useState } from "react";
import axios from "axios";
import "./login.css"; // reuse same styling

export default function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/register`, {
        username,
        password,
      });

      alert("Account created successfully!");
      switchToLogin(); // go back to login screen
    } catch (err) {
      alert("User already exists");
    }
  };

  return (
    <div className="login-container">
      <div className="overlay"></div>

      <div className="login-card">
        <h1>Create Account</h1>

        <form onSubmit={handleRegister}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Register</button>
        </form>

        <p className="register-link" onClick={switchToLogin}>
          Back to Login
        </p>
      </div>
    </div>
  );
}