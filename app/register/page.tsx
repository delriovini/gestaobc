"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import type { Database } from "@/lib/database.types";

const HCaptcha = dynamic(
  () => import("@hcaptcha/react-hcaptcha").then((mod) => mod.HCaptcha),
  { ssr: false }
);

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50";

function Logo() {
  return (
    <div className="flex justify-center">
      <img
        src="https://i.imgur.com/7mWUZKi.png"
        alt="Gestão BC"
        className="h-48 w-48 rounded-xl object-contain"
      />
    </div>
  );
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  if (digits.length <= 3) return part1;
  if (digits.length <= 6) return `${part1}.${part2}`;
  if (digits.length <= 9) return `${part1}.${part2}.${part3}`;
  return `${part1}.${part2}.${part3}-${part4}`;
}

function formatWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const d1 = digits.slice(0, 2);
  const d2 = digits.slice(2, 7);
  const d3 = digits.slice(7, 11);
  if (digits.length <= 2) return `(${d1}`;
  if (digits.length <= 7) return `(${d1}) ${d2}`;
  return `(${d1}) ${d2}-${d3}`;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 5);
  const p2 = digits.slice(5, 8);
  if (digits.length <= 5) return p1;
  return `${p1}-${p2}`;
}

function validateCPF(value: string | null | undefined): boolean {
  if (!value) return true;
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const nums = cpf.split("").map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== nums[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  return secondCheck === nums[10];
}

function isAtLeast16YearsOld(dateString: string | null | undefined): boolean {
  if (!dateString) return true;
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 16;
}

type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export default function RegisterPage() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [apelido, setApelido] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

  async function handleCepBlur() {
    const rawCep = (cep || "").replace(/\D/g, "");
    if (rawCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      if (!response.ok) return;
      const data = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) return;
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setStateUf(data.uf);
    } catch {
      // usuário pode preencher manualmente
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!captchaToken) {
      setError("Complete o captcha para continuar.");
      setLoading(false);
      return;
    }

    const nomeCompletoVal = nomeCompleto.trim();
    if (!nomeCompletoVal) {
      setError("Informe o nome completo.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "") || null;
    if (cpfDigits && !validateCPF(cpfDigits)) {
      setError("CPF inválido. Verifique os dígitos.");
      setLoading(false);
      return;
    }

    if (!isAtLeast16YearsOld(birthDate || null)) {
      setError("Você precisa ter pelo menos 16 anos para se cadastrar.");
      setLoading(false);
      return;
    }

    const apelidoVal = apelido.trim() || null;
    const whatsappDigits = whatsapp.replace(/\D/g, "") || null;
    const cepDigits = cep.replace(/\D/g, "") || null;

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          data: {
            full_name: apelidoVal,
            role: "STAFF",
            phone: whatsappDigits ?? undefined,
            nome: nomeCompletoVal,
          },
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "Este email já está cadastrado. Faça login ou recupere sua senha."
            : signUpError.message
        );
        setLoading(false);
        return;
      }

      const user = data?.user;
      if (!user) {
        setError("Não foi possível criar a conta. Tente novamente.");
        setLoading(false);
        return;
      }

      let avatarUrl: string | null = null;
      if (avatarFile && avatarFile.size > 0) {
        const filePath = `${user.id}/avatar.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (!uploadErr) avatarUrl = filePath;
      }

      const profileUpdate: ProfilesUpdate = {
        full_name: apelidoVal,
        nome_completo: nomeCompletoVal,
        role: "STAFF",
        status: "PENDENTE",
        cpf: cpfDigits,
        rg: (rg.trim() || null),
        birth_date: (birthDate.trim() || null),
        whatsapp: whatsappDigits,
        cep: cepDigits,
        street: (street.trim() || null),
        number: (number.trim() || null),
        complement: (complement.trim() || null),
        neighborhood: (neighborhood.trim() || null),
        city: (city.trim() || null),
        state: (stateUf.trim() || null),
        ...(avatarUrl && { avatar_url: avatarUrl }),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (updateError) {
        setError(
          "Conta criada, mas houve um erro ao salvar o perfil. Entre em contato com o suporte."
        );
        setLoading(false);
        return;
      }

      setCaptchaToken(null);
      await supabase.auth.signOut();
      setSuccess(true);
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <h1 className="mb-1 flex flex-col items-center text-center text-2xl font-semibold text-white">
              Cadastro realizado
            </h1>
            <div
              role="status"
              className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              Cadastro enviado para aprovação.
            </div>
            <p className="mb-6 text-center text-slate-400">
              Aguarde a aprovação de um administrador para acessar o sistema.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-1 flex flex-col items-center text-center text-2xl font-semibold text-white">
            Criar conta
          </h1>
          <p className="mb-6 text-center text-slate-400">
            Preencha os dados para solicitar acesso ao sistema
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                <p className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Nome completo"
                  name="nome_completo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                  className={inputClasses}
                  autoComplete="name"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Apelido"
                  name="full_name"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Como prefere ser chamado"
                  disabled={loading}
                  className={inputClasses}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className={inputClasses}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  CPF
                </label>
                <input
                  name="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-99"
                  disabled={loading}
                  className={inputClasses}
                />
              </div>
              <Input
                label="RG"
                name="rg"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="Seu RG"
                disabled={loading}
                className={inputClasses}
              />
              <Input
                label="Data de Nascimento"
                name="birth_date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={loading}
                className={inputClasses}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Whatsapp
                </label>
                <input
                  name="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  placeholder="(00) 00000-0000"
                  disabled={loading}
                  className={inputClasses}
                />
              </div>
            </div>

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Endereço
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    CEP
                  </label>
                  <input
                    name="cep"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    disabled={loading}
                    className={inputClasses}
                  />
                </div>
                <Input
                  label="Rua"
                  name="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Nome da rua"
                  disabled={loading}
                  className={inputClasses}
                />
                <Input
                  label="Número"
                  name="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Número"
                  disabled={loading}
                  className={inputClasses}
                />
                <Input
                  label="Complemento"
                  name="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco, etc."
                  disabled={loading}
                  className={inputClasses}
                />
                <Input
                  label="Bairro"
                  name="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  disabled={loading}
                  className={inputClasses}
                />
                <Input
                  label="Cidade"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  disabled={loading}
                  className={inputClasses}
                />
                <Input
                  label="Estado"
                  name="state"
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                  placeholder="UF"
                  disabled={loading}
                  className={inputClasses}
                />
              </div>
            </section>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Avatar (opcional)
              </label>
              <input
                name="avatar"
                type="file"
                accept="image/*"
                disabled={loading}
                className={inputClasses}
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-slate-500">
                JPG ou PNG. Máx. recomendado 5MB.
              </p>
            </div>

            <Input
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
              className={inputClasses}
              autoComplete="new-password"
              minLength={6}
            />
            <Input
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              disabled={loading}
              className={inputClasses}
              autoComplete="new-password"
              minLength={6}
            />

            {siteKey && (
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={siteKey}
                  onVerify={(token: string) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!siteKey ? false : !captchaToken)}
              className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Enviar cadastro
                    <svg
                      className="h-5 w-5 transition group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition group-hover:opacity-100" />
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
