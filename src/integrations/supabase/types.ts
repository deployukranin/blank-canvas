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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_configurations: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_orders: {
        Row: {
          amount_cents: number
          br_code: string | null
          category: string
          category_name: string | null
          correlation_id: string
          created_at: string
          customer_name: string
          delivered_at: string | null
          duration_label: string | null
          duration_minutes: number | null
          expires_at: string | null
          id: string
          observations: string | null
          openpix_charge_id: string | null
          paid_at: string | null
          payment_proof_url: string | null
          payout_amount_cents: number | null
          payout_correlation_id: string | null
          payout_status: string | null
          preferences: string | null
          product_id: string | null
          product_type: string
          qr_code_image: string | null
          script: string | null
          status: string
          store_id: string | null
          triggers: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          br_code?: string | null
          category: string
          category_name?: string | null
          correlation_id: string
          created_at?: string
          customer_name: string
          delivered_at?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          observations?: string | null
          openpix_charge_id?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payout_amount_cents?: number | null
          payout_correlation_id?: string | null
          payout_status?: string | null
          preferences?: string | null
          product_id?: string | null
          product_type: string
          qr_code_image?: string | null
          script?: string | null
          status?: string
          store_id?: string | null
          triggers?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          br_code?: string | null
          category?: string
          category_name?: string | null
          correlation_id?: string
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          observations?: string | null
          openpix_charge_id?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          payout_amount_cents?: number | null
          payout_correlation_id?: string | null
          payout_status?: string | null
          preferences?: string | null
          product_id?: string | null
          product_type?: string
          qr_code_image?: string | null
          script?: string | null
          status?: string
          store_id?: string | null
          triggers?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          store_id: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          store_id?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          store_id?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          handle_set_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          handle_set_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          handle_set_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      store_admins: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_admins_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
          status: string
          updated_at: string
          url: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
          status?: string
          updated_at?: string
          url?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
          status?: string
          updated_at?: string
          url?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          store_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          store_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          store_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chat_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      video_idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "video_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      video_ideas: {
        Row: {
          created_at: string
          description: string
          id: string
          status: string
          store_id: string | null
          title: string
          updated_at: string
          user_id: string | null
          votes: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          status?: string
          store_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          votes?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          status?: string
          store_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_ideas_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      video_reactions: {
        Row: {
          created_at: string
          guest_id: string | null
          id: string
          reaction_type: Database["public"]["Enums"]["video_reaction_type"]
          updated_at: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          id?: string
          reaction_type: Database["public"]["Enums"]["video_reaction_type"]
          updated_at?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          id?: string
          reaction_type?: Database["public"]["Enums"]["video_reaction_type"]
          updated_at?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: []
      }
      video_watch_history: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number | null
          guest_id: string | null
          id: string
          last_position_seconds: number
          updated_at: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          guest_id?: string | null
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          guest_id?: string | null
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: []
      }
      vip_content: {
        Row: {
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          media_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vip_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          plan_type: string
          price_cents: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          plan_type?: string
          price_cents: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          price_cents?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_api_usage: {
        Row: {
          channel_id: string
          created_at: string
          endpoint: string
          id: string
          units_used: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          endpoint?: string
          id?: string
          units_used?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          units_used?: number
        }
        Relationships: []
      }
      youtube_cache_metadata: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          last_fetched_at: string
          updated_at: string
          video_count: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          last_fetched_at?: string
          updated_at?: string
          video_count?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          last_fetched_at?: string
          updated_at?: string
          video_count?: number
        }
        Relationships: []
      }
      youtube_videos_cache: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          published_at: string | null
          thumbnail_url: string | null
          updated_at: string
          video_description: string | null
          video_id: string
          video_title: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_description?: string | null
          video_id: string
          video_title: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_description?: string | null
          video_id?: string
          video_title?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_credentials_safe: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      get_admin_credentials_safe: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_vip: { Args: { check_user_id: string }; Returns: boolean }
      set_user_handle: { Args: { new_handle: string }; Returns: Json }
      toggle_idea_vote: { Args: { p_idea_id: string }; Returns: Json }
      use_invite_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "ceo"
        | "super_admin"
        | "creator"
        | "client"
      video_reaction_type: "relaxante" | "dormi" | "arrepios" | "favorito"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "ceo",
        "super_admin",
        "creator",
        "client",
      ],
      video_reaction_type: ["relaxante", "dormi", "arrepios", "favorito"],
    },
  },
} as const
