import { useState } from "react";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (newToken, user) => {
    setToken(newToken);
    setUsername(user);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername("");
  };

  if (!token) {
    return showRegister ? (
      <Register
        switchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLogin={handleLogin}
        switchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <Dashboard
      token={token}
      username={username}
      onLogout={handleLogout}
    />
  );
}

export default App;