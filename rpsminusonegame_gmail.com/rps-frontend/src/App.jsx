import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import Home from "./components/HomePage";
import GameScreen from "./components/PlayScreen";
import {
  CONTRACT_ADDRESS,
  connectWalletProvider,
  ensureExpectedChain,
  getExpectedChainId,
  getContract,
  getProvider,
  getWalletEventProvider,
  hydrateWalletProvider
} from "./utils/contract";

function App() {
  const [started, setStarted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("rps-started") === "1";
  });

  const [account, setAccount] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");
  const [rewards, setRewards] = useState("0");
  const [minimumBet, setMinimumBet] = useState("0");
  const [withdrawThreshold, setWithdrawThreshold] = useState("0");
  const [withdrawFee, setWithdrawFee] = useState("0");
  const [appStatus, setAppStatus] = useState("");

  useEffect(() => {
    if (started) {
      localStorage.setItem("rps-started", "1");
      return;
    }
    localStorage.removeItem("rps-started");
  }, [started]);

  function clearWalletState() {
    setAccount("");
    setWalletBalance("0");
    setRewards("0");
    setMinimumBet("0");
    setWithdrawThreshold("0");
    setWithdrawFee("0");
  }

  const refreshWalletData = useCallback(async (address) => {
    try {
      const provider = await getProvider();
      const expectedChainId = getExpectedChainId();
      const network = await provider.getNetwork();
      const activeChainId = Number(network.chainId);

      if (activeChainId !== expectedChainId) {
        setAppStatus(
          "Please switch your wallet network to Sepolia."
        );
        return;
      }

      const contractCode = await provider.getCode(CONTRACT_ADDRESS);
      if (!contractCode || contractCode === "0x") {
        setAppStatus(
          "Game services are temporarily unavailable. Please try again later."
        );
        return;
      }

      const balance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));

      const contract = await getContract();

      const rewardValue = await contract.rewards(address);
      const minBet = await contract.minimumBet();
      const threshold = await contract.withdrawThreshold();
      let fee = 0n;
      let feeReadFailed = false;
      try {
        fee = await contract.withdrawFee();
      } catch (feeErr) {
        feeReadFailed = true;
        console.warn("withdrawFee() is unavailable on this deployment", feeErr);
        setAppStatus("Some game settings could not be loaded. You can still play.");
      }

      setRewards(ethers.formatEther(rewardValue));
      setMinimumBet(ethers.formatEther(minBet));
      setWithdrawThreshold(ethers.formatEther(threshold));
      setWithdrawFee(fee.toString());
      if (!feeReadFailed) {
        setAppStatus("");
      }
    } catch (err) {
      console.error(err);
      setAppStatus("Unable to load wallet data right now. Please try reconnecting.");
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const provider = await connectWalletProvider();
      await provider.send("eth_requestAccounts", []);
      await ensureExpectedChain();

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setAppStatus("");
      await refreshWalletData(address);
    } catch (err) {
      console.error(err);
      setAppStatus("Wallet connection failed. Please try again.");
    }
  }, [refreshWalletData]);

  useEffect(() => {
    let mounted = true;
    let removeListeners = null;

    async function hydrateWallet() {
      try {
        const provider = await hydrateWalletProvider();
        if (!provider) return;

        const accounts = await provider.send("eth_accounts", []);

        if (!mounted || accounts.length === 0) return;

        const address = accounts[0];
        setAccount(address);
        await refreshWalletData(address);

        const walletEvents = getWalletEventProvider();
        if (!walletEvents?.on) return;

        const handleAccountsChanged = async (nextAccounts) => {
          if (!mounted) return;

          if (!nextAccounts || nextAccounts.length === 0) {
            clearWalletState();
            return;
          }

          const nextAddress = nextAccounts[0];
          setAccount(nextAddress);
          await refreshWalletData(nextAddress);
        };

        const handleChainChanged = async () => {
          if (!mounted) return;
          const freshProvider = await getProvider();
          const nextAccounts = await freshProvider.send("eth_accounts", []);
          if (!nextAccounts || nextAccounts.length === 0) return;
          await refreshWalletData(nextAccounts[0]);
        };

        walletEvents.on("accountsChanged", handleAccountsChanged);
        walletEvents.on("chainChanged", handleChainChanged);

        removeListeners = () => {
          walletEvents.removeListener("accountsChanged", handleAccountsChanged);
          walletEvents.removeListener("chainChanged", handleChainChanged);
        };
      } catch (err) {
        console.error(err);
      }
    }

    hydrateWallet();

    return () => {
      mounted = false;
      if (removeListeners) removeListeners();
    };
  }, [refreshWalletData]);

  if (!started) {
    return <Home onStart={() => setStarted(true)} />;
  }

  return (
    <GameScreen
      account={account}
      walletBalance={walletBalance}
      rewards={rewards}
      minimumBet={minimumBet}
      withdrawThreshold={withdrawThreshold}
      withdrawFee={withdrawFee}
      appStatus={appStatus}
      connectWallet={connectWallet}
      refreshWalletData={refreshWalletData}
      onBackHome={() => setStarted(false)}
    />
  );
}

export default App;
