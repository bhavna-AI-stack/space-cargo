import { CONTRACT_ADDRESS } from "../contract";

function NetworkInfo({ account }) {
  return (
  <div
    style={{
      background: "rgba(17,24,39,0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "30px",
      borderRadius: "24px",
      marginBottom: "30px"
    }}
  >
    <h2
      style={{
        marginBottom: "20px"
      }}
    >
      Protocol Overview
    </h2>

    {!account ? (
      <p
        style={{
          color: "#94a3b8"
        }}
      >
        Connect your wallet to view
        protocol information.
      </p>
    ) : (
      <>
  <p
    style={{
      marginBottom: "20px"
    }}
  >
    <strong>Network:</strong>
    {" "}SecureChain AI
  </p>

  <p
    style={{
      marginBottom: "20px"
    }}
  >
    <strong>Chain ID:</strong>
    {" "}34
  </p>

  <p
    style={{
      marginBottom: "20px"
    }}
  >
    <strong>Status:</strong>
    {" "}Connected
  </p>

  <p
    style={{
      marginBottom: "0",
      wordBreak: "break-all"
    }}
  >
    <strong>Contract Address:</strong>
    <span
      style={{
        color: "#38bdf8"
      }}
    >
      {" "}
      {CONTRACT_ADDRESS.slice(0, 10)}
      ...
      {CONTRACT_ADDRESS.slice(-8)}
    </span>
  </p>
</>
    )}
  </div>
);
}

export default NetworkInfo;