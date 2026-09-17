import LandingPage from '@/components/LandingPage';
import { parseArchitecture } from '@/lib/demo';

type SearchParams = Record<string, string | string[] | undefined>;

// /demo?architecture=cascaded|mllm&embed=1
// The deck's live-demo slide frames this page with the host's architecture
// selection; the audience opens it directly and picks for themselves.
export default async function DemoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const architecture = parseArchitecture(typeof params.architecture === 'string' ? params.architecture : undefined);
  const embed = params.embed === '1' || params.embed === 'true';
  return <LandingPage initialArchitecture={architecture} embed={embed} />;
}
