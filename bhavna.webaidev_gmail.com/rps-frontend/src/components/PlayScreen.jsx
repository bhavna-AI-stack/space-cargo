import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

function shortenAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function GameScreen({
  account,
  walletBalance,
  rewards,
  minimumBet,
  withdrawThreshold,
  withdrawFee,
  appStatus,
  connectWallet,
  refreshWalletData,
  onBackHome
}) {
  const [betAmount, setBetAmount] = useState("");
  const [move1, setMove1] = useState(null);
  const [move2, setMove2] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [activeGame, setActiveGame] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [pendingMoves, setPendingMoves] = useState(null);
  const [opponentMoves, setOpponentMoves] = useState(null);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showRecentGames, setShowRecentGames] = useState(false);

  const moves = ["Rock", "Paper", "Scissors"];
  const resultText = ["Loss", "Win", "Tie"];

  const minBetNumber = Number(minimumBet || 0);
  const rewardsNumber = Number(rewards || 0);
  const thresholdNumber = Number(withdrawThreshold || 0);
  const hasBetAmount = betAmount !== "";
  const betNumber = Number(betAmount);
  const isBetValid =
    hasBetAmount && Number.isFinite(betNumber) && betNumber >= minBetNumber;

  const canWithdraw = useMemo(
    () => rewardsNumber >= thresholdNumber && thresholdNumber > 0,
    [rewardsNumber, thresholdNumber]
  );

  function setUiStatus(message, type = "info") {
    setStatus(message);
    setStatusType(type);
  }

  function formatEth(value) {
    return Number(value).toFixed(4);
  }

  function persistPendingMoves(address, m1, m2) {
    if (!address) return;
    localStorage.setItem(`rps-pending-${address.toLowerCase()}`, JSON.stringify([m1, m2]));
  }

  function readPendingMoves(address) {
    if (!address) return null;
    const raw = localStorage.getItem(`rps-pending-${address.toLowerCase()}`);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2) return parsed;
    } catch {
      return null;
    }
    return null;
  }

  function clearPendingMoves(address) {
    if (!address) return;
    localStorage.removeItem(`rps-pending-${address.toLowerCase()}`);
  }

  function persistOpponentMoves(address, movesValue) {
    if (!address || !movesValue) return;
    localStorage.setItem(`rps-opponent-${address.toLowerCase()}`, JSON.stringify(movesValue));
  }

  function readOpponentMoves(address) {
    if (!address) return null;
    const raw = localStorage.getItem(`rps-opponent-${address.toLowerCase()}`);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2) return parsed;
    } catch {
      return null;
    }
    return null;
  }

  function clearOpponentMoves(address) {
    if (!address) return;
    localStorage.removeItem(`rps-opponent-${address.toLowerCase()}`);
  }

  async function refreshGameData() {
    if (!account) return;

    setIsLoadingGameData(true);
    try {
      const contract = await getContract();
      const [game, countRaw] = await Promise.all([
        contract.games(account),
        contract.gameCounts(account)
      ]);

      if (game.active) {
        const rememberedMoves = readPendingMoves(account);
        const rememberedOpponent = readOpponentMoves(account);
        if (rememberedMoves) setPendingMoves(rememberedMoves);
        if (rememberedOpponent) setOpponentMoves(rememberedOpponent);
        setActiveGame({
          betAmount: ethers.formatEther(game.betAmount),
          playerMoves: rememberedMoves || [0, 1],
          contractMoves: rememberedOpponent || null
        });
      } else {
        setActiveGame(null);
        setPendingMoves(null);
        setOpponentMoves(null);
        clearPendingMoves(account);
        clearOpponentMoves(account);
      }

      const gameCount = Number(countRaw);
      const fetchCount = Math.min(gameCount, 5);
      const latestGames = [];

      for (let i = 0; i < fetchCount; i++) {
        const index = (gameCount - 1 - i + 5) % 5;
        const g = await contract.recentGames(account, index);

        latestGames.push({
          playerMove: Number(g.playerMove),
          opponentMove: Number(g.opponentMove),
          result: Number(g.result),
          betAmount: ethers.formatEther(g.betAmount)
        });
      }

      setRecentGames(latestGames);
    } catch (err) {
      console.error(err);
      setUiStatus("Failed to refresh on-chain game state", "error");
    } finally {
      setIsLoadingGameData(false);
    }
  }

  async function startGame() {
    setIsStarting(true);

    try {
      if (!betAmount || move1 === null || move2 === null) {
        setUiStatus("Enter a bet and choose two different moves", "error");
        return;
      }

      if (move1 === move2) {
        setUiStatus("Your first and second moves must be different", "error");
        return;
      }

      const betNumber = Number(betAmount);
      if (!Number.isFinite(betNumber) || betNumber < minBetNumber) {
        setUiStatus(`Minimum bet is ${minimumBet} ETH`, "error");
        return;
      }

      if (activeGame) {
        setUiStatus("Finish your active game before starting another", "error");
        return;
      }

      const contract = await getContract();
      const provider = contract.runner.provider;

      // 🔴 TREASURY CHECK START
      const treasuryBalance = await provider.getBalance(contract.target);
      const betWei = ethers.parseEther(betAmount);
      const maxPossibleReward = betWei * 2n; // worst case win

      if (treasuryBalance < maxPossibleReward) {
        setUiStatus("Treasury cannot cover 2x reward. Try smaller bet.", "error");
        return;
      }
      // 🔴 TREASURY CHECK END

      const tx = await contract.startGame(move1, move2, {
        value: betWei
      });

      setUiStatus("Starting game...", "info");
      const receipt = await tx.wait();

      let startedOpponentMoves = null;

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "GameStarted") {
            startedOpponentMoves = Array.from(
              parsed.args.contractMoves,
              (v) => Number(v)
            );
            break;
          }
        } catch {
          // ignore non-contract logs
        }
      }

      persistPendingMoves(account, move1, move2);
      setPendingMoves([move1, move2]);

      if (startedOpponentMoves) {
        persistOpponentMoves(account, startedOpponentMoves);
        setOpponentMoves(startedOpponentMoves);
      }

      setMove1(null);
      setMove2(null);
      setBetAmount("");

      await Promise.all([
        refreshGameData(),
        refreshWalletData(account)
      ]);

      setUiStatus(
        "Game started. Choose your final move to finish.",
        "success"
      );

    } catch (err) {
      console.error(err);
      setUiStatus("Start game transaction failed", "error");
    } finally {
      setIsStarting(false);
    }
  }


  async function finishGame(index) {
    setIsFinishing(true);
    try {
      if (!activeGame) {
        setUiStatus("No active game found", "error");
        return;
      }

      const contract = await getContract();
      const tx = await contract.finishGame(index);

      setUiStatus("Finishing game...", "info");
      const receipt = await tx.wait();

      let resultMessage = "Game finished.";
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "GameFinished") {
            const playerMove = Number(parsed.args.playerFinalMove);
            const opponentMove = Number(parsed.args.opponentFinalMove);
            const result = Number(parsed.args.result);

            resultMessage = `Result: ${resultText[result]} (${moves[playerMove]} vs ${moves[opponentMove]})`;
            break;
          }
        } catch {
          // ignore logs from other contracts
        }
      }

      await Promise.all([refreshGameData(), refreshWalletData(account)]);
      setUiStatus(resultMessage, "success");
      clearPendingMoves(account);
      clearOpponentMoves(account);
      setPendingMoves(null);
      setOpponentMoves(null);
    } catch (err) {
      console.error(err);
      setUiStatus("Finish game transaction failed", "error");
    } finally {
      setIsFinishing(false);
    }
  }

  async function withdrawRewards() {
    setIsWithdrawing(true);
    try {
      if (!canWithdraw) {
        setUiStatus(
          `Withdraw is available after ${withdrawThreshold} ETH rewards`,
          "error"
        );
        return;
      }

      const contract = await getContract();
      const tx = await contract.withdraw();

      setUiStatus("Withdrawing rewards...", "info");
      await tx.wait();

      await Promise.all([refreshGameData(), refreshWalletData(account)]);
      setUiStatus("Withdraw successful", "success");
    } catch (err) {
      console.error(err);
      setUiStatus("Withdraw failed", "error");
    } finally {
      setIsWithdrawing(false);
    }
  }

  useEffect(() => {
    if (!account) {
      setActiveGame(null);
      setRecentGames([]);
      setPendingMoves(null);
      setOpponentMoves(null);
      setShowRecentGames(false);
      return;
    }
    const rememberedMoves = readPendingMoves(account);
    const rememberedOpponent = readOpponentMoves(account);
    if (rememberedMoves) setPendingMoves(rememberedMoves);
    if (rememberedOpponent) setOpponentMoves(rememberedOpponent);
    setShowRecentGames(false);
    refreshGameData();
  }, [account]);

  useEffect(() => {
    const isGameView = Boolean(account);
    const shouldLockScroll = isGameView && !showRecentGames && !activeGame;
    document.body.classList.toggle("gameView", isGameView);
    document.body.classList.toggle("gameNoScroll", shouldLockScroll);

    return () => {
      document.body.classList.remove("gameView");
      document.body.classList.remove("gameNoScroll");
    };
  }, [account, showRecentGames, activeGame]);

  return (
    <div className={`gameApp ${account ? "gameAppCompact" : ""}`}>
      <img src="/logo.png" className="game-title" alt="Rock Paper Scissors Minus One" />
      <button className="secondaryBtn homeBackBtn" onClick={onBackHome}>
        Back to Home
      </button>

      {appStatus && <p className="statusBadge statusError">{appStatus}</p>}

      <div className={`card walletCard ${!account ? "walletCardDisconnected" : ""}`}>
        {!account ? (
          <>
            <div className="walletSummary walletSummaryConnect">
              <button className="pillButton" onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>

            <h3 className="gameconnect">Connect wallet to play</h3>
          </>
        ) : (
          <>
            <div className="contractDet">
              <p className="walletSectionTitle">Game Limits</p>
              <p><b>Minimum Bet:</b> {minimumBet} ETH</p>
              <p><b>Withdraw Threshold:</b> {withdrawThreshold} ETH</p>
              <p><b>Withdraw Fee:</b> {withdrawFee}%</p>
            </div>

            <div className="walletSummary">
              <button className="pillButton connected">
                {shortenAddress(account)}
              </button>
              <div className="walletStats">
                <p className="userBalance"><b>Balance:</b> {formatEth(walletBalance)} ETH</p>
                <p className="userBalance"><b>Rewards:</b> {formatEth(rewards)} ETH</p>
              </div>
            </div>
          </>
        )}
      </div>

      {account && (
        <>
          <div className="card gameCard">
            <h3>Place Bet</h3>
            <input
              type="number"
              min={minimumBet}
              step="0.001"
              placeholder="Bet in ETH"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className={`betInput ${hasBetAmount ? (isBetValid ? "betInputValid" : "betInputInvalid") : ""}`}
              disabled={Boolean(activeGame) || isStarting}
            />

            <h3>Select First Move</h3>
            <div className="moveGrid">
              {moves.map((m, i) => (
                <button
                  key={`first-${i}`}
                  className={`moveCard ${move1 === i ? "selected" : ""}`}
                  onClick={() => setMove1(i)}
                  disabled={Boolean(activeGame) || isStarting}
                >
                  {m}
                </button>
              ))}
            </div>

            <h3>Select Second Move</h3>
            <div className="moveGrid">
              {moves.map((m, i) => (
                <button
                  key={`second-${i}`}
                  className={`moveCard ${move2 === i ? "selected" : ""}`}
                  onClick={() => setMove2(i)}
                  disabled={Boolean(activeGame) || isStarting}
                >
                  {m}
                </button>
              ))}
            </div>

            {(status || isLoadingGameData) && (
              <p className={`statusBadge ${statusType === "error" ? "statusError" : statusType === "success" ? "statusSuccess" : "statusInfo"}`}>
                {isLoadingGameData ? "Refreshing game data..." : status}
              </p>
            )}

            {!activeGame && (
              <p className="hintText gameStatusText">No active game. Start a new round to continue.</p>
            )}

            <button className="primaryBtn" onClick={startGame} disabled={Boolean(activeGame) || isStarting}>
              {isStarting ? "Starting..." : "Start Game"}
            </button>

            {activeGame ? (
              <div className="activeGameBox">
                <h3>Active Game</h3>
                <p>Bet: {formatEth(activeGame.betAmount)} ETH</p>
                <p>
                  Your moves: {pendingMoves ? `${moves[pendingMoves[0]]}, ${moves[pendingMoves[1]]}` : "Move 1, Move 2"}
                </p>
                <p>
                  Opponent moves: {opponentMoves ? `${moves[opponentMoves[0]]}, ${moves[opponentMoves[1]]}` : "Not available yet"}
                </p>

                <div className="actionRow">
                  <button className="secondaryBtn" onClick={() => finishGame(0)} disabled={isFinishing}>
                    {isFinishing ? "Finishing..." : `Finish with ${pendingMoves ? moves[pendingMoves[0]] : "Move 1"}`}
                  </button>
                  <button className="secondaryBtn" onClick={() => finishGame(1)} disabled={isFinishing}>
                    {isFinishing ? "Finishing..." : `Finish with ${pendingMoves ? moves[pendingMoves[1]] : "Move 2"}`}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="withdrawRow">
              <div className="withdrawMeta">
                <span className="hintText">
                  {canWithdraw
                    ? "Withdraw available"
                    : `Need ${withdrawThreshold} ETH rewards to withdraw`}
                </span>
              </div>
              <button className="primaryBtn" onClick={withdrawRewards} disabled={!canWithdraw || isWithdrawing}>
                {isWithdrawing ? "Withdrawing..." : "Withdraw Rewards"}
              </button>
            </div>

            <button
              className="secondaryBtn recentGamesToggleBtn"
              onClick={() => setShowRecentGames((prev) => !prev)}
            >
              {showRecentGames ? "Hide Recent Games" : "Show Recent Games"}
            </button>

          </div>

          {showRecentGames && (
            <div className="card historyCard">
              <h3>Recent Games</h3>
              {recentGames.length === 0 ? (
                <p className="hintText gameStatusText">No completed rounds yet.</p>
              ) : (
                <div className="historyList">
                  {recentGames.map((game, idx) => (
                    <div className="historyItem" key={`${game.playerMove}-${game.opponentMove}-${idx}`}>
                      <span>#{idx + 1}</span>
                      <span>{moves[game.playerMove]} vs {moves[game.opponentMove]}</span>
                      <span>{formatEth(game.betAmount)} ETH</span>
                      <span className={game.result === 1 ? "statusSuccessText" : game.result === 2 ? "statusTieText" : "statusErrorText"}>
                        {resultText[game.result]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
