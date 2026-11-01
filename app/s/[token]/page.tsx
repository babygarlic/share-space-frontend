import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ShortLinkRedirect({ params }: PageProps) {
  const { token } = await params;
  redirect(`/join/${token}`);
}
