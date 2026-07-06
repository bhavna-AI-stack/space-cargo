function Footer() {
  return (
    <footer
      style={{
        marginTop: "60px",
        paddingTop: "30px",
        borderTop:
          "1px solid rgba(255,255,255,0.08)",
        textAlign: "center"
      }}
    >
      <h2
        style={{
          color: "#38bdf8",
          marginBottom: "10px"
        }}
      >
        EtherAuthority
      </h2>

      <p
        style={{
          color: "#94a3b8",
          maxWidth: "600px",
          margin: "0 auto"
        }}
      >
        Secure decentralized staking platform
        powered by SecureChain AI Mainnet.
      </p>

      <p
        style={{
          marginTop: "20px",
          color: "#64748b"
        }}
      >
        © 2026 EtherAuthority
      </p>
    </footer>
  );
}

export default Footer;