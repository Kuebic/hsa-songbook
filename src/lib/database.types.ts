export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      arrangements: {
        Row: {
          chord_data: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_public: boolean | null
          key: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string | null
          name: string
          rating_average: number | null
          rating_count: number | null
          slug: string
          song_id: string
          tags: string[] | null
          tempo: number | null
          time_signature: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          chord_data: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          key?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string | null
          name: string
          rating_average?: number | null
          rating_count?: number | null
          slug: string
          song_id: string
          tags?: string[] | null
          tempo?: number | null
          time_signature?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          chord_data?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          key?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string | null
          name?: string
          rating_average?: number | null
          rating_count?: number | null
          slug?: string
          song_id?: string
          tags?: string[] | null
          tempo?: number | null
          time_signature?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arrangements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangements_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangements_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangements_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs_with_alt_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      moderation_log: {
        Row: {
          action: string
          content_id: string
          content_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          note: string | null
          performed_at: string | null
          performed_by: string | null
          previous_status: string | null
        }
        Insert: {
          action: string
          content_id: string
          content_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string
          content_id?: string
          content_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          song_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          song_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          song_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs_with_alt_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          performed_at: string | null
          performed_by: string | null
          reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      setlist_items: {
        Row: {
          arrangement_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          position: number
          setlist_id: string
          transpose_steps: number | null
        }
        Insert: {
          arrangement_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          position: number
          setlist_id: string
          transpose_steps?: number | null
        }
        Update: {
          arrangement_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          position?: number
          setlist_id?: string
          transpose_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_items_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_items_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          share_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          share_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          share_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          alternative_titles: string[] | null
          artist: string | null
          auto_conversion_enabled: boolean | null
          ccli: string | null
          ccli_verified: boolean | null
          composition_year: number | null
          created_at: string | null
          created_by: string | null
          default_arrangement_id: string | null
          id: string
          is_public: boolean | null
          lyrics: Json | null
          lyrics_source: string | null
          lyrics_verified: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string | null
          notes: string | null
          original_language: string | null
          primary_ccli_id: string | null
          rating_average: number | null
          rating_count: number | null
          slug: string
          source: string | null
          themes: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          alternative_titles?: string[] | null
          artist?: string | null
          auto_conversion_enabled?: boolean | null
          ccli?: string | null
          ccli_verified?: boolean | null
          composition_year?: number | null
          created_at?: string | null
          created_by?: string | null
          default_arrangement_id?: string | null
          id?: string
          is_public?: boolean | null
          lyrics?: Json | null
          lyrics_source?: string | null
          lyrics_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string | null
          notes?: string | null
          original_language?: string | null
          primary_ccli_id?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug: string
          source?: string | null
          themes?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          alternative_titles?: string[] | null
          artist?: string | null
          auto_conversion_enabled?: boolean | null
          ccli?: string | null
          ccli_verified?: boolean | null
          composition_year?: number | null
          created_at?: string | null
          created_by?: string | null
          default_arrangement_id?: string | null
          id?: string
          is_public?: boolean | null
          lyrics?: Json | null
          lyrics_source?: string | null
          lyrics_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string | null
          notes?: string | null
          original_language?: string | null
          primary_ccli_id?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string
          source?: string | null
          themes?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_songs_default_arrangement"
            columns: ["default_arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      song_stats: {
        Row: {
          arrangement_count: number | null
          artist: string | null
          id: string | null
          rating_average: number | null
          rating_count: number | null
          setlist_count: number | null
          themes: string[] | null
          title: string | null
          views: number | null
        }
        Relationships: []
      }
      songs_with_alt_titles: {
        Row: {
          all_titles: string[] | null
          alt_title_count: number | null
          alternative_titles: string[] | null
          artist: string | null
          auto_conversion_enabled: boolean | null
          ccli: string | null
          ccli_verified: boolean | null
          composition_year: number | null
          created_at: string | null
          created_by: string | null
          default_arrangement_id: string | null
          has_alternative_titles: boolean | null
          id: string | null
          is_public: boolean | null
          lyrics: Json | null
          lyrics_source: string | null
          lyrics_verified: boolean | null
          notes: string | null
          original_language: string | null
          primary_ccli_id: string | null
          rating_average: number | null
          rating_count: number | null
          slug: string | null
          source: string | null
          themes: string[] | null
          title: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          all_titles?: never
          alt_title_count?: never
          alternative_titles?: string[] | null
          artist?: string | null
          auto_conversion_enabled?: boolean | null
          ccli?: string | null
          ccli_verified?: boolean | null
          composition_year?: number | null
          created_at?: string | null
          created_by?: string | null
          default_arrangement_id?: string | null
          has_alternative_titles?: never
          id?: string | null
          is_public?: boolean | null
          lyrics?: Json | null
          lyrics_source?: string | null
          lyrics_verified?: boolean | null
          notes?: string | null
          original_language?: string | null
          primary_ccli_id?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string | null
          source?: string | null
          themes?: string[] | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          all_titles?: never
          alt_title_count?: never
          alternative_titles?: string[] | null
          artist?: string | null
          auto_conversion_enabled?: boolean | null
          ccli?: string | null
          ccli_verified?: boolean | null
          composition_year?: number | null
          created_at?: string | null
          created_by?: string | null
          default_arrangement_id?: string | null
          has_alternative_titles?: never
          id?: string | null
          is_public?: boolean | null
          lyrics?: Json | null
          lyrics_source?: string | null
          lyrics_verified?: boolean | null
          notes?: string | null
          original_language?: string | null
          primary_ccli_id?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string | null
          source?: string | null
          themes?: string[] | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_songs_default_arrangement"
            columns: ["default_arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          arrangements_created: number | null
          full_name: string | null
          id: string | null
          reviews_written: number | null
          setlists_created: number | null
          songs_created: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_role: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      daitch_mokotoff: {
        Args: { "": string }
        Returns: string[]
      }
      dmetaphone: {
        Args: { "": string }
        Returns: string
      }
      dmetaphone_alt: {
        Args: { "": string }
        Returns: string
      }
      find_ccli_matches: {
        Args: {
          max_results?: number
          search_title: string
          similarity_threshold?: number
        }
        Returns: {
          ccli_mapping_id: string
          ccli_number: string
          levenshtein_distance: number
          similarity_score: number
          title: string
        }[]
      }
      generate_share_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_title_fingerprint: {
        Args: { input_title: string }
        Returns: string
      }
      get_all_song_titles: {
        Args: { alt_titles: string[]; main_title: string }
        Returns: string[]
      }
      get_alternative_titles_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_alt_titles_per_song: number
          max_alt_titles: number
          songs_with_alt_titles: number
          total_alt_titles: number
          total_songs: number
        }[]
      }
      get_moderation_queue: {
        Args: { filter_status?: string; filter_type?: string }
        Returns: {
          content_id: string
          content_type: string
          created_at: string
          creator_email: string
          creator_id: string
          id: string
          last_modified: string
          report_count: number
          status: string
          title: string
        }[]
      }
      grant_user_role: {
        Args: {
          grant_reason?: string
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      revoke_user_role: {
        Args: { revoke_reason?: string; target_user_id: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      song_has_alternative_title: {
        Args: { alt_titles: string[]; search_title: string }
        Returns: boolean
      }
      soundex: {
        Args: { "": string }
        Returns: string
      }
      text_soundex: {
        Args: { "": string }
        Returns: string
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
