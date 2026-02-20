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
  };
}
