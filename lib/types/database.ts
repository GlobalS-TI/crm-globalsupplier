export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          completed_at: string | null
          created_at: string
          descripcion: string | null
          estatus: Database["public"]["Enums"]["activity_status"]
          fecha: string
          id: string
          opportunity_id: string
          owner_id: string
          tipo: Database["public"]["Enums"]["activity_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: Database["public"]["Enums"]["activity_status"]
          fecha: string
          id?: string
          opportunity_id: string
          owner_id: string
          tipo: Database["public"]["Enums"]["activity_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: Database["public"]["Enums"]["activity_status"]
          fecha?: string
          id?: string
          opportunity_id?: string
          owner_id?: string
          tipo?: Database["public"]["Enums"]["activity_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ciudad: string | null
          created_at: string
          estado: string | null
          id: string
          industria: string | null
          nombre: string
          notas: string | null
          owner_id: string
          rfc: string | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          industria?: string | null
          nombre: string
          notas?: string | null
          owner_id: string
          rfc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          industria?: string | null
          nombre?: string
          notas?: string | null
          owner_id?: string
          rfc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          apellido: string | null
          celular: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          nombre: string
          notas: string | null
          owner_id: string
          puesto: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          celular?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          owner_id: string
          puesto?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          celular?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          owner_id?: string
          puesto?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          created_at: string
          icono: string | null
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icono?: string | null
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_files: {
        Row: {
          created_at: string
          file_path: string | null
          file_size: number | null
          id: string
          item_id: string
          mime_type: string | null
          nombre: string
          owner_id: string
          tipo: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          item_id: string
          mime_type?: string | null
          nombre: string
          owner_id: string
          tipo: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          item_id?: string
          mime_type?: string | null
          nombre?: string
          owner_id?: string
          tipo?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_files_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          category_id: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          category_id: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          category_id?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sections: {
        Row: {
          created_at: string
          created_by: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          created_by: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          created_by?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_opportunity_id: string | null
          created_at: string
          created_by: string
          email: string | null
          empresa: string | null
          id: string
          nombre: string
          requerimientos: string | null
          requirements_file_path: string | null
          section_id: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          empresa?: string | null
          id?: string
          nombre: string
          requerimientos?: string | null
          requirements_file_path?: string | null
          section_id: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nombre?: string
          requerimientos?: string | null
          requirements_file_path?: string | null
          section_id?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_opportunity_id_fkey"
            columns: ["converted_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lead_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          company_id: string | null
          contact_id: string | null
          created_at: string
          etapa: Database["public"]["Enums"]["opportunity_stage"]
          fecha_cierre_estimada: string | null
          fuente: Database["public"]["Enums"]["lead_source"]
          id: string
          last_activity_at: string
          monto_estimado: number
          monto_final: number | null
          next_activity_at: string | null
          nombre: string
          notas: string | null
          owner_id: string
          probabilidad: number
          stale: boolean
          updated_at: string
        }
        Insert: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          etapa?: Database["public"]["Enums"]["opportunity_stage"]
          fecha_cierre_estimada?: string | null
          fuente: Database["public"]["Enums"]["lead_source"]
          id?: string
          last_activity_at?: string
          monto_estimado?: number
          monto_final?: number | null
          next_activity_at?: string | null
          nombre: string
          notas?: string | null
          owner_id: string
          probabilidad?: number
          stale?: boolean
          updated_at?: string
        }
        Update: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          etapa?: Database["public"]["Enums"]["opportunity_stage"]
          fecha_cierre_estimada?: string | null
          fuente?: Database["public"]["Enums"]["lead_source"]
          id?: string
          last_activity_at?: string
          monto_estimado?: number
          monto_final?: number | null
          next_activity_at?: string | null
          nombre?: string
          notas?: string | null
          owner_id?: string
          probabilidad?: number
          stale?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_business_units: {
        Row: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          profile_id: string
        }
        Insert: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          profile_id: string
        }
        Update: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_business_units_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      task_board_columns: {
        Row: {
          board_id: string
          config: Json
          created_at: string
          id: string
          nombre: string
          position: number
          tipo: Database["public"]["Enums"]["task_column_type"]
        }
        Insert: {
          board_id: string
          config?: Json
          created_at?: string
          id?: string
          nombre: string
          position?: number
          tipo?: Database["public"]["Enums"]["task_column_type"]
        }
        Update: {
          board_id?: string
          config?: Json
          created_at?: string
          id?: string
          nombre?: string
          position?: number
          tipo?: Database["public"]["Enums"]["task_column_type"]
        }
        Relationships: [
          {
            foreignKeyName: "task_board_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      task_boards: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          nombre?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_column_values: {
        Row: {
          column_id: string
          task_id: string
          value: string | null
        }
        Insert: {
          column_id: string
          task_id: string
          value?: string | null
        }
        Update: {
          column_id?: string
          task_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_column_values_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "task_board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_column_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          board_id: string
          color: string
          created_at: string
          id: string
          nombre: string
          position: number
        }
        Insert: {
          board_id: string
          color?: string
          created_at?: string
          id?: string
          nombre: string
          position?: number
        }
        Update: {
          board_id?: string
          color?: string
          created_at?: string
          id?: string
          nombre?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_groups_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          board_id: string
          created_at: string
          created_by: string
          fecha_entrega: string | null
          group_id: string | null
          id: string
          opportunity_id: string | null
          position: number
          titulo: string
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          created_by: string
          fecha_entrega?: string | null
          group_id?: string | null
          id?: string
          opportunity_id?: string | null
          position?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          created_by?: string
          fecha_entrega?: string | null
          group_id?: string | null
          id?: string
          opportunity_id?: string | null
          position?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_leads: { Args: never; Returns: boolean }
      is_content_manager: { Args: never; Returns: boolean }
      is_full_access: { Args: never; Returns: boolean }
      is_leads_manager: { Args: never; Returns: boolean }
      mark_stale_opportunities: { Args: never; Returns: number }
      owns_opportunity: { Args: { opp_id: string }; Returns: boolean }
      recompute_opportunity_stale: {
        Args: { opp_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activity_status: "pendiente" | "completada" | "cancelada"
      activity_type:
        | "llamada"
        | "email"
        | "reunion"
        | "demo"
        | "propuesta"
        | "seguimiento"
        | "otro"
      business_unit:
        | "global_supplier_mty"
        | "thunder_safety"
        | "thunder_led"
        | "got_fresh_breath"
        | "gtx_systems"
        | "juno_promotional"
        | "fire_spot"
      lead_source:
        | "referido"
        | "web"
        | "linkedin"
        | "llamada_en_frio"
        | "evento"
        | "alianza"
        | "otro"
      opportunity_stage:
        | "nuevo_lead"
        | "contactado"
        | "diagnostico"
        | "cotizacion_enviada"
        | "seguimiento"
        | "negociacion"
        | "ganado"
        | "perdido"
      task_column_type:
        | "text"
        | "number"
        | "date"
        | "selector"
        | "person"
        | "url"
        | "business_unit"
      user_role:
        | "director_general"
        | "direccion_comercial"
        | "vendedor"
        | "marketing"
        | "administracion"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_status: ["pendiente", "completada", "cancelada"],
      activity_type: [
        "llamada",
        "email",
        "reunion",
        "demo",
        "propuesta",
        "seguimiento",
        "otro",
      ],
      business_unit: [
        "global_supplier_mty",
        "thunder_safety",
        "thunder_led",
        "got_fresh_breath",
        "gtx_systems",
        "juno_promotional",
        "fire_spot",
      ],
      lead_source: [
        "referido",
        "web",
        "linkedin",
        "llamada_en_frio",
        "evento",
        "alianza",
        "otro",
      ],
      opportunity_stage: [
        "nuevo_lead",
        "contactado",
        "diagnostico",
        "cotizacion_enviada",
        "seguimiento",
        "negociacion",
        "ganado",
        "perdido",
      ],
      task_column_type: [
        "text",
        "number",
        "date",
        "selector",
        "person",
        "url",
        "business_unit",
      ],
      user_role: [
        "director_general",
        "direccion_comercial",
        "vendedor",
        "marketing",
        "administracion",
      ],
    },
  },
} as const

