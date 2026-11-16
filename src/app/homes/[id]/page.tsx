import { HomeDetail } from '@/screens/HomeDetail';

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 39 }, (_, i) => ({ id: `h${String(i + 1).padStart(2, '0')}` }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HomeDetail id={id} />;
}
