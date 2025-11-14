import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Giriş başarılı!");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom, #007bff 50%, #ffb400 50%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Basketbol topu - sağ üst */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "12%",
          width: "120px",
          height: "120px",
          opacity: "0.9",
          fontSize: "120px",
        }}
      >
        🏀
      </div>

      {/* Voleybol topu - sol üst */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "120px",
          height: "120px",
          opacity: "0.9",
          fontSize: "120px",
        }}
      >
        🏐
      </div>

      {/* Futbol topu - sol alt */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "8%",
          width: "130px",
          height: "130px",
          opacity: "0.9",
          fontSize: "130px",
        }}
      >
        ⚽
      </div>

      {/* Tenis topu - sağ alt */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "110px",
          height: "110px",
          opacity: "0.9",
          fontSize: "110px",
        }}
      >
        🎾
      </div>

      {/* Login kutusu */}
      <div
        style={{
          backgroundColor: "white",
          padding: "50px",
          borderRadius: "20px",
          boxShadow: "0 0 30px rgba(0,0,0,0.2)",
          width: "350px",
          zIndex: 2,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#333",
            marginBottom: "25px",
            fontWeight: "700",
          }}
        >
          Giriş Yap
        </h2>

        <label style={{ display: "block", marginTop: "10px" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "15px",
            boxSizing: "border-box",
          }}
        />

        <label style={{ display: "block", marginTop: "15px" }}>Şifre</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "25px",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
        >
          Giriş Yap
        </button>

        <p style={{ textAlign: "center", marginTop: "12px" }}>
          <a
            href="/register"
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            Hesabın yok mu? Kayıt ol
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;