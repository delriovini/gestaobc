import LoginClient from "./LoginClient";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let error: string | undefined;
  try {
    const params = await searchParams;
    const raw = params?.error;
    error =
      raw == null
        ? undefined
        : Array.isArray(raw)
          ? raw[0]
          : typeof raw === "string"
            ? raw
            : undefined;
  } catch {
    error = undefined;
  }
  return <LoginClient error={error} />;
}
