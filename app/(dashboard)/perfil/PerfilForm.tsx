"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, uploadAvatar } from "@/lib/profile";
import { Input } from "@/components/ui/Input";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

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
  if (!value) return true; // campo opcional, só valida se preenchido

  const cpf = value.replace(/\D/g, "");

  // Tamanho deve ser 11
  if (cpf.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Cálculo dos dígitos verificadores
  const nums = cpf.split("").map((d) => parseInt(d, 10));

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += nums[i] * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== nums[9]) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += nums[i] * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  if (secondCheck !== nums[10]) return false;

  return true;
}

function isAtLeast16YearsOld(dateString: string | null | undefined): boolean {
  if (!dateString) return true; // se não preenchido, não bloqueia aqui

  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 16;
}

interface PerfilFormProps {
  nomeCompleto: string;
  onNomeCompletoChange: (v: string) => void;
  fullName: string;
  onFullNameChange: (v: string) => void;
  cpf: string;
  setCpf: (v: string) => void;
  rg: string;
  setRg: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  cep: string;
  setCep: (v: string) => void;
  street: string;
  setStreet: (v: string) => void;
  number: string;
  setNumber: (v: string) => void;
  complement: string;
  setComplement: (v: string) => void;
  neighborhood: string;
  setNeighborhood: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateUf: string;
  setStateUf: (v: string) => void;
  email: string;
  avatarUrl: string | null;
}

export function PerfilForm({
  nomeCompleto,
  onNomeCompletoChange,
  fullName,
  onFullNameChange,
  cpf,
  setCpf,
  rg,
  setRg,
  birthDate,
  setBirthDate,
  whatsapp,
  setWhatsapp,
  cep,
  setCep,
  street,
  setStreet,
  number,
  setNumber,
  complement,
  setComplement,
  neighborhood,
  setNeighborhood,
  city,
  setCity,
  stateUf,
  setStateUf,
  email,
  avatarUrl,
}: PerfilFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  async function handleCepBlur() {
    const rawCep = (cep || "").replace(/\D/g, "");

    if (rawCep.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.erro) return;

      // Preenche automaticamente, mas o usuário pode editar depois
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setStateUf(data.uf);
    } catch {
      // Silencia erros de rede; usuário ainda pode preencher manualmente
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const nomeCompletoVal =
      ((formData.get("nome_completo") as string | null)?.trim() || "") || null;
    const fullNameVal =
      ((formData.get("full_name") as string | null)?.trim() || "") || null;

    const cpfRaw = (formData.get("cpf") as string | null) ?? "";
    const cpfDigits = cpfRaw.replace(/\D/g, "") || null;

    if (!validateCPF(cpfDigits)) {
      setError("CPF inválido. Verifique os dígitos e tente novamente.");
      setLoading(false);
      return;
    }

    const rg =
      ((formData.get("rg") as string | null)?.trim() || "") || null;

    const birthDateValue =
      ((formData.get("birth_date") as string | null)?.trim() || "") || null;

    if (!isAtLeast16YearsOld(birthDateValue)) {
      setError("Você precisa ter pelo menos 16 anos para usar a plataforma.");
      setLoading(false);
      return;
    }

    const whatsappRaw = (formData.get("whatsapp") as string | null) ?? "";
    const whatsappValue = whatsappRaw.replace(/\D/g, "") || null;
    const cepRaw = (formData.get("cep") as string | null) ?? "";
    const cepValue = cepRaw.replace(/\D/g, "") || null;
    const streetValue =
      ((formData.get("street") as string | null)?.trim() || "") || null;
    const numberValue =
      ((formData.get("number") as string | null)?.trim() || "") || null;
    const complementValue =
      ((formData.get("complement") as string | null)?.trim() || "") || null;
    const neighborhoodValue =
      ((formData.get("neighborhood") as string | null)?.trim() || "") || null;
    const cityValue =
      ((formData.get("city") as string | null)?.trim() || "") || null;
    const stateValue =
      ((formData.get("state") as string | null)?.trim() || "") || null;

    const avatarFile = formData.get("avatar") as File | null;

    try {
      let newAvatarUrl: string | null = null;

      if (avatarFile && avatarFile.size > 0) {
        if (avatarFile.size > MAX_FILE_SIZE) {
          setError("Imagem deve ter no máximo 1MB.");
          setLoading(false);
          return;
        }
        newAvatarUrl = (await uploadAvatar(avatarFile)) ?? null;
      }

      const result = await updateProfile({
        nome_completo: nomeCompletoVal,
        full_name: fullNameVal,
        cpf: cpfDigits,
        rg,
        birth_date: birthDateValue,
        whatsapp: whatsappValue,
        cep: cepValue,
        street: streetValue,
        number: numberValue,
        complement: complementValue,
        neighborhood: neighborhoodValue,
        city: cityValue,
        state: stateValue,
        ...(newAvatarUrl && { avatar_url: newAvatarUrl }),
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (newAvatarUrl) setAvatarVersion((v) => v + 1);
      // Re-renderiza o layout (server component) para Sidebar/header atualizarem nome, cargo e avatar
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          Perfil salvo com sucesso.
        </div>
      )}

      {/* Seção 1: Dados pessoais */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Dados pessoais
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Nome completo"
              name="nome_completo"
              value={nomeCompleto}
              onChange={(e) => onNomeCompletoChange(e.target.value)}
              placeholder="Seu nome completo"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Apelido"
              name="full_name"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Como prefere ser chamado"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className={`${inputClasses} bg-white/10 text-slate-300`}
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
            maxLength={20}
            disabled={loading}
          />

          <Input
            label="Data de Nascimento"
            name="birth_date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={loading}
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
      </section>

      {/* Seção 2: Endereço */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Endereço
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
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
          />

          <Input
            label="Número"
            name="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Número"
            disabled={loading}
          />

          <Input
            label="Complemento"
            name="complement"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Apartamento, bloco, etc."
            disabled={loading}
          />

          <Input
            label="Bairro"
            name="neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Seu bairro"
            disabled={loading}
          />

          <Input
            label="Cidade"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Sua cidade"
            disabled={loading}
          />

          <Input
            label="Estado"
            name="state"
            value={stateUf}
            onChange={(e) => setStateUf(e.target.value)}
            placeholder="UF"
            disabled={loading}
          />
        </div>
      </section>

      {/* Seção 3: Avatar */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Avatar
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">
              Avatar atual
            </p>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl + (avatarVersion ? `?v=${avatarVersion}` : "")}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <label
              htmlFor="avatar"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Nova imagem
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              disabled={loading}
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-slate-500">
              Imagem deve ter no máximo 1MB.
            </p>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
