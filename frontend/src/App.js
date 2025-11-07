import React from "react";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "rgba(255,255,255,0.98)",
          borderRadius: "14px",
          padding: "28px 24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Register</h2>
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "13px" }}>
            Please enter your details to sign up.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <label style={labelStyle}>
            Full Name
            <input type="text" placeholder="e.g., Emily Carter" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Email
            <input type="email" placeholder="example@mail.com" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Password
            <input type="password" placeholder="********" style={inputStyle} />
          </label>

          <button type="submit" style={buttonStyle}>
            Sign Up
          </button>

          <p style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "#374151",
  marginBottom: "10px",
};

const inputStyle = {
  width: "100%",
  marginTop: "6px",
  marginBottom: "14px",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
  transition: "box-shadow .15s, border-color .15s",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
};

export default App;
