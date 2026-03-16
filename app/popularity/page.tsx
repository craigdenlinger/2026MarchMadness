import Link from 'next/link';
import { TeamPopularityChart } from '@/components/TeamPopularityChart';
import { getPublicMetadata } from '@/lib/data';

export default async function PopularityPage() {
  const meta = await getPublicMetadata();

  if (!meta.locked) {
    return (
      <section>
        <h2>Team picks are hidden until entries lock</h2>
        <p>
          This page will become visible automatically after the entry deadline
          passes.
        </p>
        <p>
          Entry lock time: <strong>{meta.lockAt}</strong>
        </p>
        <Link href="/enter">Back to Enter Picks</Link>
      </section>
    );
  }

  return <TeamPopularityChart />;
}
