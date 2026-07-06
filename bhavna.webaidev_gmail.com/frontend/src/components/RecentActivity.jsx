function RecentActivity({
  activities
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
        padding: "30px",
        borderRadius: "24px",
        marginBottom: "30px",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.35)"
      }}
    >
      <h2
        style={{
          marginBottom: "25px",
          fontSize: "1.6rem",
          fontWeight: "700"
        }}
      >
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#64748b"
          }}
        >
          <h3
            style={{
              marginBottom: "10px",
              color: "#94a3b8"
            }}
          >
            No Activity Yet
          </h3>

          <p>
            Connect your wallet and
            perform staking transactions
            to view activity history.
          </p>
        </div>
      ) : (
        activities.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              padding: "18px 0",
              borderBottom:
                index !==
                activities.length - 1
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "none"
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: "600"
                }}
              >
                {item.type}
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px"
                }}
              >
                {item.time}
              </div>
            </div>

            <div
              style={{
                color: item.color,
                fontWeight: "700"
              }}
            >
              {item.amount}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default RecentActivity;