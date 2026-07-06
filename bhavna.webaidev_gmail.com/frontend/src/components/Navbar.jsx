function Navbar({ account, connectWallet }) {
  
  return (
    <nav
      style={{
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        padding: "16px 50px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      {/* Logo */}
      <div>
        <img
        src="/logo.png"
        alt="EtherAuthority"
        style={{
        height: "85px",
        width: "auto",
        objectFit: "contain",
        filter:
        "brightness(1.25) drop-shadow(0 0 10px rgba(56,189,248,0.6))"
      }}
      />
      </div>

      {/* Wallet Section */}
      {!account ? (
        <button
          onClick={connectWallet}
          style={{
            background:
              "linear-gradient(135deg,#2563eb,#06b6d4)",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            transition: "all 0.3s ease"
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div
          style={{
            background:
              "rgba(56,189,248,0.1)",
            border:
              "1px solid #38bdf8",
            padding: "12px 18px",
            borderRadius: "999px",
            color: "#38bdf8",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          {account.slice(0, 6)}
          ...
          {account.slice(-4)}
        </div>
      )}
    </nav>
  );
}

export default Navbar;