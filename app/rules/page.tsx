export default function RulesPage() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Pool rules</h2>
      <ul>
        <li>Pick 4 teams per region.</li>
        <li>Pick 1 additional bonus team from any region.</li>
        <li>Total picks: 17 distinct teams.</li>
        <li>Each tournament win is worth the team's seed.</li>
        <li>First Four / play-in wins do not count.</li>
        <li>Those play-in winners can still be picked and score normally from the Round of 64 forward.</li>
        <li>If you pick the national champion, the title game is worth seed × 5 for that game.</li>
        <li>Once submitted, an entry is final.</li>
        <li>No tiebreaker. Ties split winnings.</li>
      </ul>
    </div>
  );
}
