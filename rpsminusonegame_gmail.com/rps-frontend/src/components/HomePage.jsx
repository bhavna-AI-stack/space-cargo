export default function HomePage({ onStart }) {
  return (
    <div className="HomeScreen">
      <img src="/logo.png" className="game-title" alt="Rock Paper Scissors Minus One" />

      <div className="rules">
        <h3 className="desc">Not just your ordinary Rock, Paper, Scissors.</h3>
        <button className="Btn" onClick={onStart}>
          Start Game
        </button>
        <h2>How To Play!</h2>
        <ul>
          <li>Connect your wallet.</li>
          <li>Place your bet.</li>
          <li>Select two moves from Rock, Paper, Scissors. Both the moves should be different.</li>
          <li>The opponent selects two moves at random, and both sets are visible.</li>
          <li>The result is declared after you choose your final move.</li>
          <li>If you win, you get 2x your bet. If it is a tie, you get 0.8x your bet.</li>
          <li>You can withdraw rewards only after reaching the withdrawal threshold.</li>
        </ul>
      </div>
    </div>
  );
}
