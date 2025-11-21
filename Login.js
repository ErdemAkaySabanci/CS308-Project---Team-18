import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // API integration will be added later
    alert("Login successful!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #2D5FFF 0%, #FF7A00 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "20px",
      }}
    >
      {/* Login Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "48px 40px",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            color: "#1A1A1A",
            marginBottom: "32px",
            fontWeight: "700",
            fontSize: "28px",
            letterSpacing: "-0.5px",
          }}
        >
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#1A1A1A",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid #E0E0E0",
                fontSize: "15px",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2D5FFF";
                e.target.style.boxShadow = "0 0 0 3px rgba(45, 95, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E0E0E0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#1A1A1A",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid #E0E0E0",
                fontSize: "15px",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2D5FFF";
                e.target.style.boxShadow = "0 0 0 3px rgba(45, 95, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E0E0E0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: "#2D5FFF",
              border: "none",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(45, 95, 255, 0.3)",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#1E4FE0";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(45, 95, 255, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#2D5FFF";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(45, 95, 255, 0.3)";
            }}
          >
            Login
          </button>
        </form>

        {/* Register Link */}
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#666666",
            fontSize: "14px",
          }}
        >
          Don't have an account?{" "}
          <a
            href="/register"
            style={{
              color: "#2D5FFF",
              textDecoration: "none",
              fontWeight: "600",
              transition: "color 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.color = "#FF7A00")}
            onMouseOut={(e) => (e.target.style.color = "#2D5FFF")}
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
