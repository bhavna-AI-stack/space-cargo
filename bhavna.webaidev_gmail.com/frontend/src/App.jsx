import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "./contract";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import StatsCards from "./components/StatsCards";
import StakePanel from "./components/StakePanel";
import NetworkInfo from "./components/NetworkInfo";
import Footer from "./components/Footer";
import RecentActivity from "./components/RecentActivity";

function App() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [reward, setReward] = useState("");
  const [walletBalance, setWalletBalance] =
    useState("");
  const [activities, setActivities] =
  useState([]);
   const hasMetaMask = !!window.ethereum;
  async function connectWallet() {

  if (!window.ethereum) {

    toast.warning(
      "MetaMask is not installed. Please install MetaMask."
    );

    return;
  }

  try {

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    const accounts =
      await provider.send(
        "eth_requestAccounts",
        []
      );

    setAccount(accounts[0]);

    toast.success(
      `Connected: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`
    );

    await getWalletBalance();
    await checkBalance();
    await checkReward();

  } catch (error) {

    console.error(
      "Wallet Connection Error:",
      error
    );

    toast.error(
      "Failed to connect wallet."
    );
  }
}

async function stakeETH() {
  try {
    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    const signer =
      await provider.getSigner();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

    const tx =
      await contract.stake({
        value:
          ethers.parseEther(amount)
      });

      await tx.wait();
      setActivities(prev => [
        {
          type: "Stake SCAI",
          amount: `+${amount} SCAI`,
          time: "Just now",
          color: "#22c55e"
        },
        ...prev
      ]);
      
      toast.success(
  "Stake Successful"
);

    await getWalletBalance();
    await checkBalance();
    await checkReward();

  } catch (error) {

  console.error("STAKE ERROR:", error);

  toast.error(
    error.reason ||
    error.shortMessage ||
    error.message ||
    "Stake Failed"
  );

}
}
  async function withdrawETH() {
    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const contract =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          signer
        );

      const tx =
        await contract.withdraw(
          ethers.parseEther(amount)
        );

      await tx.wait();

      setActivities(prev => [
        {
          type: "Withdraw SCAI",
          amount: `-${amount} SCAI`,
          time: "Just now",
          color: "#ef4444"
        },
        ...prev
      ]);

      toast.success("Withdraw Successful");

      await getWalletBalance();
      await checkBalance();
      await checkReward();

    } catch (error) {

  console.error("WITHDRAW ERROR:", error);

  toast.error(
    error.reason ||
    error.shortMessage ||
    error.message ||
    "Withdraw Failed"
  );

}
  }
  async function claimReward() {
  try {

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    const signer =
      await provider.getSigner();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

    const tx =
      await contract.claimReward();

    await tx.wait();
    setActivities(prev => [
  {
    type: "Claim Reward",
    amount: `+${reward} SCAI`,
    time: "Just now",
    color: "#facc15"
  },
  ...prev
]);

    toast.success("Reward Claimed");

    await getWalletBalance();
    await checkReward();

  } catch (error) {

    console.error(error);

    toast.error("Claim Failed");

  }
}
  
  async function checkBalance() {
    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const userAddress =
        await signer.getAddress();

      const contract =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          provider
        );

      const bal =
        await contract.getBalance(
          userAddress
        );

      setBalance(
        Number(
          ethers.formatEther(bal)
        ).toFixed(4)
      );

    } catch (error) {
      console.error(error);
    }
  }

  async function checkReward() {
    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const userAddress =
        await signer.getAddress();

      const contract =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          provider
        );

      const rew =
        await contract.calculateReward(
          userAddress
        );

      setReward(
        Number(
          ethers.formatEther(rew)
        ).toFixed(4)
      );

    } catch (error) {
      console.error(error);
    }
  }

  async function getWalletBalance() {
    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const bal =
        await provider.getBalance(
          await signer.getAddress()
        );

      setWalletBalance(
        Number(
          ethers.formatEther(bal)
        ).toFixed(4)
      );

    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div
  style={{
    minHeight:"100vh",
    background:
      "radial-gradient(circle at top,#0f172a,#020617)",
    color:"white"
  }}
>
      <Navbar
        account={account}
        connectWallet={connectWallet}
      />


      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "30px"
        }}
      >
        <div
  style={{
    background:
      "linear-gradient(135deg,#0f172a,#1e293b)",
    padding: "50px",
    borderRadius: "30px",
    marginBottom: "30px",
    textAlign: "center",
    border:
      "1px solid rgba(255,255,255,0.08)"
  }}
>
  <h1
  style={{
    fontSize: "3rem",
    fontWeight: "900",
    letterSpacing: "-0.5px",
    textTransform: "uppercase",
    color: "#38bdf8",
    marginBottom: "15px"
  }}
>
  DeFi Staking
</h1>

<p
  style={{
    color: "#94a3b8",
    fontSize: "18px",
    marginBottom: "25px"
  }}
>
  Stake SCAI, earn rewards, and manage
your staking position on SecureChain AI Mainnet.
</p>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap"
  }}
>
</div>
</div>

        <StatsCards
          walletBalance={walletBalance}
          balance={balance}
          reward={reward}
        />

        <StakePanel
          amount={amount}
          setAmount={setAmount}
          stakeETH={stakeETH}
          withdrawETH={withdrawETH}
          claimReward={claimReward}
        />

        <RecentActivity
          activities={activities}
        />

        <NetworkInfo account={account} />

        <Footer />
        <ToastContainer
        position="top-right"
        autoClose={3000}
          />
      </div>
    </div>
  );
}

export default App;