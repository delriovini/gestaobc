export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          full_name: string | null;
          nome_completo: string | null;
          cpf: string | null;
          rg: string | null;
          birth_date: string | null;
          whatsapp: string | null;
          cep: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          role: string | null;
          staff_level: Database["public"]["Enums"]["staff_level"] | null;
          status: string | null;
          avatar_url: string | null;
          mfa_enabled: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nome?: string | null;
          full_name?: string | null;
          nome_completo?: string | null;
          cpf?: string | null;
          rg?: string | null;
          birth_date?: string | null;
          whatsapp?: string | null;
          cep?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          role?: string | null;
          staff_level?: Database["public"]["Enums"]["staff_level"] | null;
          status?: string | null;
          avatar_url?: string | null;
          mfa_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string | null;
          full_name?: string | null;
          nome_completo?: string | null;
          cpf?: string | null;
          rg?: string | null;
          birth_date?: string | null;
          whatsapp?: string | null;
          cep?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          role?: string | null;
          staff_level?: Database["public"]["Enums"]["staff_level"] | null;
          status?: string | null;
          avatar_url?: string | null;
          mfa_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          start_time: string | null;
          end_time: string | null;
          type: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          start_time?: string | null;
          end_time?: string | null;
          type?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          type?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      staff_level: "TRAINEE" | "SUPORTE" | "MODERADOR" | "ADMINISTRADOR";
    };
  };
}
