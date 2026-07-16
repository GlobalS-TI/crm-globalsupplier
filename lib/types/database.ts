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
          converted_opportunity_id: string | null
          created_at: string
          created_by: string
          email: string | null
          empresa: string | null
          id: string
          nombre: string
          requerimientos: string | null
          requirements_file_path: string | null
          responsable_id: string | null
          section_id: string
          telefono: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          converted_opportunity_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          empresa?: string | null
          id?: string
          nombre: string
          requerimientos?: string | null
          requirements_file_path?: string | null
          responsable_id?: string | null
          section_id: string
          telefono?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          converted_opportunity_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nombre?: string
          requerimientos?: string | null
          requirements_file_path?: string | null
          responsable_id?: string | null
          section_id?: string
          telefono?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["vendedor_id"]
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
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
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
      notifications: {
        Row: {
          body: string
          created_at: string
          email_error: string | null
          email_sent_at: string | null
          href: string | null
          id: string
          payload: Json
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          email_error?: string | null
          email_sent_at?: string | null
          href?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          email_error?: string | null
          email_sent_at?: string | null
          href?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          company_id: string | null
          contact_id: string | null
          cotizacion_path: string | null
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
          orden_compra_path: string | null
          owner_id: string
          probabilidad: number
          stale: boolean
          updated_at: string
        }
        Insert: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          company_id?: string | null
          contact_id?: string | null
          cotizacion_path?: string | null
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
          orden_compra_path?: string | null
          owner_id: string
          probabilidad?: number
          stale?: boolean
          updated_at?: string
        }
        Update: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          company_id?: string | null
          contact_id?: string | null
          cotizacion_path?: string | null
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
          orden_compra_path?: string | null
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
      opportunity_costs: {
        Row: {
          costo: number
          created_by: string | null
          notas: string | null
          opportunity_id: string
          updated_at: string
        }
        Insert: {
          costo?: number
          created_by?: string | null
          notas?: string | null
          opportunity_id: string
          updated_at?: string
        }
        Update: {
          costo?: number
          created_by?: string | null
          notas?: string | null
          opportunity_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_costs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
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
      project_briefs: {
        Row: {
          deadline_desired: string | null
          deadline_real: string | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string
          what: string | null
          why: string | null
        }
        Insert: {
          deadline_desired?: string | null
          deadline_real?: string | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string
          what?: string | null
          why?: string | null
        }
        Update: {
          deadline_desired?: string | null
          deadline_real?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string
          what?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decision_logs: {
        Row: {
          author_id: string | null
          created_at: string
          entry: string
          id: string
          project_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          entry: string
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          entry?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decision_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decision_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          id: string
          label: string
          project_id: string
          type: Database["public"]["Enums"]["project_file_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          project_id: string
          type?: Database["public"]["Enums"]["project_file_type"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          type?: Database["public"]["Enums"]["project_file_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_handoff_checklists: {
        Row: {
          assets_exported: boolean
          assets_note: string | null
          breakpoints_defined: boolean
          breakpoints_note: string | null
          component_states: boolean
          component_states_note: string | null
          id: string
          interactions_annotated: boolean
          interactions_note: string | null
          naming_convention: boolean
          naming_note: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          assets_exported?: boolean
          assets_note?: string | null
          breakpoints_defined?: boolean
          breakpoints_note?: string | null
          component_states?: boolean
          component_states_note?: string | null
          id?: string
          interactions_annotated?: boolean
          interactions_note?: string | null
          naming_convention?: boolean
          naming_note?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          assets_exported?: boolean
          assets_note?: string | null
          breakpoints_defined?: boolean
          breakpoints_note?: string | null
          component_states?: boolean
          component_states_note?: string | null
          id?: string
          interactions_annotated?: boolean
          interactions_note?: string | null
          naming_convention?: boolean
          naming_note?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_handoff_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          comment: string | null
          from_status: Database["public"]["Enums"]["project_status"] | null
          id: string
          project_id: string
          to_status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          comment?: string | null
          from_status?: Database["public"]["Enums"]["project_status"] | null
          id?: string
          project_id: string
          to_status: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          comment?: string | null
          from_status?: Database["public"]["Enums"]["project_status"] | null
          id?: string
          project_id?: string
          to_status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          file_label: string | null
          file_url: string | null
          id: string
          project_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          file_label?: string | null
          file_url?: string | null
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          file_label?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_archived: boolean
          requested_by_id: string | null
          stakeholder_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          tipo: Database["public"]["Enums"]["project_tipo"]
          title: string
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_archived?: boolean
          requested_by_id?: string | null
          stakeholder_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tipo?: Database["public"]["Enums"]["project_tipo"]
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_archived?: boolean
          requested_by_id?: string | null
          stakeholder_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tipo?: Database["public"]["Enums"]["project_tipo"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: number
          target_amount: number
          updated_at: string
          vendedor_id: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          target_amount?: number
          updated_at?: string
          vendedor_id: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          target_amount?: number
          updated_at?: string
          vendedor_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          assigned_to: string | null
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
          assigned_to?: string | null
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
          assigned_to?: string | null
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
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      can_manage_projects: { Args: never; Returns: boolean }
      is_active_owner: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_comisiones_viewer: { Args: never; Returns: boolean }
      is_content_manager: { Args: never; Returns: boolean }
      is_content_team: { Args: never; Returns: boolean }
      is_full_access: { Args: never; Returns: boolean }
      is_leads_manager: { Args: never; Returns: boolean }
      is_project_admin: { Args: never; Returns: boolean }
      is_project_team: { Args: never; Returns: boolean }
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
      project_file_type: "FIGMA" | "REPO" | "ASSET" | "DOC" | "OTHER"
      project_status:
        | "INCOMING"
        | "ANALYSIS"
        | "DESIGN"
        | "DEVELOPMENT"
        | "QA"
        | "DELIVERED"
        | "ORDEN_COMPRA"
        | "FACTURACION"
        | "SEGUIMIENTO"
        | "CIERRE"
      project_tipo: "DISENO" | "INDUSTRIAL"
      task_column_type:
        | "text"
        | "number"
        | "date"
        | "selector"
        | "person"
        | "url"
        | "business_unit"
        | "archivo"
        | "multi_selector"
        | "priority"
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
      project_file_type: ["FIGMA", "REPO", "ASSET", "DOC", "OTHER"],
      project_status: [
        "INCOMING",
        "ANALYSIS",
        "DESIGN",
        "DEVELOPMENT",
        "QA",
        "DELIVERED",
        "ORDEN_COMPRA",
        "FACTURACION",
        "SEGUIMIENTO",
        "CIERRE",
      ],
      project_tipo: ["DISENO", "INDUSTRIAL"],
      task_column_type: [
        "text",
        "number",
        "date",
        "selector",
        "person",
        "url",
        "business_unit",
        "archivo",
        "multi_selector",
        "priority",
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

