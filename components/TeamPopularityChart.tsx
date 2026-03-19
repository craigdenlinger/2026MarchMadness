import { getTeamPopularity } from '@/lib/data';

export async function TeamPopularityChart() {
  const rows = await getTeamPopularity();

  if (!rows.length) {
    return (
      <section>
        <p>No picks submitted yet.</p>
      </section>
    );
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.seed !== b.seed) return a.seed - b.seed;
    return a.teamName.localeCompare(b.teamName);
  });

  const maxCount = Math.max(...sortedRows.map((row) => row.count), 1);

  return (
    <section>
      <h2>Most Picked Teams</h2>
      <p>Number of participants who selected each team.</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {sortedRows.map((row) => {
          const percent = (row.count / maxCount) * 100;

          return (
            <div key={row.teamId}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 4,
                  fontSize: 14,
                }}
              >
                <span>
                  {row.seed} — {row.teamName} ({row.region})
                </span>
                <strong>{row.count}</strong>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 18,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'rgba(59, 130, 246, 0.8)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
