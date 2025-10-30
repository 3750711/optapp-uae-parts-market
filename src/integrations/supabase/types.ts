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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_operation_backups: {
        Row: {
          backup_data: Json
          created_at: string
          created_by: string | null
          id: string
          operation_type: string
          restored_at: string | null
          user_id: string
        }
        Insert: {
          backup_data: Json
          created_at?: string
          created_by?: string | null
          id?: string
          operation_type: string
          restored_at?: string | null
          user_id: string
        }
        Update: {
          backup_data?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          operation_type?: string
          restored_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_correction_analysis: {
        Row: {
          ai_suggestion: string
          analysis_version: string
          differences: Json
          extracted_rules: Json
          id: string
          moderator_correction: string
          moderator_id: string | null
          processed_at: string
          product_id: string | null
        }
        Insert: {
          ai_suggestion: string
          analysis_version?: string
          differences?: Json
          extracted_rules?: Json
          id?: string
          moderator_correction: string
          moderator_id?: string | null
          processed_at?: string
          product_id?: string | null
        }
        Update: {
          ai_suggestion?: string
          analysis_version?: string
          differences?: Json
          extracted_rules?: Json
          id?: string
          moderator_correction?: string
          moderator_id?: string | null
          processed_at?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_correction_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correction_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correction_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_enrichment_logs: {
        Row: {
          ai_response: Json
          confidence: number | null
          created_at: string | null
          id: string
          input_data: Json
          processing_time_ms: number | null
          product_id: string | null
        }
        Insert: {
          ai_response: Json
          confidence?: number | null
          created_at?: string | null
          id?: string
          input_data: Json
          processing_time_ms?: number | null
          product_id?: string | null
        }
        Update: {
          ai_response?: Json
          confidence?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json
          processing_time_ms?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_enrichment_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enrichment_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enrichment_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_moderation_corrections: {
        Row: {
          ai_confidence: number | null
          ai_original_title: string
          ai_suggested_brand: string | null
          ai_suggested_model: string | null
          ai_suggested_title: string | null
          correction_type: string
          created_at: string
          id: string
          moderator_corrected_brand: string | null
          moderator_corrected_model: string | null
          moderator_corrected_title: string
          moderator_id: string | null
          product_id: string | null
          was_ai_accepted: boolean | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_original_title: string
          ai_suggested_brand?: string | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          correction_type?: string
          created_at?: string
          id?: string
          moderator_corrected_brand?: string | null
          moderator_corrected_model?: string | null
          moderator_corrected_title: string
          moderator_id?: string | null
          product_id?: string | null
          was_ai_accepted?: boolean | null
        }
        Update: {
          ai_confidence?: number | null
          ai_original_title?: string
          ai_suggested_brand?: string | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          correction_type?: string
          created_at?: string
          id?: string
          moderator_corrected_brand?: string | null
          moderator_corrected_model?: string | null
          moderator_corrected_title?: string
          moderator_id?: string | null
          product_id?: string | null
          was_ai_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_corrections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_corrections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_corrections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_data: {
        Row: {
          brand_detected: string | null
          corrected_text: string
          created_at: string | null
          id: string
          model_detected: string | null
          moderator_corrections: Json | null
          moderator_id: string | null
          original_text: string
        }
        Insert: {
          brand_detected?: string | null
          corrected_text: string
          created_at?: string | null
          id?: string
          model_detected?: string | null
          moderator_corrections?: Json | null
          moderator_id?: string | null
          original_text: string
        }
        Update: {
          brand_detected?: string | null
          corrected_text?: string
          created_at?: string | null
          id?: string
          model_detected?: string | null
          moderator_corrections?: Json | null
          moderator_id?: string | null
          original_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_data_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_translation_rules: {
        Row: {
          confidence_score: number
          corrected_phrase: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          language_pair: string
          last_used_at: string | null
          original_phrase: string
          rule_type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          confidence_score?: number
          corrected_phrase: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language_pair?: string
          last_used_at?: string | null
          original_phrase: string
          rule_type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          confidence_score?: number
          corrected_phrase?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language_pair?: string
          last_used_at?: string | null
          original_phrase?: string
          rule_type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      car_brands: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      confirm_images: {
        Row: {
          category: string | null
          created_at: string
          id: string
          order_id: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          order_id: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          order_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirm_images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      containers: {
        Row: {
          container_number: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["container_status"]
          updated_at: string
        }
        Insert: {
          container_number: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["container_status"]
          updated_at?: string
        }
        Update: {
          container_number?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["container_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ip_address: unknown
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ip_address?: unknown
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          used?: boolean | null
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          event_subtype: string | null
          id: string
          ip_address: unknown
          path: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details: Json
          entity_id?: string | null
          entity_type: string
          event_subtype?: string | null
          id?: string
          ip_address?: unknown
          path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          event_subtype?: string | null
          id?: string
          ip_address?: unknown
          path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      free_order_upload_logs: {
        Row: {
          compressed_size: number | null
          compression_ratio: number | null
          created_at: string
          duration_ms: number | null
          error_details: string | null
          file_url: string | null
          id: number
          method: string | null
          order_id: string | null
          original_size: number | null
          status: string
          trace_id: string | null
          user_id: string | null
        }
        Insert: {
          compressed_size?: number | null
          compression_ratio?: number | null
          created_at?: string
          duration_ms?: number | null
          error_details?: string | null
          file_url?: string | null
          id?: number
          method?: string | null
          order_id?: string | null
          original_size?: number | null
          status: string
          trace_id?: string | null
          user_id?: string | null
        }
        Update: {
          compressed_size?: number | null
          compression_ratio?: number | null
          created_at?: string
          duration_ms?: number | null
          error_details?: string | null
          file_url?: string | null
          id?: number
          method?: string | null
          order_id?: string | null
          original_size?: number | null
          status?: string
          trace_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_free_order_upload_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_free_order_upload_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          order_index: number
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          order_index?: number
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          order_index?: number
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_items: {
        Row: {
          answer: string
          category_id: string
          created_at: string
          id: string
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category_id: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category_id?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          error_message: string | null
          id: string
          identifier: string
          ip_address: unknown
          success: boolean
        }
        Insert: {
          attempt_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          identifier: string
          ip_address?: unknown
          success?: boolean
        }
        Update: {
          attempt_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          identifier?: string
          ip_address?: unknown
          success?: boolean
        }
        Relationships: []
      }
      logistics_exports: {
        Row: {
          created_at: string
          created_by: string
          file_name: string
          file_url: string
          id: string
          order_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          file_name: string
          file_url: string
          id?: string
          order_count: number
        }
        Update: {
          created_at?: string
          created_by?: string
          file_name?: string
          file_url?: string
          id?: string
          order_count?: number
        }
        Relationships: []
      }
      message_history: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_count: number | null
          id: string
          image_urls: string[] | null
          message_text: string
          recipient_group: string | null
          recipient_ids: string[]
          sender_id: string
          sent_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          image_urls?: string[] | null
          message_text: string
          recipient_group?: string | null
          recipient_ids: string[]
          sender_id: string
          sent_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          image_urls?: string[] | null
          message_text?: string
          recipient_group?: string | null
          recipient_ids?: string[]
          sender_id?: string
          sent_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          language: string | null
          message: string | null
          message_en: string | null
          read: boolean
          title: string
          title_en: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          language?: string | null
          message?: string | null
          message_en?: string | null
          read?: boolean
          title: string
          title_en?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          language?: string | null
          message?: string | null
          message_en?: string | null
          read?: boolean
          title?: string
          title_en?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          order_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_media: {
        Row: {
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          order_id: string
          public_id: string | null
          source: string | null
          uploaded_by: number | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string
          file_url: string
          id?: string
          order_id: string
          public_id?: string | null
          source?: string | null
          uploaded_by?: number | null
        }
        Update: {
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          order_id?: string
          public_id?: string | null
          source?: string | null
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_media_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipment_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          changed_field: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          order_shipment_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          changed_field: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          order_shipment_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          changed_field?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          order_shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipment_history_order_shipment_id_fkey"
            columns: ["order_shipment_id"]
            isOneToOne: false
            referencedRelation: "order_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          container_number: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          place_number: number
          shipment_status: Database["public"]["Enums"]["shipment_status_individual"]
          updated_at: string
        }
        Insert: {
          container_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          place_number: number
          shipment_status?: Database["public"]["Enums"]["shipment_status_individual"]
          updated_at?: string
        }
        Update: {
          container_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          place_number?: number
          shipment_status?: Database["public"]["Enums"]["shipment_status_individual"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_videos: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_videos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          brand: string
          buyer_id: string
          buyer_opt_id: string | null
          container_number: string | null
          created_at: string
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          delivery_price_confirm: number | null
          description: string | null
          id: string
          images: string[] | null
          is_modified: boolean | null
          last_notification_hash: string | null
          last_notification_sent_at: string | null
          lot_number_order: number | null
          model: string
          order_created_type: Database["public"]["Enums"]["order_created_type"]
          order_number: number
          order_seller_name: string
          place_number: number
          price: number
          product_id: string | null
          quantity: number
          ready_for_shipment: boolean
          seller_id: string
          seller_opt_id: string | null
          shipment_status: Database["public"]["Enums"]["shipment_status"] | null
          status: Database["public"]["Enums"]["order_status"]
          telegram_url_buyer: string | null
          telegram_url_order: string | null
          text_order: string | null
          title: string
          video_url: string[] | null
        }
        Insert: {
          brand: string
          buyer_id: string
          buyer_opt_id?: string | null
          container_number?: string | null
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          delivery_price_confirm?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_modified?: boolean | null
          last_notification_hash?: string | null
          last_notification_sent_at?: string | null
          lot_number_order?: number | null
          model: string
          order_created_type?: Database["public"]["Enums"]["order_created_type"]
          order_number: number
          order_seller_name?: string
          place_number?: number
          price: number
          product_id?: string | null
          quantity?: number
          ready_for_shipment?: boolean
          seller_id: string
          seller_opt_id?: string | null
          shipment_status?:
            | Database["public"]["Enums"]["shipment_status"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          telegram_url_buyer?: string | null
          telegram_url_order?: string | null
          text_order?: string | null
          title: string
          video_url?: string[] | null
        }
        Update: {
          brand?: string
          buyer_id?: string
          buyer_opt_id?: string | null
          container_number?: string | null
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          delivery_price_confirm?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_modified?: boolean | null
          last_notification_hash?: string | null
          last_notification_sent_at?: string | null
          lot_number_order?: number | null
          model?: string
          order_created_type?: Database["public"]["Enums"]["order_created_type"]
          order_number?: number
          order_seller_name?: string
          place_number?: number
          price?: number
          product_id?: string | null
          quantity?: number
          ready_for_shipment?: boolean
          seller_id?: string
          seller_opt_id?: string | null
          shipment_status?:
            | Database["public"]["Enums"]["shipment_status"]
            | null
          status?: Database["public"]["Enums"]["order_status"]
          telegram_url_buyer?: string | null
          telegram_url_order?: string | null
          text_order?: string | null
          title?: string
          video_url?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_container_number"
            columns: ["container_number"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["container_number"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preverified_emails: {
        Row: {
          created_at: string
          email: string
          ip: unknown
          verified_at: string
        }
        Insert: {
          created_at?: string
          email: string
          ip?: unknown
          verified_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          ip?: unknown
          verified_at?: string
        }
        Relationships: []
      }
      price_offers: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          expires_at: string
          id: string
          message: string | null
          offered_price: number
          order_id: string | null
          original_price: number
          product_id: string
          seller_id: string
          seller_response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          expires_at?: string
          id?: string
          message?: string | null
          offered_price: number
          order_id?: string | null
          original_price: number
          product_id: string
          seller_id: string
          seller_response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          expires_at?: string
          id?: string
          message?: string | null
          offered_price?: number
          order_id?: string | null
          original_price?: number
          product_id?: string
          seller_id?: string
          seller_response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_embeddings: {
        Row: {
          content_hash: string
          created_at: string
          embedding: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          embedding: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          embedding?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      product_upload_logs: {
        Row: {
          compressed_size: number | null
          compression_ratio: number | null
          context: string
          created_at: string
          duration_ms: number | null
          error_details: string | null
          file_url: string | null
          id: number
          metadata: Json | null
          method: string | null
          order_id: string | null
          original_size: number | null
          product_id: string | null
          status: string
          step_name: string | null
          trace_id: string | null
          user_id: string | null
        }
        Insert: {
          compressed_size?: number | null
          compression_ratio?: number | null
          context?: string
          created_at?: string
          duration_ms?: number | null
          error_details?: string | null
          file_url?: string | null
          id?: number
          metadata?: Json | null
          method?: string | null
          order_id?: string | null
          original_size?: number | null
          product_id?: string | null
          status: string
          step_name?: string | null
          trace_id?: string | null
          user_id?: string | null
        }
        Update: {
          compressed_size?: number | null
          compression_ratio?: number | null
          context?: string
          created_at?: string
          duration_ms?: number | null
          error_details?: string | null
          file_url?: string | null
          id?: number
          metadata?: Json | null
          method?: string | null
          order_id?: string | null
          original_size?: number | null
          product_id?: string | null
          status?: string
          step_name?: string | null
          trace_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_videos: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_view_estimate"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_notification_sent_at: string | null
          ai_confidence: number | null
          ai_delivery_confidence: number | null
          ai_delivery_reasoning: Json | null
          ai_enriched_at: string | null
          ai_original_title: string | null
          ai_suggested_brand: string | null
          ai_suggested_delivery_prices: Json | null
          ai_suggested_model: string | null
          ai_suggested_title: string | null
          brand: string
          catalog_position: string
          cloudinary_public_id: string | null
          cloudinary_url: string | null
          condition: string
          created_at: string
          delivery_price: number | null
          description: string | null
          id: string
          last_notification_sent_at: string | null
          location: string | null
          lot_number: number
          model: string | null
          optid_created: string | null
          phone_url: string | null
          place_number: number | null
          preview_image_url: string | null
          price: number
          product_location: string | null
          product_url: string | null
          rating_seller: number | null
          requires_moderation: boolean | null
          seller_id: string
          seller_name: string
          status: Database["public"]["Enums"]["product_status"]
          telegram_confirmed_at: string | null
          telegram_last_error: string | null
          telegram_message_id: number | null
          telegram_notification_status: string | null
          telegram_url: string | null
          tg_notify_attempts: number
          tg_notify_error: string | null
          tg_notify_status: string
          tg_views_frozen: number | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          admin_notification_sent_at?: string | null
          ai_confidence?: number | null
          ai_delivery_confidence?: number | null
          ai_delivery_reasoning?: Json | null
          ai_enriched_at?: string | null
          ai_original_title?: string | null
          ai_suggested_brand?: string | null
          ai_suggested_delivery_prices?: Json | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          brand: string
          catalog_position?: string
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition: string
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          last_notification_sent_at?: string | null
          location?: string | null
          lot_number?: number
          model?: string | null
          optid_created?: string | null
          phone_url?: string | null
          place_number?: number | null
          preview_image_url?: string | null
          price: number
          product_location?: string | null
          product_url?: string | null
          rating_seller?: number | null
          requires_moderation?: boolean | null
          seller_id: string
          seller_name: string
          status?: Database["public"]["Enums"]["product_status"]
          telegram_confirmed_at?: string | null
          telegram_last_error?: string | null
          telegram_message_id?: number | null
          telegram_notification_status?: string | null
          telegram_url?: string | null
          tg_notify_attempts?: number
          tg_notify_error?: string | null
          tg_notify_status?: string
          tg_views_frozen?: number | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          admin_notification_sent_at?: string | null
          ai_confidence?: number | null
          ai_delivery_confidence?: number | null
          ai_delivery_reasoning?: Json | null
          ai_enriched_at?: string | null
          ai_original_title?: string | null
          ai_suggested_brand?: string | null
          ai_suggested_delivery_prices?: Json | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          brand?: string
          catalog_position?: string
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition?: string
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          last_notification_sent_at?: string | null
          location?: string | null
          lot_number?: number
          model?: string | null
          optid_created?: string | null
          phone_url?: string | null
          place_number?: number | null
          preview_image_url?: string | null
          price?: number
          product_location?: string | null
          product_url?: string | null
          rating_seller?: number | null
          requires_moderation?: boolean | null
          seller_id?: string
          seller_name?: string
          status?: Database["public"]["Enums"]["product_status"]
          telegram_confirmed_at?: string | null
          telegram_last_error?: string | null
          telegram_message_id?: number | null
          telegram_notification_status?: string | null
          telegram_url?: string | null
          tg_notify_attempts?: number
          tg_notify_error?: string | null
          tg_notify_status?: string
          tg_views_frozen?: number | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_profile_id: string
          accessor_id: string
          context_data: Json | null
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_profile_id: string
          accessor_id: string
          context_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_profile_id?: string
          accessor_id?: string
          context_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_privacy: boolean
          accepted_privacy_at: string | null
          accepted_terms: boolean
          accepted_terms_at: string | null
          admin_new_user_notified_at: string | null
          auth_method: string | null
          avatar_url: string | null
          communication_ability: number | null
          company_name: string | null
          created_at: string
          description_user: string | null
          email: string
          email_confirmed: boolean | null
          first_login_completed: boolean
          fts: unknown
          full_name: string | null
          has_password: boolean | null
          id: string
          is_trusted_seller: boolean
          last_login: string | null
          listing_count: number
          location: string | null
          opt_id: string | null
          opt_status: Database["public"]["Enums"]["opt_user_status"]
          phone: string | null
          preferred_locale: string | null
          profile_completed: boolean | null
          public_share_created_at: string | null
          public_share_enabled: boolean | null
          public_share_expires_at: string | null
          public_share_token: string | null
          rating: number | null
          telegram: string | null
          telegram_edit_count: number | null
          telegram_id: number | null
          user_type: Database["public"]["Enums"]["user_type"]
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          accepted_privacy?: boolean
          accepted_privacy_at?: string | null
          accepted_terms?: boolean
          accepted_terms_at?: string | null
          admin_new_user_notified_at?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          communication_ability?: number | null
          company_name?: string | null
          created_at?: string
          description_user?: string | null
          email: string
          email_confirmed?: boolean | null
          first_login_completed?: boolean
          fts?: unknown
          full_name?: string | null
          has_password?: boolean | null
          id: string
          is_trusted_seller?: boolean
          last_login?: string | null
          listing_count?: number
          location?: string | null
          opt_id?: string | null
          opt_status?: Database["public"]["Enums"]["opt_user_status"]
          phone?: string | null
          preferred_locale?: string | null
          profile_completed?: boolean | null
          public_share_created_at?: string | null
          public_share_enabled?: boolean | null
          public_share_expires_at?: string | null
          public_share_token?: string | null
          rating?: number | null
          telegram?: string | null
          telegram_edit_count?: number | null
          telegram_id?: number | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          accepted_privacy?: boolean
          accepted_privacy_at?: string | null
          accepted_terms?: boolean
          accepted_terms_at?: string | null
          admin_new_user_notified_at?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          communication_ability?: number | null
          company_name?: string | null
          created_at?: string
          description_user?: string | null
          email?: string
          email_confirmed?: boolean | null
          first_login_completed?: boolean
          fts?: unknown
          full_name?: string | null
          has_password?: boolean | null
          id?: string
          is_trusted_seller?: boolean
          last_login?: string | null
          listing_count?: number
          location?: string | null
          opt_id?: string | null
          opt_status?: Database["public"]["Enums"]["opt_user_status"]
          phone?: string | null
          preferred_locale?: string | null
          profile_completed?: boolean | null
          public_share_created_at?: string | null
          public_share_enabled?: boolean | null
          public_share_expires_at?: string | null
          public_share_token?: string | null
          rating?: number | null
          telegram?: string | null
          telegram_edit_count?: number | null
          telegram_id?: number | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      request_answers: {
        Row: {
          created_at: string
          id: string
          images: string[] | null
          price: number | null
          request_id: string
          response_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          images?: string[] | null
          price?: number | null
          request_id: string
          response_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: string[] | null
          price?: number | null
          request_id?: string
          response_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_answers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          brand: string | null
          created_at: string
          description: string
          id: string
          model: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          user_name: string
          vin: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          description: string
          id?: string
          model?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          user_name: string
          vin?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          description?: string
          id?: string
          model?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          vin?: string | null
        }
        Relationships: []
      }
      saved_action_logs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          log_count: number
          logs: Json
          name: string
          saved_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          log_count: number
          logs: Json
          name: string
          saved_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          log_count?: number
          logs?: Json
          name?: string
          saved_by?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string
          filters: Json
          id: string
          ip_address: unknown
          query: string
          results_count: number
          threshold: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          ip_address?: unknown
          query: string
          results_count?: number
          threshold?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          ip_address?: unknown
          query?: string
          results_count?: number
          threshold?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_synonyms: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          language: string
          original_term: string
          synonym: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          original_term: string
          synonym: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          original_term?: string
          synonym?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_synonyms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_synonyms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_car_brands: {
        Row: {
          car_brand_id: string
          created_at: string
          id: string
          store_id: string
        }
        Insert: {
          car_brand_id: string
          created_at?: string
          id?: string
          store_id: string
        }
        Update: {
          car_brand_id?: string
          created_at?: string
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_car_brands_car_brand_id_fkey"
            columns: ["car_brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_car_brands_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_car_brands_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_car_models: {
        Row: {
          car_model_id: string
          created_at: string
          id: string
          store_id: string
        }
        Insert: {
          car_model_id: string
          created_at?: string
          id?: string
          store_id: string
        }
        Update: {
          car_model_id?: string
          created_at?: string
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_car_models_car_model_id_fkey"
            columns: ["car_model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_car_models_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_car_models_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_images: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          store_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          store_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          store_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_public_access_logs: {
        Row: {
          accessed_at: string | null
          id: string
          ip_address: unknown
          referer: string | null
          store_id: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          referer?: string | null
          store_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          referer?: string | null
          store_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_public_access_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_public_access_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          owner_name: string | null
          phone: string | null
          rating: number | null
          reviews_count: number
          seller_id: string | null
          tags: Database["public"]["Enums"]["store_tag"][] | null
          telegram: string | null
          updated_at: string | null
          verified: boolean
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          owner_name?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number
          seller_id?: string | null
          tags?: Database["public"]["Enums"]["store_tag"][] | null
          telegram?: string | null
          updated_at?: string | null
          verified?: boolean
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_name?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number
          seller_id?: string | null
          tags?: Database["public"]["Enums"]["store_tag"][] | null
          telegram?: string | null
          updated_at?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stores_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metadata: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      telegram_accounts_config: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_local: boolean
          telegram_username: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_local?: boolean
          telegram_username: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_local?: boolean
          telegram_username?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_notifications_log: {
        Row: {
          created_at: string
          error_details: Json | null
          function_name: string
          id: string
          message_text: string
          metadata: Json | null
          notification_type: string
          recipient_identifier: string
          recipient_name: string | null
          recipient_type: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          telegram_message_id: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          function_name: string
          id?: string
          message_text: string
          metadata?: Json | null
          notification_type: string
          recipient_identifier: string
          recipient_name?: string | null
          recipient_type: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          telegram_message_id?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          function_name?: string
          id?: string
          message_text?: string
          metadata?: Json | null
          notification_type?: string
          recipient_identifier?: string
          recipient_name?: string | null
          recipient_type?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          telegram_message_id?: string | null
        }
        Relationships: []
      }
      telegram_user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id: string
          user_id: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          user_id?: number
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          last_activity_time: string | null
          session_timeout_minutes: number | null
          started_at: string
          termination_details: string | null
          termination_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          last_activity_time?: string | null
          session_timeout_minutes?: number | null
          started_at: string
          termination_details?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          last_activity_time?: string | null
          session_timeout_minutes?: number | null
          started_at?: string
          termination_details?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_public_settings: {
        Row: {
          key: string | null
          value: string | null
        }
        Insert: {
          key?: string | null
          value?: string | null
        }
        Update: {
          key?: string | null
          value?: string | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          ai_confidence: number | null
          ai_enriched_at: string | null
          ai_original_title: string | null
          ai_suggested_brand: string | null
          ai_suggested_model: string | null
          ai_suggested_title: string | null
          brand: string | null
          catalog_position: string | null
          cloudinary_public_id: string | null
          cloudinary_url: string | null
          condition: string | null
          created_at: string | null
          delivery_price: number | null
          description: string | null
          id: string | null
          lot_number: number | null
          model: string | null
          optid_created: string | null
          phone_url: string | null
          place_number: number | null
          preview_image_url: string | null
          price: number | null
          product_location: string | null
          rating_seller: number | null
          requires_moderation: boolean | null
          seller_id: string | null
          seller_name: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          telegram_url: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_enriched_at?: string | null
          ai_original_title?: string | null
          ai_suggested_brand?: string | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          brand?: string | null
          catalog_position?: string | null
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_price?: never
          description?: string | null
          id?: string | null
          lot_number?: number | null
          model?: string | null
          optid_created?: never
          phone_url?: never
          place_number?: number | null
          preview_image_url?: string | null
          price?: never
          product_location?: string | null
          rating_seller?: never
          requires_moderation?: boolean | null
          seller_id?: never
          seller_name?: never
          status?: Database["public"]["Enums"]["product_status"] | null
          telegram_url?: never
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ai_confidence?: number | null
          ai_enriched_at?: string | null
          ai_original_title?: string | null
          ai_suggested_brand?: string | null
          ai_suggested_model?: string | null
          ai_suggested_title?: string | null
          brand?: string | null
          catalog_position?: string | null
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_price?: never
          description?: string | null
          id?: string | null
          lot_number?: number | null
          model?: string | null
          optid_created?: never
          phone_url?: never
          place_number?: number | null
          preview_image_url?: string | null
          price?: never
          product_location?: string | null
          rating_seller?: never
          requires_moderation?: boolean | null
          seller_id?: never
          seller_name?: never
          status?: Database["public"]["Enums"]["product_status"] | null
          telegram_url?: never
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      products_with_view_estimate: {
        Row: {
          admin_notification_sent_at: string | null
          brand: string | null
          catalog_position: string | null
          cloudinary_public_id: string | null
          cloudinary_url: string | null
          condition: string | null
          created_at: string | null
          delivery_price: number | null
          description: string | null
          id: string | null
          last_notification_sent_at: string | null
          location: string | null
          lot_number: number | null
          model: string | null
          optid_created: string | null
          phone_url: string | null
          place_number: number | null
          preview_image_url: string | null
          price: number | null
          product_location: string | null
          product_url: string | null
          rating_seller: number | null
          seller_id: string | null
          seller_name: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          telegram_url: string | null
          tg_notify_attempts: number | null
          tg_notify_error: string | null
          tg_notify_status: string | null
          tg_views_estimate: number | null
          tg_views_frozen: number | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          admin_notification_sent_at?: string | null
          brand?: string | null
          catalog_position?: string | null
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_price?: number | null
          description?: string | null
          id?: string | null
          last_notification_sent_at?: string | null
          location?: string | null
          lot_number?: number | null
          model?: string | null
          optid_created?: string | null
          phone_url?: string | null
          place_number?: number | null
          preview_image_url?: string | null
          price?: number | null
          product_location?: string | null
          product_url?: string | null
          rating_seller?: number | null
          seller_id?: string | null
          seller_name?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          telegram_url?: string | null
          tg_notify_attempts?: number | null
          tg_notify_error?: string | null
          tg_notify_status?: string | null
          tg_views_estimate?: never
          tg_views_frozen?: number | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          admin_notification_sent_at?: string | null
          brand?: string | null
          catalog_position?: string | null
          cloudinary_public_id?: string | null
          cloudinary_url?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_price?: number | null
          description?: string | null
          id?: string | null
          last_notification_sent_at?: string | null
          location?: string | null
          lot_number?: number | null
          model?: string | null
          optid_created?: string | null
          phone_url?: string | null
          place_number?: number | null
          preview_image_url?: string | null
          price?: number | null
          product_location?: string | null
          product_url?: string | null
          rating_seller?: number | null
          seller_id?: string | null
          seller_name?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          telegram_url?: string | null
          tg_notify_attempts?: number | null
          tg_notify_error?: string | null
          tg_notify_status?: string | null
          tg_views_estimate?: never
          tg_views_frozen?: number | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_seller_profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          listing_count: number | null
          location: string | null
          rating: number | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          listing_count?: number | null
          location?: string | null
          rating?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          listing_count?: number | null
          location?: string | null
          rating?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      stores_public: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          name: string | null
          rating: number | null
          reviews_count: number | null
          seller_id: string | null
          tags: Database["public"]["Enums"]["store_tag"][] | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string | null
          tags?: Database["public"]["Enums"]["store_tag"][] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string | null
          tags?: Database["public"]["Enums"]["store_tag"][] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_hardcoded_urls_check: {
        Row: {
          found_urls: string[] | null
          function_body: string | null
          function_name: unknown
          schema_name: unknown
          url_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_free_order: {
        Args: {
          p_brand?: string
          p_buyer_opt_id: string
          p_delivery_method?: Database["public"]["Enums"]["delivery_method"]
          p_delivery_price_confirm?: number
          p_description?: string
          p_images?: string[]
          p_model?: string
          p_place_number?: number
          p_price: number
          p_seller_id: string
          p_text_order?: string
          p_title: string
          p_video_url?: string[]
        }
        Returns: string
      }
      admin_create_order: {
        Args: {
          p_brand?: string
          p_buyer_id: string
          p_delivery_method?: Database["public"]["Enums"]["delivery_method"]
          p_delivery_price_confirm?: number
          p_description?: string
          p_images?: string[]
          p_model?: string
          p_place_number?: number
          p_price: number
          p_product_id?: string
          p_quantity?: number
          p_seller_id: string
          p_status?: Database["public"]["Enums"]["order_status"]
          p_text_order?: string
          p_title: string
          p_video_url?: string[]
        }
        Returns: string
      }
      admin_create_order_v2: {
        Args: {
          p_brand: string
          p_buyer_id: string
          p_delivery_method: Database["public"]["Enums"]["delivery_method"]
          p_delivery_price_confirm: number
          p_images: string[]
          p_model: string
          p_order_created_type: Database["public"]["Enums"]["order_created_type"]
          p_order_seller_name: string
          p_place_number: number
          p_price: number
          p_product_id: string
          p_seller_id: string
          p_seller_opt_id: string
          p_status: Database["public"]["Enums"]["order_status"]
          p_telegram_url_order: string
          p_text_order: string
          p_title: string
        }
        Returns: string
      }
      admin_create_product: {
        Args: {
          p_brand: string
          p_condition: string
          p_delivery_price: number
          p_description: string
          p_model: string
          p_place_number: number
          p_price: number
          p_seller_id: string
          p_seller_name: string
          p_status: Database["public"]["Enums"]["product_status"]
          p_title: string
        }
        Returns: string
      }
      admin_delete_specific_user:
        | { Args: { p_user_id: string }; Returns: boolean }
        | { Args: { p_user_email: string }; Returns: Json }
      admin_delete_store: { Args: { p_store_id: string }; Returns: boolean }
      admin_insert_product_image: {
        Args: { p_is_primary?: boolean; p_product_id: string; p_url: string }
        Returns: undefined
      }
      admin_insert_product_video: {
        Args: { p_product_id: string; p_url: string }
        Returns: undefined
      }
      admin_resend_welcome: { Args: { p_user_id: string }; Returns: Json }
      apply_translation_rules: {
        Args: { p_limit?: number; p_text: string }
        Returns: string
      }
      batch_calculate_shipment_status: {
        Args: { order_ids: string[] }
        Returns: {
          order_id: string
          status: string
        }[]
      }
      calculate_content_hash: { Args: { content: string }; Returns: string }
      calculate_order_shipment_status: {
        Args: { p_order_id: string }
        Returns: string
      }
      calculate_shipment_status: {
        Args: { order_id_param: string }
        Returns: string
      }
      cancel_price_offers_for_sold_product: {
        Args: { product_id_param: string }
        Returns: number
      }
      check_force_logout_status: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_no_hardcoded_function_urls: {
        Args: never
        Returns: {
          details: Json
          message: string
          status: string
        }[]
      }
      check_opt_id_exists:
        | {
            Args: { p_ip_address?: unknown; p_opt_id: string }
            Returns: boolean
          }
        | { Args: { check_opt_id: string }; Returns: boolean }
      check_order_number_unique: {
        Args: { p_order_id?: string; p_order_number: number }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_limit_per_hour?: number
        }
        Returns: boolean
      }
      check_search_rate_limit: {
        Args: { p_search_type?: string; p_user_id: string }
        Returns: boolean
      }
      check_user_auth_method: { Args: { p_login_input: string }; Returns: Json }
      check_user_pending_offer: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: {
          has_offer: boolean
          offer_id: string
          offer_price: number
        }[]
      }
      cleanup_expired_email_verification_codes: {
        Args: never
        Returns: undefined
      }
      cleanup_expired_password_reset_codes: { Args: never; Returns: undefined }
      cleanup_expired_telegram_sessions: { Args: never; Returns: undefined }
      cleanup_hardcoded_function_urls: {
        Args: never
        Returns: {
          action: string
          function_name: string
          new_url: string
          old_url: string
          status: string
        }[]
      }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: number }
      cleanup_old_security_logs: { Args: never; Returns: number }
      cleanup_orphaned_pending_offers: { Args: never; Returns: number }
      cleanup_verification_codes_for_email: {
        Args: { p_email: string }
        Returns: Json
      }
      clear_all_rls_policies: { Args: never; Returns: string }
      complete_profile_after_signup:
        | { Args: { p_email: string; payload: Json }; Returns: Json }
        | {
            Args: {
              p_company_name: string
              p_full_name: string
              p_location: string
              p_opt_id?: string
              p_phone: string
              p_telegram: string
              p_user_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_company_name?: string
              p_full_name: string
              p_location?: string
              p_phone?: string
              p_telegram?: string
              p_user_type?: string
            }
            Returns: Json
          }
      count_order_photos: { Args: { p_order_id: string }; Returns: number }
      count_products_with_notification_issues: {
        Args: { p_search?: string; p_seller_id?: string; p_status?: string }
        Returns: number
      }
      create_bilingual_notification: {
        Args: { p_data?: Json; p_type: string; p_user_id: string }
        Returns: string
      }
      create_order_reminder_notifications: { Args: never; Returns: undefined }
      create_password_reset_code: {
        Args: { p_email: string; p_opt_id?: string }
        Returns: Json
      }
      create_price_offer_notification: {
        Args: {
          p_buyer_id: string
          p_offered_price: number
          p_product_id: string
        }
        Returns: undefined
      }
      create_price_offer_status_notification: {
        Args: {
          p_offer_id: string
          p_seller_response?: string
          p_status: string
        }
        Returns: undefined
      }
      create_standard_product: {
        Args: { p_description?: string; p_price: number; p_title: string }
        Returns: string
      }
      create_trusted_product: {
        Args: {
          p_brand: string
          p_condition?: string
          p_delivery_price?: number
          p_description?: string
          p_model?: string
          p_place_number?: number
          p_price: number
          p_title: string
        }
        Returns: string
      }
      create_user_order: {
        Args: {
          p_brand: string
          p_buyer_id: string
          p_buyer_opt_id?: string
          p_delivery_method: Database["public"]["Enums"]["delivery_method"]
          p_delivery_price_confirm: number
          p_description?: string
          p_images: string[]
          p_lot_number_order?: number
          p_model: string
          p_order_created_type: Database["public"]["Enums"]["order_created_type"]
          p_order_seller_name: string
          p_place_number: number
          p_price: number
          p_product_id: string
          p_quantity?: number
          p_seller_id: string
          p_seller_opt_id: string
          p_status: Database["public"]["Enums"]["order_status"]
          p_telegram_url_buyer?: string
          p_telegram_url_order: string
          p_text_order: string
          p_title: string
          p_video_url?: string[]
        }
        Returns: string
      }
      delete_user_account:
        | { Args: { user_id: string }; Returns: undefined }
        | { Args: never; Returns: undefined }
      diagnose_auth_state: { Args: { p_user_id?: string }; Returns: Json }
      disable_profile_public_access: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      estimate_tg_views: {
        Args: { p_created_at: string; p_id: string }
        Returns: number
      }
      expire_old_price_offers: { Args: never; Returns: undefined }
      extract_translation_rules: {
        Args: { p_ai_suggestion: string; p_moderator_correction: string }
        Returns: Json
      }
      filter_orders_by_container_statuses: {
        Args: { container_statuses: string[] }
        Returns: {
          order_id: string
        }[]
      }
      filter_orders_by_containers: {
        Args: { container_numbers: string[] }
        Returns: {
          order_id: string
        }[]
      }
      filter_orders_by_shipment_statuses: {
        Args: { shipment_statuses: string[] }
        Returns: {
          order_id: string
        }[]
      }
      force_user_logout: { Args: never; Returns: undefined }
      functions_url: { Args: { p_path: string }; Returns: string }
      generate_unique_opt_id: { Args: never; Returns: Json }
      get_admin_add_product_data: { Args: never; Returns: Json }
      get_admin_metrics: { Args: never; Returns: Json }
      get_email_by_opt_id:
        | {
            Args: { p_ip_address?: unknown; p_opt_id: string }
            Returns: string
          }
        | { Args: { p_opt_id: string }; Returns: string }
      get_functions_url_patterns: {
        Args: never
        Returns: {
          correct_usage: string
          description: string
          example: string
          pattern_type: string
        }[]
      }
      get_next_order_number: { Args: never; Returns: number }
      get_orders_shipment_summary: {
        Args: { order_ids: string[] }
        Returns: {
          calculated_status: string
          containers_info: Json
          order_id: string
          shipped_places: number
          total_places: number
        }[]
      }
      get_product_content_for_embedding: {
        Args: { product_id: string }
        Returns: string
      }
      get_products_with_notification_issues: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_seller_id?: string
          p_status?: string
        }
        Returns: {
          admin_notification_sent_at: string
          ai_confidence: number
          ai_delivery_confidence: number
          ai_delivery_reasoning: Json
          ai_enriched_at: string
          ai_original_title: string
          ai_suggested_brand: string
          ai_suggested_delivery_prices: Json
          ai_suggested_model: string
          ai_suggested_title: string
          brand: string
          catalog_position: string
          cloudinary_public_id: string
          cloudinary_url: string
          condition: string
          created_at: string
          delivery_price: number
          description: string
          id: string
          last_notification_sent_at: string
          location: string
          lot_number: number
          model: string
          optid_created: string
          phone_url: string
          place_number: number
          preview_image_url: string
          price: number
          product_location: string
          product_url: string
          rating_seller: number
          requires_moderation: boolean
          seller_id: string
          seller_name: string
          status: Database["public"]["Enums"]["product_status"]
          telegram_url: string
          tg_notify_attempts: number
          tg_notify_error: string
          tg_notify_status: string
          tg_views_frozen: number
          title: string
          updated_at: string
          view_count: number
        }[]
      }
      get_profile_access_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          access_count: number
          accessed_profile_id: string
          accessed_profile_name: string
          accessor_count: number
          last_access: string
        }[]
      }
      get_public_statistics: { Args: never; Returns: Json }
      get_queue_metrics: { Args: never; Returns: Json }
      get_rls_policies_status: {
        Args: never
        Returns: {
          policy_cmd: string
          policy_name: string
          policy_qual: string
          policy_roles: string[]
          schema_name: string
          table_name: string
        }[]
      }
      get_search_synonyms: {
        Args: { search_language?: string; search_term: string }
        Returns: string[]
      }
      get_seller_daily_statistics: {
        Args: { end_date: string; start_date: string }
        Returns: {
          orders_created: number
          products_created: number
          seller_id: string
          seller_name: string
          seller_opt_id: string
          total_delivery_cost: number
          total_revenue: number
        }[]
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: Json }
      hybrid_search_products: {
        Args: {
          match_count?: number
          query_embedding: string
          query_length?: number
          search_keywords: string
          similarity_threshold?: number
        }
        Returns: {
          brand: string
          created_at: string
          exact_match_score: number
          hybrid_score: number
          id: string
          model: string
          preview_image_url: string
          price: number
          seller_name: string
          similarity_score: number
          status: Database["public"]["Enums"]["product_status"]
          title: string
        }[]
      }
      increment_product_view_count: {
        Args: { product_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_seller: { Args: never; Returns: boolean }
      is_product_active: { Args: { p_product_id: string }; Returns: boolean }
      is_seller: { Args: never; Returns: boolean }
      log_password_reset_event: {
        Args: { p_email: string; p_opt_id?: string; p_user_id: string }
        Returns: undefined
      }
      log_profile_access: {
        Args: {
          p_access_type: string
          p_accessed_profile_id: string
          p_context_data?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_telegram_auth_debug: {
        Args: { debug_info: Json; user_id: string }
        Returns: undefined
      }
      migrate_free_order_logs: { Args: never; Returns: undefined }
      monitor_function_url_compliance: { Args: never; Returns: Json }
      notify_admins_new_pending_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      notify_user_verification_status_change: {
        Args: {
          p_new_status: Database["public"]["Enums"]["verification_status"]
          p_old_status: Database["public"]["Enums"]["verification_status"]
          p_user_id: string
        }
        Returns: undefined
      }
      regenerate_profile_share_token: {
        Args: { p_profile_id: string }
        Returns: string
      }
      resend_order_notification: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      resend_product_notification: {
        Args: { p_product_id: string }
        Returns: Json
      }
      restore_account_from_backup: {
        Args: { backup_id: string }
        Returns: Json
      }
      restore_basic_rls_policies: { Args: never; Returns: string }
      retry_dead_letter_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      safe_seller_check: { Args: never; Returns: boolean }
      search_car_brands_and_models: {
        Args: { search_term: string }
        Returns: {
          brand_id: string
          brand_name: string
          model_id: string
          model_name: string
        }[]
      }
      secure_check_force_logout_status: { Args: never; Returns: boolean }
      secure_check_rate_limit: {
        Args: { p_action: string; p_limit_per_hour: number; p_user_id: string }
        Returns: boolean
      }
      secure_check_user_auth_method: {
        Args: { p_user_id: string }
        Returns: string
      }
      secure_check_user_not_blocked: { Args: never; Returns: boolean }
      secure_check_user_pending_offer: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: boolean
      }
      secure_force_user_logout: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      secure_update_profile: {
        Args: { p_updates: Json; p_user_id: string }
        Returns: Json
      }
      secure_validate_profile_update: {
        Args: {
          p_is_trusted_seller: boolean
          p_user_id: string
          p_user_type: Database["public"]["Enums"]["user_type"]
          p_verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Returns: boolean
      }
      seller_create_order:
        | {
            Args: {
              p_brand: string
              p_buyer_id: string
              p_delivery_method: Database["public"]["Enums"]["delivery_method"]
              p_delivery_price_confirm: number
              p_images: string[]
              p_model: string
              p_order_created_type: Database["public"]["Enums"]["order_created_type"]
              p_order_seller_name: string
              p_place_number: number
              p_price: number
              p_product_id: string
              p_status: Database["public"]["Enums"]["order_status"]
              p_telegram_url_order: string
              p_text_order: string
              p_title: string
              p_videos?: string[]
            }
            Returns: string
          }
        | {
            Args: {
              p_brand: string
              p_buyer_id: string
              p_delivery_method: Database["public"]["Enums"]["delivery_method"]
              p_delivery_price_confirm: number
              p_images: string[]
              p_model: string
              p_order_created_type: Database["public"]["Enums"]["order_created_type"]
              p_order_seller_name: string
              p_place_number: number
              p_price: number
              p_product_id: string
              p_seller_id: string
              p_seller_opt_id: string
              p_status: Database["public"]["Enums"]["order_status"]
              p_telegram_url_order: string
              p_text_order: string
              p_title: string
              p_videos?: string[]
            }
            Returns: string
          }
      seller_create_order_v2: {
        Args: {
          p_brand: string
          p_buyer_opt_id: string
          p_delivery_method: Database["public"]["Enums"]["delivery_method"]
          p_delivery_price_confirm?: number
          p_images?: string[]
          p_model: string
          p_place_number: number
          p_price: number
          p_product_id?: string
          p_telegram_url_order: string
          p_text_order: string
          p_title: string
        }
        Returns: string
      }
      semantic_search_products: {
        Args: {
          match_count?: number
          query_embedding: string
          search_query: string
          similarity_threshold?: number
        }
        Returns: {
          brand: string
          combined_score: number
          created_at: string
          id: string
          model: string
          preview_image_url: string
          price: number
          seller_id: string
          seller_name: string
          similarity_score: number
          status: Database["public"]["Enums"]["product_status"]
          title: string
        }[]
      }
      send_email_verification_code: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      send_verification_code: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      should_show_resend_button: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_orphaned_telegram_users_safe: { Args: never; Returns: undefined }
      translate_notification: {
        Args: { p_data: Json; p_type: string; p_user_id?: string }
        Returns: Json
      }
      update_container_status_and_sync: {
        Args: {
          p_container_number: string
          p_new_status: Database["public"]["Enums"]["container_status"]
        }
        Returns: undefined
      }
      update_multiple_shipments: {
        Args: { shipment_updates: Json }
        Returns: undefined
      }
      update_order_media: {
        Args: {
          p_images?: string[]
          p_order_id: string
          p_video_url?: string[]
        }
        Returns: boolean
      }
      validate_catalog_positioning: {
        Args: never
        Returns: {
          products_with_correct_position: number
          products_with_null_position: number
          total_products: number
          validation_status: string
        }[]
      }
      validate_functions_url_compliance: { Args: never; Returns: boolean }
      validate_profile_update: {
        Args: {
          p_is_trusted_seller: boolean
          p_user_id: string
          p_user_type: Database["public"]["Enums"]["user_type"]
          p_verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Returns: boolean
      }
      validate_user_exists: { Args: { p_email: string }; Returns: boolean }
      verify_and_reset_password_v2: {
        Args: { p_code: string; p_email: string; p_new_password: string }
        Returns: Json
      }
      verify_email_verification_code: {
        Args: { p_code: string; p_email: string }
        Returns: Json
      }
    }
    Enums: {
      container_status:
        | "waiting"
        | "in_transit"
        | "delivered"
        | "lost"
        | "sent_from_uae"
        | "transit_iran"
        | "to_kazakhstan"
        | "customs"
        | "cleared_customs"
        | "received"
      delivery_method: "self_pickup" | "cargo_rf" | "cargo_kz"
      opt_user_status: "free_user" | "opt_user"
      order_created_type:
        | "free_order"
        | "ads_order"
        | "product_order"
        | "price_offer_order"
      order_status:
        | "created"
        | "seller_confirmed"
        | "admin_confirmed"
        | "processed"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "active" | "sold" | "pending" | "archived"
      shipment_status: "not_shipped" | "partially_shipped" | "in_transit"
      shipment_status_individual: "not_shipped" | "in_transit"
      store_tag:
        | "electronics"
        | "auto_parts"
        | "accessories"
        | "spare_parts"
        | "other"
      user_type: "buyer" | "seller" | "admin"
      verification_status: "verified" | "pending" | "blocked"
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
      container_status: [
        "waiting",
        "in_transit",
        "delivered",
        "lost",
        "sent_from_uae",
        "transit_iran",
        "to_kazakhstan",
        "customs",
        "cleared_customs",
        "received",
      ],
      delivery_method: ["self_pickup", "cargo_rf", "cargo_kz"],
      opt_user_status: ["free_user", "opt_user"],
      order_created_type: [
        "free_order",
        "ads_order",
        "product_order",
        "price_offer_order",
      ],
      order_status: [
        "created",
        "seller_confirmed",
        "admin_confirmed",
        "processed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["active", "sold", "pending", "archived"],
      shipment_status: ["not_shipped", "partially_shipped", "in_transit"],
      shipment_status_individual: ["not_shipped", "in_transit"],
      store_tag: [
        "electronics",
        "auto_parts",
        "accessories",
        "spare_parts",
        "other",
      ],
      user_type: ["buyer", "seller", "admin"],
      verification_status: ["verified", "pending", "blocked"],
    },
  },
} as const
