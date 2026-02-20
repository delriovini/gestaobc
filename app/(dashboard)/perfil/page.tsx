"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PerfilForm } from "./PerfilForm";

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [fullName, setFullName] = useState("");
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
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        setNomeCompleto((data.nome_completo ?? "") as string);
        setFullName((data.full_name ?? "") as string);
        setCpf((data.cpf ?? "") as string);
        setRg((data.rg ?? "") as string);
        setBirthDate((data.birth_date ?? "") as string);
        setWhatsapp((data.whatsapp ?? "") as string);
        setCep((data.cep ?? "") as string);
        setStreet((data.street ?? "") as string);
        setNumber((data.number ?? "") as string);
        setComplement((data.complement ?? "") as string);
        setNeighborhood((data.neighborhood ?? "") as string);
        setCity((data.city ?? "") as string);
        setStateUf((data.state ?? "") as string);

        if (data.avatar_url) {
          const { data: signed } = await supabase.storage
            .from("avatars")
            .createSignedUrl(data.avatar_url as string, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        } else {
          setAvatarUrl(null);
        }
      }

      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <p className="text-slate-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="mb-6 text-2xl font-semibold text-white">Meu Perfil</h1>
        <PerfilForm
          nomeCompleto={nomeCompleto}
          onNomeCompletoChange={setNomeCompleto}
          fullName={fullName}
          onFullNameChange={setFullName}
          cpf={cpf}
          setCpf={setCpf}
          rg={rg}
          setRg={setRg}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          cep={cep}
          setCep={setCep}
          street={street}
          setStreet={setStreet}
          number={number}
          setNumber={setNumber}
          complement={complement}
          setComplement={setComplement}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
          city={city}
          setCity={setCity}
          stateUf={stateUf}
          setStateUf={setStateUf}
          email={email}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  );
}
