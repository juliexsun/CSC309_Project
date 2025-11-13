import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3001/auth/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utorid, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Login failed");
        return;
      }

      const data = await response.json();
      // 保存 token
      localStorage.setItem("token", data.token);

      // 登录成功后跳转
      navigate("/");

    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin} style={{ maxWidth: "300px" }}>
        <label>UTORid</label>
        <input
          type="text"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
