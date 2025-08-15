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
          created_at: string
          id: string
          order_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          url: string
        }
        Update: {
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
      email_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ip_address: unknown | null
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          used?: boolean | null
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details: Json
          entity_id: string
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      help_categories: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          order_index?: number
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
          ip_address: unknown | null
          success: boolean
        }
        Insert: {
          attempt_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          identifier: string
          ip_address?: unknown | null
          success?: boolean
        }
        Update: {
          attempt_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          identifier?: string
          ip_address?: unknown | null
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
          container_status:
            | Database["public"]["Enums"]["container_status"]
            | null
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
          seller_id: string
          seller_opt_id: string | null
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
          container_status?:
            | Database["public"]["Enums"]["container_status"]
            | null
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
          seller_id: string
          seller_opt_id?: string | null
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
          container_status?:
            | Database["public"]["Enums"]["container_status"]
            | null
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
          seller_id?: string
          seller_opt_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          telegram_url_buyer?: string | null
          telegram_url_order?: string | null
          text_order?: string | null
          title?: string
          video_url?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          opt_id: string | null
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          opt_id?: string | null
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          opt_id?: string | null
          used?: boolean | null
        }
        Relationships: []
      }
      preverified_emails: {
        Row: {
          created_at: string
          email: string
          ip: unknown | null
          verified_at: string
        }
        Insert: {
          created_at?: string
          email: string
          ip?: unknown | null
          verified_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          ip?: unknown | null
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
            foreignKeyName: "price_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
        ]
      }
      products: {
        Row: {
          admin_notification_sent_at: string | null
          brand: string
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
          seller_id: string
          seller_name: string
          status: Database["public"]["Enums"]["product_status"]
          telegram_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          admin_notification_sent_at?: string | null
          brand: string
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
          seller_id: string
          seller_name: string
          status?: Database["public"]["Enums"]["product_status"]
          telegram_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          admin_notification_sent_at?: string | null
          brand?: string
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
          seller_id?: string
          seller_name?: string
          status?: Database["public"]["Enums"]["product_status"]
          telegram_url?: string | null
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
        ]
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
          fts: unknown | null
          full_name: string | null
          id: string
          is_trusted_seller: boolean
          last_login: string | null
          listing_count: number
          location: string | null
          opt_id: string | null
          opt_status: Database["public"]["Enums"]["opt_user_status"]
          phone: string | null
          profile_completed: boolean | null
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
          fts?: unknown | null
          full_name?: string | null
          id: string
          is_trusted_seller?: boolean
          last_login?: string | null
          listing_count?: number
          location?: string | null
          opt_id?: string | null
          opt_status?: Database["public"]["Enums"]["opt_user_status"]
          phone?: string | null
          profile_completed?: boolean | null
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
          fts?: unknown | null
          full_name?: string | null
          id?: string
          is_trusted_seller?: boolean
          last_login?: string | null
          listing_count?: number
          location?: string | null
          opt_id?: string | null
          opt_status?: Database["public"]["Enums"]["opt_user_status"]
          phone?: string | null
          profile_completed?: boolean | null
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
            foreignKeyName: "store_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_order: {
        Args:
          | {
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
          | {
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
      admin_delete_specific_user: {
        Args: { p_user_email: string } | { p_user_id: string }
        Returns: boolean
      }
      admin_delete_store: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      admin_insert_product_image: {
        Args: { p_is_primary?: boolean; p_product_id: string; p_url: string }
        Returns: undefined
      }
      admin_insert_product_video: {
        Args: { p_product_id: string; p_url: string }
        Returns: undefined
      }
      admin_resend_welcome: {
        Args: { p_user_id: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_content_hash: {
        Args: { content: string }
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
      check_opt_id_exists: {
        Args: { p_ip_address?: unknown; p_opt_id: string }
        Returns: boolean
      }
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
      check_user_auth_method: {
        Args: { p_login_input: string }
        Returns: Json
      }
      check_user_pending_offer: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: {
          has_offer: boolean
          offer_id: string
          offer_price: number
        }[]
      }
      cleanup_expired_email_verification_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_password_reset_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_login_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_orphaned_pending_offers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_verification_codes_for_email: {
        Args: { p_email: string }
        Returns: Json
      }
      clear_all_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      complete_profile_after_signup: {
        Args: { p_email: string; payload: Json }
        Returns: Json
      }
      create_bilingual_notification: {
        Args: { p_data?: Json; p_type: string; p_user_id: string }
        Returns: string
      }
      create_order_reminder_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_password_reset_code: {
        Args: { p_email: string; p_opt_id?: string }
        Returns: Json
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
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_user_account: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: undefined
      }
      expire_old_price_offers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      force_user_logout: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_add_product_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_email_by_opt_id: {
        Args:
          | { p_ip_address?: unknown; p_opt_id: string }
          | { p_opt_id: string }
        Returns: string
      }
      get_next_order_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_product_content_for_embedding: {
        Args: { product_id: string }
        Returns: string
      }
      get_rls_policies_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_cmd: string
          policy_name: string
          policy_qual: string
          policy_roles: string[]
          schema_name: string
          table_name: string
        }[]
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_seller: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_seller: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_password_reset_event: {
        Args: { p_email: string; p_opt_id?: string; p_user_id: string }
        Returns: undefined
      }
      log_telegram_auth_debug: {
        Args: { debug_info: Json; user_id: string }
        Returns: undefined
      }
      resend_order_notification: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      restore_account_from_backup: {
        Args: { backup_id: string }
        Returns: Json
      }
      restore_basic_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_car_brands_and_models: {
        Args: { search_term: string }
        Returns: {
          brand_id: string
          brand_name: string
          model_id: string
          model_name: string
        }[]
      }
      secure_check_force_logout_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      secure_check_rate_limit: {
        Args: { p_action: string; p_limit_per_hour: number; p_user_id: string }
        Returns: boolean
      }
      secure_check_user_auth_method: {
        Args: { p_user_id: string }
        Returns: string
      }
      secure_check_user_not_blocked: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
      seller_create_order: {
        Args:
          | {
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
          | {
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
      semantic_search_products: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          brand: string
          created_at: string
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
      send_email_verification_code: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      send_verification_code: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      should_show_resend_button: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      sync_orphaned_telegram_users_safe: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      translate_notification: {
        Args: { p_data: Json; p_type: string; p_user_id?: string }
        Returns: Json
      }
      update_order_media: {
        Args: {
          p_images?: string[]
          p_order_id: string
          p_video_url?: string[]
        }
        Returns: boolean
      }
      validate_profile_update: {
        Args: {
          p_new_is_trusted_seller: boolean
          p_new_user_type: Database["public"]["Enums"]["user_type"]
          p_new_verification_status: Database["public"]["Enums"]["verification_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_and_reset_password_v2: {
        Args: { p_code: string; p_email: string; p_new_password: string }
        Returns: Json
      }
      verify_email_verification_code: {
        Args: { p_code: string; p_email: string }
        Returns: Json
      }
      verify_reset_code: {
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
