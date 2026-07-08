import { useEffect, useState, useRef } from 'react';
import { useStore } from './store/useStore';
import { PhaserGame } from './game/PhaserGame';
import { Rocket, Coins, Trophy, Settings, LogOut, User, Pause, Play, Volume2, VolumeX, Music2, Music, Medal, Palette, Shield, Magnet, Gauge, Timer, ArrowDownToLine, Wallet, HelpCircle, ArrowRight, Check } from 'lucide-react';
import { useAccount, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, SPACE_CARGO_TOKEN_ABI } from './contracts/SpaceCargoToken';
import { useWalletModal } from './context/WalletModalContext';
import ProvenanceWalletModal from './components/ui/ProvenanceWalletModal';
import EditPilotModal from './components/ui/EditPilotModal';
import { socket, connectSocket } from './lib/socket';
import { BACKEND_URL } from './lib/config';
import type { UserProfile } from 'shared';
import './App.css';
import './styles/console.css';

interface AuthPayload {
  isGuest: true;
  userId?: string;
  username?: string;
}

function App() {
  const {
    gameState,
    distance,
    coinsCollected,
    cargoCollected,
    timeSurvived,
    bestScore,
    lastRunStats,
    failureReason,
    activePowerUp,
    soundEnabled,
    musicEnabled,
    achievements,
    missions,
    shipSkins,
    selectedSkinId,
    health,
    maxHealth,
    shieldLevel,
    fuel,
    maxFuel,
    fuelLevel,
    setGameState,
    resetRun,
    user,
    setUser,
    syncPlayerStats,
    upgradeShield,
    upgradeFuel,
    toggleSound,
    toggleMusic,
    selectSkin,
    gameConfig
  } = useStore();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [walletBound, setWalletBound] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const initAttempted = useRef(false);
  const { isWalletModalOpen, openWalletModal, closeWalletModal } = useWalletModal();
  const getPilotLevel = useStore((state) => state.getPilotLevel);
  const getXpProgress = useStore((state) => state.getXpProgress);
  const liveFeed = useStore((state) => state.liveFeed);
  const topRunners = useStore((state) => state.topRunners);
  const isBackendWakingUp = useStore((state) => state.isBackendWakingUp);
  const leaderboardError = useStore((state) => state.leaderboardError);
  const fetchLeaderboard = useStore((state) => state.fetchLeaderboard);
  const fetchLiveFeed = useStore((state) => state.fetchLiveFeed);
  const fetchGameConfig = useStore((state) => state.fetchGameConfig);
  const [showFirstRunBrief, setShowFirstRunBrief] = useState(() => localStorage.getItem('tutorialSeen') !== 'true');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const withdrawStatus = useStore((state) => state.withdrawStatus);
  const leaderboardPeriod = useStore((state) => state.leaderboardPeriod);
  const setLeaderboardPeriod = useStore((state) => state.setLeaderboardPeriod);
  const withdrawError = useStore((state) => state.withdrawError);
  const requestRewardSignature = useStore((state) => state.requestRewardSignature);
  const setWithdrawStatus = useStore((state) => state.setWithdrawStatus);

  const [scorePop, setScorePop] = useState(false);
  const prevScoreRef = useRef(0);

  useEffect(() => {
    const currentScore = distance + coinsCollected * 10 + cargoCollected * 25 + timeSurvived;
    if (currentScore > prevScoreRef.current) {
      setScorePop(true);
      const timer = setTimeout(() => setScorePop(false), 150);
      prevScoreRef.current = currentScore;
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = currentScore;
  }, [distance, coinsCollected, cargoCollected, timeSurvived]);

  // On-chain SCR token balance
  const { data: onChainBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SPACE_CARGO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Contract write for claiming rewards
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Handle successful transaction confirmation
  useEffect(() => {
    if (isTxSuccess) {
      setWithdrawStatus('success');
      refetchBalance();
      setWithdrawAmount('');
      // Auto-reset status after 5 seconds
      const timer = setTimeout(() => setWithdrawStatus('idle'), 5000);
      return () => clearTimeout(timer);
    }
  }, [isTxSuccess]);

  // Handle withdrawal submission
  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < gameConfig.minClaimAmount) {
      setWithdrawStatus('error', `Minimum withdrawal is ${gameConfig.minClaimAmount} coins`);
      return;
    }

    const result = await requestRewardSignature(amount);
    if (result.success && result.tokenAmount && result.signature !== undefined && result.nonce !== undefined) {
      try {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: SPACE_CARGO_TOKEN_ABI,
          functionName: 'claimReward',
          args: [BigInt(result.tokenAmount), BigInt(result.nonce), result.signature as `0x${string}`],
        });
      } catch (e: any) {
        setWithdrawStatus('error', e.message || 'Transaction failed');
      }
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchLiveFeed();
    fetchGameConfig();
    
    const handleScoreUpdated = (updatedUser: UserProfile) => {
      // Use get() to avoid dependency array stale closures
      const currentUser = useStore.getState().user;
      if (currentUser && updatedUser.id === currentUser.id) {
        useStore.getState().setUser(updatedUser);
      }
      useStore.getState().pushToLiveFeed(updatedUser);
    };

    socket.on('scoreUpdated', handleScoreUpdated);

    return () => {
      socket.off('scoreUpdated', handleScoreUpdated);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const state = useStore.getState().gameState;
        if (state === 'PLAYING') {
          useStore.getState().setGameState('PAUSED');
        } else if (state === 'PAUSED') {
          useStore.getState().setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Guest User
  useEffect(() => {
    if (!user && !initAttempted.current) {
      initAttempted.current = true;
      const initGuest = async () => {
        try {
          const storedGuestId = localStorage.getItem('guestId');
          const storedUserId = localStorage.getItem('userId');
          
          const payload: AuthPayload = { isGuest: true };
          if (storedUserId) payload.userId = storedUserId;
          else if (storedGuestId) payload.username = storedGuestId;

          const backendUrl = BACKEND_URL;
          const res = await fetch(`${backendUrl}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success && data.user) {
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('guestId', data.user.username); // Keep for legacy
            setUser(data.user);
            syncPlayerStats(data.user);
            connectSocket();
          } else {
            throw new Error('Backend auth failed: ' + (data.message || 'No user returned'));
          }
        } catch (e) {
          console.warn('[offline] backend unreachable — Failed to init guest from backend. Falling back to offline mode.');
          // Offline Fallback so the game doesn't permanently lock out
          const offlineUser = {
            id: 'offline-' + Math.random().toString(36).substring(2, 9),
            username: 'Offline Pilot',
            coins: 0,
            highScore: 0,
            shipEngineLevel: 1,
            shipHandlingLevel: 1,
            shipShieldLevel: 1,
            walletAddress: undefined,
            xp: 0
          };
          setUser(offlineUser);
        }
      };
      initGuest();
    }
  }, [user, setUser]);

  useEffect(() => {
    // If a wallet is connected and we haven't bound it to this session user yet
    if (isConnected && address && user && !walletBound) {
      const bindWallet = async () => {
        try {
          const backendUrl = BACKEND_URL;
          const res = await fetch(`${backendUrl}/api/wallet/bind`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, walletAddress: address })
          });
          const data = await res.json();
          if (data.success && data.user) {
            console.log('Wallet bound successfully:', data.user.walletAddress);
            localStorage.setItem('userId', data.user.id);
            setUser(data.user);
            setWalletBound(true);
            syncPlayerStats(data.user);
          } else {
            throw new Error('Backend wallet bind failed: ' + (data.message || 'No user returned'));
          }
        } catch (e) {
          console.warn('[offline] backend unreachable — Failed to bind wallet. Falling back to offline mode.', e);
          setUser({ ...user, walletAddress: address as string, username: 'Linked Pilot' });
          setWalletBound(true);
        }
      };
      bindWallet();
    }
  }, [isConnected, address, user, walletBound]);

  const handleStart = () => {
    localStorage.setItem('tutorialSeen', 'true');
    setShowFirstRunBrief(false);
    resetRun();
    setGameState('PLAYING');
  };

  const handleOpenLeaderboard = () => {
    fetchLeaderboard();
    setGameState('LEADERBOARD');
  };

  const handleDismissBrief = () => {
    localStorage.setItem('tutorialSeen', 'true');
    setShowFirstRunBrief(false);
  };

  const displayedRun = lastRunStats || {
    finalScore: distance + coinsCollected * 10 + cargoCollected * 25 + timeSurvived,
    bestScore,
    distance,
    coins: coinsCollected,
    cargo: cargoCollected,
    timeSurvived,
    achievementNames: []
  };

  const hudScore = distance + coinsCollected * 10 + cargoCollected * 25 + timeSurvived;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const PowerIcon = activePowerUp?.type === 'Shield' ? Shield : activePowerUp?.type === 'Magnet' ? Magnet : activePowerUp?.type === 'Slow Motion' ? Gauge : Timer;
  const screenClass = `screen-${gameState.toLowerCase().replaceAll('_', '-')}`;

  return (
    <>
      <PhaserGame />
      
      <div className={`console-overlay ${screenClass}`}>
        
        {/* Top Cockpit Bar: HUD & Player ID */}
        <div className="hud-cockpit">
          <div className="hud-top-container">
            <div className="hud-cluster" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <>
                  <div className="hud-bars" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* HULL */}
                    <div className={`hud-item ${health <= (maxHealth * 0.25) ? 'status-warning' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <div className="hud-label-container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} className="text-secondary" />
                          <span className="hide-on-mobile" style={{ fontSize: '0.7rem', color: '#8899b5', letterSpacing: '1px' }}>HULL</span>
                        </div>
                        <div className={health <= (maxHealth * 0.25) ? 'status-warning-text' : ''} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {health}/{maxHealth} HP
                        </div>
                      </div>
                      <div className="health-bar-container" style={{ width: '100%' }}>
                        <div 
                          className="health-bar-fill" 
                          style={{ width: `${(health / maxHealth) * 100}%`, background: health <= (maxHealth * 0.25) ? '#ff3366' : 'var(--primary)' }}
                        ></div>
                      </div>
                    </div>

                    {/* FUEL */}
                    <div className={`hud-item ${fuel <= (maxFuel * 0.25) ? 'status-warning' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <div className="hud-label-container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gauge size={14} className="text-primary" />
                          <span className="hide-on-mobile" style={{ fontSize: '0.7rem', color: '#8899b5', letterSpacing: '1px' }}>FUEL</span>
                        </div>
                        <div className={fuel <= (maxFuel * 0.25) ? 'status-warning-text' : ''} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {Math.floor(fuel)}/{maxFuel} EU
                        </div>
                      </div>
                      <div className="fuel-bar-container" style={{ width: '100%' }}>
                        <div className="fuel-bar-fill" style={{ width: `${(fuel / maxFuel) * 100}%`, background: fuel <= (maxFuel * 0.25) ? '#ff3366' : '#00aaff' }}></div>
                      </div>
                    </div>

                    {/* EXPERIENCE/RANK */}
                    <div className="hud-item" style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <div className="hud-label-container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <Medal size={14} className="text-primary" />
                           <span className="hide-on-mobile" style={{ fontSize: '0.7rem', color: '#00ffcc', letterSpacing: '1px' }}>RANK</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00ffcc' }}>LVL {getPilotLevel()}</span>
                      </div>
                      <div className="fuel-bar-container" style={{ width: '100%' }}>
                        <div className="xp-bar-fill" style={{ width: `${getXpProgress()}%` }}></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* New Top-Center Score Dashboard */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <div className="hud-dashboard-center">
                <div className="hud-item hud-mini-stat" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <Rocket className="text-primary" size={14} />
                  <span className="stat-value">{Math.floor(distance)}m</span>
                </div>
                <div className="hud-item hud-mini-stat" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <Coins className="text-secondary" color="var(--primary)" size={14} />
                  <span className="stat-value">{coinsCollected}</span>
                </div>
                <div className="hud-item hud-mini-stat" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <Trophy className="text-primary" size={14} />
                  <strong className={`stat-value ${scorePop ? 'score-pop' : ''}`}>{hudScore}</strong>
                </div>
                {activePowerUp && (
                  <div className="powerup-pill" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <PowerIcon size={18} color="var(--primary)" />
                    <span style={{ color: 'var(--primary)' }}>{activePowerUp.type}</span>
                    <strong style={{ color: 'var(--primary)' }}>{Math.ceil(activePowerUp.remainingMs / 1000)}s</strong>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <div className="quick-controls console-interactive">
            <button className="icon-btn" title={gameState === 'PAUSED' ? 'Resume' : 'Pause'} onClick={() => setGameState(gameState === 'PAUSED' ? 'PLAYING' : 'PAUSED')}>
              {gameState === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button className="icon-btn" title={soundEnabled ? 'Sound off' : 'Sound on'} onClick={toggleSound}>
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button className="icon-btn" title={musicEnabled ? 'Music off' : 'Music on'} onClick={toggleMusic}>
              {musicEnabled ? <Music2 size={18} /> : <Music size={18} />}
            </button>
          </div>
        )}

        {/* Interactive Top-Right Wallet Panel */}
        <div className="console-interactive wallet-panel-container">
          <div className="player-id-panel">
            <div className={`status-light ${isConnected ? 'connected' : 'disconnected'}`}></div>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="profile-avatar">
                  <User size={24} color={isConnected ? "var(--primary)" : "#8899b5"} />
                </div>
                <div className="pilot-meta" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8899b5' }}>
                    {isConnected ? 'LINKED PILOT' : 'GUEST PILOT'}
                  </span>
                  <strong 
                    style={{ fontSize: '1.2rem', letterSpacing: '1px', cursor: 'pointer', borderBottom: '1px dashed #444' }}
                    onClick={() => setIsEditNameModalOpen(true)}
                    title="Click to change name"
                  >
                    {user.username}
                  </strong>
                </div>
                <div className="wallet-credits" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '2px', textShadow: '0 0 5px var(--primary)' }}>CREDITS</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary)', textShadow: '0 0 5px var(--primary)' }}>{user.coins} <Coins size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/></strong>
                </div>
                {isConnected ? (
                  <button 
                    className="disconnect-btn" 
                    onClick={() => {
                      disconnect();
                      localStorage.removeItem('guestId');
                      window.location.reload();
                    }}
                    title="Disconnect Wallet"
                  >
                    <LogOut size={16} />
                  </button>
                ) : (
                  <button className="physical-btn primary" style={{ padding: '6px 12px', fontSize: '0.7rem', marginLeft: '10px' }} onClick={openWalletModal}>
                    LINK WALLET
                  </button>
                )}
              </div>
            ) : (
              <button onClick={openWalletModal} className="connect-prompt">
                <Wallet size={15} />
                <span>Link wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Center CRT Screens */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="center-stage">
          
          {gameState === 'MENU' && (
             <div className="menu-screen" style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <h1 className="neon-title">Space Cargo<br/>Runner</h1>

               {showFirstRunBrief && (
                 <div className="tutorial-brief">
                  <div>
                    <strong>First flight brief</strong>
                    <span>Move with arrow keys or hold left/right on the screen. Collect cargo, fuel, and power-ups. Dodge asteroids, mines, and debris. Press P or Space to pause.</span>
                  </div>
                  <button className="icon-btn" title="Dismiss briefing" onClick={handleDismissBrief}>OK</button>
                 </div>
               )}

               <div className="mission-strip">
                {missions.map((mission) => (
                  <div key={mission.id} className={`mission-chip ${mission.completed ? 'completed' : ''}`}>
                    <span>{mission.label}</span>
                    <strong>{Math.min(mission.progress, mission.target)} / {mission.target}</strong>
                  </div>
                ))}
               </div>

               {/* LIVE COMMS TICKER */}
               <div className="live-comms-ticker" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 255, 204, 0.3)', padding: '5px', background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(4px)', color: '#00ffcc', fontFamily: 'monospace', width: '100%', maxWidth: '600px', height: '170px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,255,204,0.05)' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid rgba(0,255,204,0.3)', paddingBottom: '6px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div className="status-light connected" style={{ width: '8px', height: '8px' }}></div>
                    GLOBAL LIVE COMMS LINK
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', fontSize: '13px', overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
                    {liveFeed.length === 0 ? (
                      <span className="blinking" style={{ color: '#8899b5' }}>Awaiting incoming transmissions...</span>
                    ) : (
                      liveFeed.map((feedUser, idx) => (
                        <div key={`${feedUser.id}-${idx}`} className="fade-in-ticker" style={{ display: 'flex', gap: '10px', color: '#fff' }}>
                          <span style={{ color: '#00aaff' }}>[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          <span>
                            <strong style={{ color: 'var(--primary)' }}>{feedUser.username}</strong> achieved High Score: <span style={{ color: 'var(--secondary)' }}>{feedUser.highScore}m</span> <span style={{ color: '#ff00ff', fontSize: '11px' }}>(+{feedUser.xp} XP)</span>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="crt-panel game-over-panel" style={{ padding: '40px', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
              <h2 className="title emergency-text" style={{ fontSize: '2.5rem', marginBottom: failureReason ? '10px' : '20px' }}>CRITICAL FAILURE</h2>
              {failureReason && (
                <div style={{
                  color: '#ff3333',
                  textShadow: '0 0 5px #ff0000',
                  fontSize: '0.9rem',
                  marginBottom: '20px',
                  fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
                  letterSpacing: '1px'
                }}>
                  {failureReason}
                </div>
              )}
              <div className="run-summary-grid">
                <div>
                  <span>Final Score</span>
                  <strong>{displayedRun.finalScore}</strong>
                </div>
                <div>
                  <span>Best Score</span>
                  <strong>{displayedRun.bestScore}</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{displayedRun.distance}m</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{formatTime(displayedRun.timeSurvived)}</strong>
                </div>
                <div>
                  <span>Cargo</span>
                  <strong>{displayedRun.cargo}</strong>
                </div>
                <div>
                  <span>Credits</span>
                  <strong>{displayedRun.coins}</strong>
                </div>
              </div>
              <div style={{ color: '#ff00ff', fontSize: '0.9rem', marginBottom: '15px' }}>
                Credits Earned: +{displayedRun.coins} <Coins size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>
              </div>
              {displayedRun.achievementNames.length > 0 && (
                <div className="unlock-callout">
                  <Medal size={18} />
                  {displayedRun.achievementNames.join(', ')} unlocked
                </div>
              )}
              {isConnected && user && user.coins >= 100 && (
                <div style={{ background: 'rgba(255, 209, 102, 0.1)', padding: '10px', borderRadius: '4px', border: '1px solid #ffd166', marginBottom: '15px', fontSize: '0.85rem' }}>
                  <Wallet size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                  You have enough credits to <strong style={{ color: '#ffd166', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setGameState('WITHDRAW')}>Withdraw</strong> to SCR!
                </div>
              )}
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ minWidth: '140px', flex: '1 1 auto' }}>Return to Menu</button>
                <button className="physical-btn primary" onClick={handleStart} style={{ minWidth: '140px', flex: '1 1 auto' }}>PLAY AGAIN</button>
              </div>
            </div>
          )}

          {gameState === 'PAUSED' && (
            <div className="crt-panel pause-panel">
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>PAUSED</h2>
              <div className="pause-stats">
                <span>Score <strong>{hudScore}</strong></span>
                <span>Time <strong>{formatTime(timeSurvived)}</strong></span>
                <span>Distance <strong>{Math.floor(distance)}m</strong></span>
              </div>
              <div className="settings-row">
                <button className="physical-btn" onClick={toggleSound}>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound</button>
                <button className="physical-btn" onClick={toggleMusic}>{musicEnabled ? <Music2 size={18} /> : <Music size={18} />} Music</button>
              </div>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')}>Abort Run</button>
                <button className="physical-btn primary" onClick={() => setGameState('PLAYING')}><Play size={20} /> Resume</button>
              </div>
            </div>
          )}

          {gameState === 'HOW_TO_PLAY' && (
            <div className="crt-panel meta-panel">
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>PILOT MANUAL</h2>
              <div style={{ display: 'grid', gap: '15px', marginTop: '20px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '10px' }}>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/controls.png`} alt="Controls" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>CONTROLS:</strong> Arrow Keys, drag, or gamepad. [P] / [SPACE] to pause.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/cargo.png`} alt="Cargo" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>CARGO:</strong> Collect for credits, score, and XP.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/data-cache.png`} alt="Data Cache" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>DATA CACHE:</strong> Collect for a massive score, credits, and XP multiplier.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/asteroid.png`} alt="Asteroid" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>ASTEROID:</strong> Dodge. Hits drain fuel.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/mine.png`} alt="Mine" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>PROXIMITY MINE:</strong> Avoid. Direct impact heavily drains fuel.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/debris.png`} alt="Debris" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>SPACE DEBRIS:</strong> Scraping causes minor fuel loss and knocks you off course.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/fuel.png`} alt="Fuel" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>FUEL:</strong> Replenish. Running empty ends session.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/power-shield.png`} alt="Shield" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>SHIELD GENERATOR:</strong> Absorbs one direct impact without draining fuel.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/power-magnet.png`} alt="Magnet" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>GRAVITY MAGNET:</strong> Pulls nearby cargo and data to your ship for 10s.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/power-double.png`} alt="Double Score" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>DATA MULTIPLIER (2X):</strong> Doubles all score, XP, and credits for 15s.
                  </div>
                </div>
                <div className="manual-entry">
                  <img src={`${import.meta.env.BASE_URL}assets/power-slow.png`} alt="Slow Motion" className="manual-sprite" />
                  <div className="manual-text">
                    <strong>TEMPORAL SHIFT (SLOW-MO):</strong> Slows hazards by 50% for precision dodging.
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Manual</button>
              </div>
            </div>
          )}

          {gameState === 'SHOP' && (
            <div className="crt-panel shop-panel" style={{ padding: '30px', width: '100%', maxWidth: '500px' }}>
              <div className="shop-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="title" style={{ fontSize: '1.4rem', margin: 0 }}>SHIP UPGRADES</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffd166', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'Courier New', textShadow: '0 0 10px rgba(255, 209, 102, 0.5)' }}>
                  CREDITS: {user?.coins || 0} <Coins size={18} className="spinning-coin" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'Courier New', marginBottom: '20px' }}>
                {/* Shield Upgrade */}
                <div className="upgrade-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 204, 0.2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>DEFLECTOR SHIELDS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap', color: '#c0d4f5', fontSize: '0.85rem' }}>
                      <span style={{ opacity: 0.7 }}>LVL {shieldLevel}</span>
                      <ArrowRight size={14} style={{ opacity: 0.5 }} />
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>LVL {shieldLevel + 1}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap', color: '#c0d4f5', fontSize: '0.85rem' }}>
                      <span style={{ opacity: 0.7 }}>HP {maxHealth}</span>
                      <ArrowRight size={14} style={{ opacity: 0.5 }} />
                      <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>HP {maxHealth + 100}</span>
                    </div>
                  </div>
                  <button 
                    className="physical-btn" 
                    style={{ minWidth: '130px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                    onClick={upgradeShield}
                    disabled={!user || user.coins < shieldLevel * 150}
                  >
                    UPGRADE ({shieldLevel * gameConfig.shieldUpgradeBaseCost} <Coins size={14} color="#ffd166" />)
                  </button>
                </div>
                <div className="upgrade-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 204, 0.2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem', color: '#00f0ff', fontWeight: 'bold' }}>PLASMA FUEL CORE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap', color: '#c0d4f5', fontSize: '0.85rem' }}>
                      <span style={{ opacity: 0.7 }}>LVL {fuelLevel}</span>
                      <ArrowRight size={14} style={{ opacity: 0.5 }} />
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>LVL {fuelLevel + 1}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap', color: '#c0d4f5', fontSize: '0.85rem' }}>
                      <span style={{ opacity: 0.7 }}>FUEL {maxFuel}</span>
                      <ArrowRight size={14} style={{ opacity: 0.5 }} />
                      <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>FUEL {maxFuel + 100}</span>
                    </div>
                  </div>
                  <button 
                    className="physical-btn" 
                    style={{ minWidth: '130px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                    onClick={upgradeFuel}
                    disabled={!user || user.coins < fuelLevel * 125}
                  >
                    UPGRADE ({fuelLevel * gameConfig.fuelUpgradeBaseCost} <Coins size={14} color="#ffd166" />)
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Shop</button>
              </div>
            </div>
          )}

          {gameState === 'WITHDRAW' && (
            <div className="crt-panel withdraw-panel" style={{ padding: '30px', width: '100%', maxWidth: '500px' }}>
              <div className="shop-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="title" style={{ fontSize: '2rem', margin: 0 }}>WITHDRAW FUNDS</h2>
                <div style={{ display: 'flex', alignItems: 'center', color: '#ffd166', fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Courier New', textShadow: '0 0 10px rgba(255, 209, 102, 0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  CREDITS: {user?.coins || 0} <Coins size={16} className="spinning-coin" style={{ marginLeft: '6px' }}/>
                </div>
              </div>

              {isConnected ? (
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '15px', borderRadius: '8px', border: '1px solid #ffd166', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.2rem', color: '#ffd166', letterSpacing: '1px' }}>WITHDRAW TO WALLET</span>
                      <span style={{ color: '#8899b5', fontSize: '0.85rem' }}>Convert in-game coins to SCAI tokens on SecureChain</span>
                    </div>
                    <ArrowDownToLine size={28} color="#ffd166" />
                  </div>

                  {onChainBalance !== undefined && (
                    <div style={{ color: '#ffd166', fontSize: '0.9rem', marginBottom: '10px', fontFamily: 'Courier New' }}>
                      ON-CHAIN BALANCE: {parseFloat(formatEther(onChainBalance as bigint)).toFixed(0)} SCAI
                    </div>
                  )}

                  <div className="withdraw-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder={`Amount (min ${gameConfig.minClaimAmount})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={gameConfig.minClaimAmount}
                      max={user?.coins || 0}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid #333',
                        color: '#fff',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontFamily: 'Courier New',
                        fontSize: '1rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      className="physical-btn"
                      style={{ minWidth: '140px', padding: '10px', background: withdrawStatus === 'success' ? '#0f3' : undefined }}
                      onClick={handleWithdraw}
                      disabled={
                        !user ||
                        withdrawStatus === 'signing' ||
                        withdrawStatus === 'confirming' ||
                        isWritePending ||
                        isTxConfirming ||
                        !withdrawAmount ||
                        parseInt(withdrawAmount) < gameConfig.minClaimAmount ||
                        parseInt(withdrawAmount) > user.coins
                      }
                    >
                      {withdrawStatus === 'signing' ? 'Signing...' :
                       withdrawStatus === 'confirming' || isWritePending || isTxConfirming ? 'Confirming...' :
                       withdrawStatus === 'success' ? 'Claimed!' : 'WITHDRAW'}
                    </button>
                  </div>

                  {withdrawError && (
                    <div style={{ color: '#ff4466', fontSize: '0.85rem', marginTop: '8px' }}>
                      ⚠ {withdrawError}
                    </div>
                  )}
                  {withdrawStatus === 'success' && (
                    <div style={{ color: '#0f3', fontSize: '0.85rem', marginTop: '8px' }}>
                      ✓ Tokens claimed successfully! Check your wallet.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px dashed #444', textAlign: 'center', color: '#8899b5', fontSize: '0.85rem', marginBottom: '20px' }}>
                  <ArrowDownToLine size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Connect a wallet to withdraw coins as SCR tokens on SecureChain
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Withdraw</button>
              </div>
            </div>
          )}

          {gameState === 'ACHIEVEMENTS' && (
            <div className="crt-panel meta-panel">
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center', flexShrink: 0 }}>PILOT RECORDS</h2>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
                <div className="achievement-grid">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <Medal size={24} />
                      <strong style={{ fontSize: '1.1rem' }}>{achievement.name}</strong>
                    </div>
                    <span>{achievement.description}</span>
                  </div>
                ))}
              </div>
              <div className="mission-list">
                {missions.map((mission) => (
                  <div key={mission.id} className={`mission-row ${mission.completed ? 'completed' : ''}`}>
                    <span>{mission.label}</span>
                    {mission.completed ? (
                      <>
                        <div className="mission-progress" style={{ borderColor: '#00ffcc' }}>
                          <div style={{ width: '100%', background: '#00ffcc' }}></div>
                        </div>
                        <strong style={{ color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <Check size={18} /> UNLOCKED
                        </strong>
                      </>
                    ) : (
                      <>
                        <div className="mission-progress">
                          <div style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}></div>
                        </div>
                        <strong style={{ color: '#00ffcc' }}>{mission.reward}</strong>
                      </>
                    )}
                  </div>
                ))}
              </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, marginTop: '20px' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Records</button>
              </div>
            </div>
          )}

          {gameState === 'HANGAR' && (
            <div className="crt-panel meta-panel">
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center', flexShrink: 0 }}>SHIP HANGAR</h2>
              <div className="skin-grid" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', minHeight: 0 }}>
                {shipSkins.map((skin) => (
                  <button
                    key={skin.id}
                    className={`skin-card ${selectedSkinId === skin.id ? 'selected' : ''}`}
                    onClick={() => selectSkin(skin.id)}
                    disabled={!skin.unlocked}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span className="skin-swatch" style={{ background: skin.color }}></span>
                      <strong style={{ fontSize: '1.1rem' }}>{skin.name}</strong>
                    </div>
                    <small>{skin.unlocked ? selectedSkinId === skin.id ? 'Equipped' : 'Available' : skin.unlock}</small>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, marginTop: '20px' }}>
                <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Hangar</button>
              </div>
            </div>
          )}

          {gameState === 'LEADERBOARD' && (
            <div className="crt-panel leaderboard-panel" style={{ padding: '30px', width: '100%', maxWidth: '400px' }}>
              <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>TOP RUNNERS</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '0 1rem', flexShrink: 0 }}>
                  <button 
                    className={`physical-btn ${leaderboardPeriod === 'weekly' ? 'tab-active' : 'tab-inactive'}`}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1, minWidth: 0 }}
                    onClick={() => setLeaderboardPeriod('weekly')}
                  >
                    Weekly
                  </button>
                  <button 
                    className={`physical-btn ${leaderboardPeriod === 'allTime' ? 'tab-active' : 'tab-inactive'}`}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1, minWidth: 0 }}
                    onClick={() => setLeaderboardPeriod('allTime')}
                  >
                    All-Time
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'Courier New', flex: 1, overflowY: 'auto', paddingRight: '10px', minHeight: 0 }}>
                  {topRunners === null ? (
                    <div style={{ textAlign: 'center', color: '#8899b5', padding: '20px' }}>
                      {isBackendWakingUp 
                        ? "Backend is waking up... this might take around a minute." 
                        : "Fetching data..."}
                    </div>
                  ) : leaderboardError ? (
                    <div style={{ margin: '0 auto', color: '#ff4444', padding: '15px 10px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.4)', borderRadius: '8px', width: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'nowrap', fontSize: '0.85rem' }}>
                        <span style={{ flexShrink: 0 }}>{">"}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>ERR_CONNECTION_REFUSED...</span>
                        <span className="blinking-cursor" style={{ flexShrink: 0, minWidth: '10px' }}></span>
                      </div>
                    </div>
                  ) : topRunners.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8899b5' }}>No runners yet! Be the first!</div>
                  ) : (
                    topRunners.map((runner, idx) => (
                      <div key={runner.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2233', paddingBottom: '10px' }}>
                        <span style={runner.id === user?.id ? { color: 'var(--secondary)' } : {}}>
                          {idx + 1}. {runner.username} {runner.id === user?.id && '(You)'}
                        </span>
                        <span className="stat-value">{runner.highScore}m</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <button className="physical-btn" onClick={() => setGameState('MENU')} style={{ margin: '0 auto' }}>Exit Terminal</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Physical Dashboard */}
        {gameState === 'MENU' && (
          <div className="console-dashboard">
            <button className="physical-btn primary" onClick={handleStart} style={{ fontSize: '1.3rem', padding: '14px 24px', width: '100%', marginBottom: '20px' }}>
              <Rocket style={{ marginRight: '10px' }}/> <span>START ENGINE</span>
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', width: '100%' }}>
              <button className="physical-btn" onClick={() => setGameState('SHOP')}><Settings size={18} /> <span>Upgrades</span></button>
              <button className="physical-btn" onClick={() => setGameState('HANGAR')}><Palette size={18} /> <span>Hangar</span></button>
              <button className="physical-btn" onClick={() => setGameState('ACHIEVEMENTS')}><Medal size={18} /> <span>Records</span></button>
              <button className="physical-btn" onClick={handleOpenLeaderboard}><Trophy size={18} /> <span>Ranks</span></button>
              <button className="physical-btn" onClick={() => setGameState('WITHDRAW')}><Wallet size={18} /> <span>Withdraw</span></button>
              <button className="physical-btn" onClick={() => setGameState('HOW_TO_PLAY')}><HelpCircle size={18} /> <span>Guide</span></button>
            </div>
          </div>
        )}

      </div>
      
      <ProvenanceWalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />
      {user && (
        <EditPilotModal 
          isOpen={isEditNameModalOpen} 
          onClose={() => setIsEditNameModalOpen(false)} 
          currentName={user.username} 
        />
      )}
    </>
  );
}

export default App;
