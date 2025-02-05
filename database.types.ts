export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string | null
          file_id: number | null
          id: number
          net_balance: number | null
          spending_by_category: Json | null
          total_expenses: number | null
          total_income: number | null
          unusual_transactions: Json | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          file_id?: number | null
          id?: never
          net_balance?: number | null
          spending_by_category?: Json | null
          total_expenses?: number | null
          total_income?: number | null
          unusual_transactions?: Json | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          file_id?: number | null
          id?: never
          net_balance?: number | null
          spending_by_category?: Json | null
          total_expenses?: number | null
          total_income?: number | null
          unusual_transactions?: Json | null
          user_id?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      files: {
        Row: {
          description: string | null
          file_name: string
          file_size: number
          file_url: string
          id: number
          original_file_name: string
          transaction_date_range: unknown | null
          uploaded_at: string | null
          user_id: number | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_size: number
          file_url: string
          id?: never
          original_file_name: string
          transaction_date_range?: unknown | null
          uploaded_at?: string | null
          user_id?: number | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: never
          original_file_name?: string
          transaction_date_range?: unknown | null
          uploaded_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_type: string
          amount: number
          category_id: number | null
          category_name: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          frequency: string
          id: number
          name: string
          start_date: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type: string
          amount: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: never
          name: string
          start_date: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string
          amount?: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: never
          name?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_type: string | null
          amount: number
          category_id: number | null
          category_name: string | null
          created_at: string | null
          date: string
          description: string | null
          file_id: number | null
          id: number
          name: string
          recurring_frequency: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          amount: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          file_id?: number | null
          id?: never
          name: string
          recurring_frequency?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          amount?: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          file_id?: number | null
          id?: never
          name?: string
          recurring_frequency?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_transactions: {
        Row: {
          amount: number
          category_id: number | null
          category_name: string | null
          created_at: string | null
          date: string
          id: number
          recurring_transaction_id: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          amount: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date: string
          id?: never
          recurring_transaction_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          amount?: number
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          date?: string
          id?: never
          recurring_transaction_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upcoming_transactions_recurring_transaction_id_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
