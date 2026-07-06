function StakePanel({
  amount,
  setAmount,
  stakeETH,
  withdrawETH,
  claimReward
}) {
  return (
    <div
      style={{
        background:
          "rgba(17,24,39,0.85)",
        backdropFilter:
          "blur(12px)",
        border:
          "1px solid rgba(255,255,255,0.08)",
        padding: "35px",
        borderRadius: "24px",
        marginBottom: "30px",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.35)"
      }}
    >
      <h2
        style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          marginBottom: "10px"
        }}
      >
        Stake SCAI
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "25px"
        }}
      >
        Deposit SCAI into the staking pool and earn rewards over time.
      </p>

      <div
        style={{
          background: "#0f172a",
          border:
            "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "25px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: "12px"
          }}
        >
          <span
            style={{
              color: "#94a3b8"
            }}
          >
            Amount SCAI
          </span>

          <span
            style={{
              color: "#38bdf8"
            }}
          >
            SCAI
          </span>
        </div>

        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "2rem",
            fontWeight: "700"
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: "15px"
        }}
      >
        <button
          onClick={stakeETH}
          style={{
            padding: "16px",
            background:
              "linear-gradient(90deg,#2563eb,#06b6d4)",
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Stake
        </button>

        <button
          onClick={withdrawETH}
          style={{
            padding: "16px",
            background:
              "rgba(220,38,38,0.15)",
            border:
              "1px solid rgba(220,38,38,0.3)",
            borderRadius: "14px",
            color: "#ef4444",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Withdraw
        </button>

        <button
          onClick={claimReward}
          style={{
            padding: "16px",
            background:
              "rgba(250,204,21,0.15)",
            border:
              "1px solid rgba(250,204,21,0.3)",
            borderRadius: "14px",
            color: "#facc15",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Claim Reward
        </button>
      </div>

      <div
        style={{
          marginTop: "25px",
          paddingTop: "20px",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent:
            "space-between",
          color: "#94a3b8"
        }}
      >
        <span>Minimum Stake</span>

        <span>Any Amount</span>
      </div>
    </div>
  );
}

export default StakePanel;