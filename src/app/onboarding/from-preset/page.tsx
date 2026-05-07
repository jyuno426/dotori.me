import Link from "next/link";
import { redirect } from "next/navigation";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { Container, Heading, Text, Eyebrow } from "@/components/ds";
import { getSession } from "@/lib/auth";
import { SetupFromPreset } from "./SetupFromPreset";

export const metadata = {
  title: "포트폴리오 자동 셋업 | 도토리",
};

export default async function OnboardingFromPresetPage() {
  const session = await getSession();
  if (!session) {
    redirect("/signup");
  }

  return (
    <div className="flex-1 bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <Container className="h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AcornIcon className="w-6 h-6" />
            <span className="text-title text-primary-dark">도토리</span>
          </Link>
        </Container>
      </header>

      <main className="py-12 sm:py-20">
        <Container className="max-w-2xl">
          <header className="mb-10 text-center">
            <Eyebrow>한 번만 더</Eyebrow>
            <Heading as="h1" level="display" className="mt-3">
              자동으로 셋업해드릴게요
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-4 max-w-xl mx-auto">
              진단에서 고른 자산배분 그대로 *포트폴리오·종목·목표 비중·계좌*를
              한 번에 만들어요.
            </Text>
          </header>

          <SetupFromPreset />
        </Container>
      </main>
    </div>
  );
}
