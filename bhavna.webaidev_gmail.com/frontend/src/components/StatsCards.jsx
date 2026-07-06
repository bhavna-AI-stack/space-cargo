function StatsCards({
  walletBalance,
  balance,
  reward
}) {
  const cardStyle = {
    background: "rgba(17,24,39,0.8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "28px",
    borderRadius: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(250px,1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}
    >
      {/* Wallet Balance */}

      <div
        className="stats-card"
        style={cardStyle}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            marginBottom: "10px"
          }}
        >
          Wallet Balance
        </p>

        <h1
          style={{
            color: "#38bdf8",
            margin: 0,
            fontSize: "2rem",
            fontWeight: "700"
          }}
        >
          {walletBalance || "0.0000"}
        </h1>

        <small
          style={{
            color: "#64748b"
          }}
        >
          Available SCAI
        </small>
      </div>

      {/* Total Staked */}

      <div
        className="stats-card"
        style={cardStyle}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            marginBottom: "10px"
          }}
        >
          Total Staked
        </p>

        <h1
          style={{
            color: "#22c55e",
            margin: 0,
            fontSize: "2rem",
            fontWeight: "700"
          }}
        >
          {balance || "0.0000"}
        </h1>

        <small
          style={{
            color: "#64748b"
          }}
        >
          Staked SCAI
        </small>
      </div>

      {/* Rewards */}

      <div
        className="stats-card"
        style={cardStyle}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            marginBottom: "10px"
          }}
        >
          Rewards Earned
        </p>

        <h1
          style={{
            color: "#facc15",
            margin: 0,
            fontSize: "2rem",
            fontWeight: "700"
          }}
        >
          {reward || "0.0000"}
        </h1>

        <small
          style={{
            color: "#64748b"
          }}
        >
          Pending Rewards
        </small>
      </div>
    </div>
  );
}

export default StatsCards;