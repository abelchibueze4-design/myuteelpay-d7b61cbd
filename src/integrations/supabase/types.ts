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
      api_health_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          provider: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          provider: string
          response_time_ms?: number | null
          status?: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          provider?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      cable_plans: {
        Row: {
          cable_id: number | null
          cableplan_amount: number
          cableplan_id: number
          cableplan_name: string
        }
        Insert: {
          cable_id?: number | null
          cableplan_amount: number
          cableplan_id: number
          cableplan_name: string
        }
        Update: {
          cable_id?: number | null
          cableplan_amount?: number
          cableplan_id?: number
          cableplan_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cable_plans_cable_id_fkey"
            columns: ["cable_id"]
            isOneToOne: false
            referencedRelation: "cables"
            referencedColumns: ["cable_id"]
          },
        ]
      }
      cables: {
        Row: {
          cable_id: number
          cable_name: string
        }
        Insert: {
          cable_id: number
          cable_name: string
        }
        Update: {
          cable_id?: number
          cable_name?: string
        }
        Relationships: []
      }
      data_plans: {
        Row: {
          amount: number | null
          network_name: string | null
          plan_id: number
          plan_type: string | null
          size: string | null
          validity: string | null
        }
        Insert: {
          amount?: number | null
          network_name?: string | null
          plan_id: number
          plan_type?: string | null
          size?: string | null
          validity?: string | null
        }
        Update: {
          amount?: number | null
          network_name?: string | null
          plan_id?: number
          plan_type?: string | null
          size?: string | null
          validity?: string | null
        }
        Relationships: []
      }
      electricity_companies: {
        Row: {
          disco_id: number
          disco_name: string
        }
        Insert: {
          disco_id: number
          disco_name: string
        }
        Update: {
          disco_id?: number
          disco_name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          identifier: string
          label: string
          metadata: Json | null
          service_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          label: string
          metadata?: Json | null
          service_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          label?: string
          metadata?: Json | null
          service_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address: string
          admin_notes: string | null
          created_at: string
          date_of_birth: string
          full_name: string
          id: string
          id_number: string
          id_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          admin_notes?: string | null
          created_at?: string
          date_of_birth: string
          full_name: string
          id?: string
          id_number: string
          id_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          admin_notes?: string | null
          created_at?: string
          date_of_birth?: string
          full_name?: string
          id?: string
          id_number?: string
          id_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          network_id: number
          network_name: string
        }
        Insert: {
          network_id: number
          network_name: string
        }
        Update: {
          network_id?: number
          network_name?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          broadcast_id: string | null
          channel: string
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          next_retry_at: string | null
          notification_id: string | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          retry_count: number
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          broadcast_id?: string | null
          channel: string
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          notification_id?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          broadcast_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          next_retry_at?: string | null
          notification_id?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          airtime_enabled: boolean
          cable_tv_enabled: boolean
          created_at: string
          data_enabled: boolean
          edu_pins_enabled: boolean
          electricity_enabled: boolean
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          promotions: boolean
          service_reminders: boolean
          sms_enabled: boolean
          transaction_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          airtime_enabled?: boolean
          cable_tv_enabled?: boolean
          created_at?: string
          data_enabled?: boolean
          edu_pins_enabled?: boolean
          electricity_enabled?: boolean
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          promotions?: boolean
          service_reminders?: boolean
          sms_enabled?: boolean
          transaction_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          airtime_enabled?: boolean
          cable_tv_enabled?: boolean
          created_at?: string
          data_enabled?: boolean
          edu_pins_enabled?: boolean
          electricity_enabled?: boolean
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          promotions?: boolean
          service_reminders?: boolean
          sms_enabled?: boolean
          transaction_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          channels: string[]
          created_at: string
          id: string
          is_active: boolean
          slug: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          channels?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          body?: string
          channels?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          channel: string[]
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          channel?: string[]
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          channel?: string[]
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          deactivated_at: string | null
          email: string | null
          full_name: string
          id: string
          kyc_verified: boolean
          phone_number: string | null
          role: string | null
          transaction_pin: string | null
          transaction_pin_enabled: boolean
          transaction_pin_hash: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          full_name?: string
          id: string
          kyc_verified?: boolean
          phone_number?: string | null
          role?: string | null
          transaction_pin?: string | null
          transaction_pin_enabled?: boolean
          transaction_pin_hash?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          kyc_verified?: boolean
          phone_number?: string | null
          role?: string | null
          transaction_pin?: string | null
          transaction_pin_enabled?: boolean
          transaction_pin_hash?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reconciliation_cases: {
        Row: {
          actual_amount: number | null
          admin_notes: string | null
          created_at: string
          description: string
          expected_amount: number | null
          id: string
          issue_type: string
          metadata: Json | null
          reference: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          transaction_id: string | null
          updated_at: string
          variance: number | null
        }
        Insert: {
          actual_amount?: number | null
          admin_notes?: string | null
          created_at?: string
          description: string
          expected_amount?: number | null
          id?: string
          issue_type: string
          metadata?: Json | null
          reference?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          variance?: number | null
        }
        Update: {
          actual_amount?: number | null
          admin_notes?: string | null
          created_at?: string
          description?: string
          expected_amount?: number | null
          id?: string
          issue_type?: string
          metadata?: Json | null
          reference?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_cases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_reports: {
        Row: {
          actual_profit: number | null
          duplicate_count: number | null
          email_sent: boolean | null
          expected_profit: number | null
          failed_txns: number | null
          failure_rate: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          mismatch_count: number | null
          missing_webhook_count: number | null
          profit_variance: number | null
          report_date: string
          successful_txns: number | null
          total_deposits: number | null
          total_service_cost: number | null
          total_transactions: number | null
          total_withdrawals: number | null
        }
        Insert: {
          actual_profit?: number | null
          duplicate_count?: number | null
          email_sent?: boolean | null
          expected_profit?: number | null
          failed_txns?: number | null
          failure_rate?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mismatch_count?: number | null
          missing_webhook_count?: number | null
          profit_variance?: number | null
          report_date: string
          successful_txns?: number | null
          total_deposits?: number | null
          total_service_cost?: number | null
          total_transactions?: number | null
          total_withdrawals?: number | null
        }
        Update: {
          actual_profit?: number | null
          duplicate_count?: number | null
          email_sent?: boolean | null
          expected_profit?: number | null
          failed_txns?: number | null
          failure_rate?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mismatch_count?: number | null
          missing_webhook_count?: number | null
          profit_variance?: number | null
          report_date?: string
          successful_txns?: number | null
          total_deposits?: number | null
          total_service_cost?: number | null
          total_transactions?: number | null
          total_withdrawals?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referred_users: {
        Row: {
          created_at: string
          id: string
          is_claimed: boolean | null
          referee_is_claimed: boolean | null
          referee_reward_amount: number | null
          referred_user_id: string
          referrer_id: string
          reward_amount: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_claimed?: boolean | null
          referee_is_claimed?: boolean | null
          referee_reward_amount?: number | null
          referred_user_id: string
          referrer_id: string
          reward_amount?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_claimed?: boolean | null
          referee_is_claimed?: boolean | null
          referee_reward_amount?: number | null
          referred_user_id?: string
          referrer_id?: string
          reward_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referred_users_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referred_users_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          action_url: string | null
          audience: string
          body: string
          channel: string[]
          created_at: string
          created_by: string | null
          custom_user_ids: string[] | null
          id: string
          metadata: Json | null
          recipient_count: number | null
          scheduled_at: string
          sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          audience?: string
          body: string
          channel?: string[]
          created_at?: string
          created_by?: string | null
          custom_user_ids?: string[] | null
          id?: string
          metadata?: Json | null
          recipient_count?: number | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          audience?: string
          body?: string
          channel?: string[]
          created_at?: string
          created_by?: string | null
          custom_user_ids?: string[] | null
          id?: string
          metadata?: Json | null
          recipient_count?: number | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_configurations: {
        Row: {
          config_data: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          platform: string
        }
        Insert: {
          config_data?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          platform: string
        }
        Update: {
          config_data?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          platform?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string
          gateway: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string
          gateway: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          gateway?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          reference: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
        }
        Relationships: []
      }
      webhook_processing_logs: {
        Row: {
          attempted_at: string
          error_code: string | null
          id: string
          message: string | null
          status: string
          webhook_id: string | null
        }
        Insert: {
          attempted_at?: string
          error_code?: string | null
          id?: string
          message?: string | null
          status: string
          webhook_id?: string | null
        }
        Update: {
          attempted_at?: string
          error_code?: string | null
          id?: string
          message?: string | null
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_processing_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_daily_transaction_summary: {
        Row: {
          failed_count: number | null
          failure_rate_pct: number | null
          net_movement: number | null
          pending_count: number | null
          success_count: number | null
          total_count: number | null
          total_deposits: number | null
          total_service_spend: number | null
          txn_date: string | null
        }
        Relationships: []
      }
      v_notification_stats: {
        Row: {
          click_rate_pct: number | null
          clicked: number | null
          delivered: number | null
          failed: number | null
          open_rate_pct: number | null
          opened: number | null
          pending: number | null
          total_sent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_user_account: { Args: { auth_uid: string }; Returns: undefined }
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      handle_kvdata_webhook: {
        Args: { p_webhook_id: string }
        Returns: undefined
      }
      handle_paystack_webhook: {
        Args: { p_webhook_id: string }
        Returns: undefined
      }
      handle_vtpass_webhook: {
        Args: { p_webhook_id: string }
        Returns: undefined
      }
      make_admin: { Args: { user_id: string }; Returns: undefined }
      resolve_notification_audience: {
        Args: { p_audience: string; p_custom_ids?: string[] }
        Returns: {
          user_id: string
        }[]
      }
      run_reconciliation: { Args: { p_date?: string }; Returns: Json }
      set_transaction_pin: { Args: { p_pin: string }; Returns: undefined }
      transfer_referral_bonus: {
        Args: { amount_to_transfer: number; user_id_param: string }
        Returns: undefined
      }
      verify_transaction_pin: { Args: { p_pin: string }; Returns: boolean }
    }
    Enums: {
      transaction_status: "pending" | "success" | "failed"
      transaction_type:
        | "wallet_fund"
        | "airtime"
        | "data"
        | "cable_tv"
        | "electricity"
        | "bulk_sms"
        | "edu_pin"
        | "referral_bonus"
        | "refund"
        | "data_card"
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
      transaction_status: ["pending", "success", "failed"],
      transaction_type: [
        "wallet_fund",
        "airtime",
        "data",
        "cable_tv",
        "electricity",
        "bulk_sms",
        "edu_pin",
        "referral_bonus",
        "refund",
        "data_card",
      ],
    },
  },
} as const
