export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      gachas: {
        Row: {
          id: string;
          name: string;
          ticket_type_id: string;
          color: string | null;
          min_rarity: number;
          max_rarity: number;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          ticket_type_id: string;
          color?: string | null;
          min_rarity: number;
          max_rarity: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          ticket_type_id?: string;
          color?: string | null;
          min_rarity?: number;
          max_rarity?: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gachas_ticket_type_id_fkey";
            columns: ["ticket_type_id"];
            isOneToOne: false;
            referencedRelation: "ticket_types";
            referencedColumns: ["id"];
          }
        ];
      };
      gacha_rates: {
        Row: {
          id: string;
          gacha_id: string;
          horse_id: string;
          rate: number;
        };
        Insert: {
          id?: string;
          gacha_id: string;
          horse_id: string;
          rate: number;
        };
        Update: {
          id?: string;
          gacha_id?: string;
          horse_id?: string;
          rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "gacha_rates_gacha_id_fkey";
            columns: ["gacha_id"];
            isOneToOne: false;
            referencedRelation: "gachas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_rates_horse_id_fkey";
            columns: ["horse_id"];
            isOneToOne: false;
            referencedRelation: "horses";
            referencedColumns: ["id"];
          }
        ];
      };
      horses: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          rarity: number;
          description: string | null;
          card_image_url: string | null;
          silhouette_image_url: string | null;
          created_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          rarity: number;
          description?: string | null;
          card_image_url?: string | null;
          silhouette_image_url?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          rarity?: number;
          description?: string | null;
          card_image_url?: string | null;
          silhouette_image_url?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_collections: {
        Row: {
          id: string;
          user_id: string;
          horse_id: string;
          quantity: number;
          first_acquired_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          horse_id: string;
          quantity?: number;
          first_acquired_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          horse_id?: string;
          quantity?: number;
          first_acquired_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_collections_horse_id_fkey";
            columns: ["horse_id"];
            isOneToOne: false;
            referencedRelation: "horses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_collections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      gacha_history: {
        Row: {
          id: string;
          user_id: string;
          gacha_id: string;
          horse_id: string;
          animation_type: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          gacha_id: string;
          horse_id: string;
          animation_type?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          gacha_id?: string;
          horse_id?: string;
          animation_type?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gacha_history_gacha_id_fkey";
            columns: ["gacha_id"];
            isOneToOne: false;
            referencedRelation: "gachas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_history_horse_id_fkey";
            columns: ["horse_id"];
            isOneToOne: false;
            referencedRelation: "horses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      gacha_animations: {
        Row: {
          id: string;
          key: string;
          name: string;
          min_rarity: number;
          max_rarity: number;
          duration_seconds: number | null;
          asset_url: string | null;
          type: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          min_rarity: number;
          max_rarity: number;
          duration_seconds?: number | null;
          asset_url?: string | null;
          type?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          min_rarity?: number;
          max_rarity?: number;
          duration_seconds?: number | null;
          asset_url?: string | null;
          type?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      gacha_results: {
        Row: {
          id: string;
          user_id: string;
          gacha_id: string | null;
          card_id: string | null;
          obtained_via: string;
          session_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          gacha_id?: string | null;
          card_id?: string | null;
          obtained_via: string;
          session_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          gacha_id?: string | null;
          card_id?: string | null;
          obtained_via?: string;
          session_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gacha_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_results_gacha_id_fkey";
            columns: ["gacha_id"];
            isOneToOne: false;
            referencedRelation: "gachas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_results_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gacha_results_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "multi_gacha_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      cards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string;
          rarity: string;
          max_supply: number;
          current_supply: number | null;
          is_active: boolean | null;
          person_name: string | null;
          card_style: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url: string;
          rarity: string;
          max_supply: number;
          current_supply?: number | null;
          is_active?: boolean | null;
          person_name?: string | null;
          card_style?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string;
          rarity?: string;
          max_supply?: number;
          current_supply?: number | null;
          is_active?: boolean | null;
          person_name?: string | null;
          card_style?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      card_inventory: {
        Row: {
          id: string;
          card_id: string;
          serial_number: number;
          owner_id: string;
          obtained_at: string | null;
          obtained_via: string;
          gacha_result_id: string | null;
        };
        Insert: {
          id?: string;
          card_id: string;
          serial_number: number;
          owner_id: string;
          obtained_at?: string | null;
          obtained_via: string;
          gacha_result_id?: string | null;
        };
        Update: {
          id?: string;
          card_id?: string;
          serial_number?: number;
          owner_id?: string;
          obtained_at?: string | null;
          obtained_via?: string;
          gacha_result_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "card_inventory_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_inventory_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      gacha_probability: {
        Row: {
          id: string;
          rarity: string;
          probability: number;
          rtp_weight: number | null;
          pity_threshold: number | null;
          is_active: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          rarity: string;
          probability: number;
          rtp_weight?: number | null;
          pity_threshold?: number | null;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          rarity?: string;
          probability?: number;
          rtp_weight?: number | null;
          pity_threshold?: number | null;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      line_follows: {
        Row: {
          id: string;
          user_id: string;
          line_user_id: string | null;
          ticket_granted: boolean | null;
          followed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          line_user_id?: string | null;
          ticket_granted?: boolean | null;
          followed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          line_user_id?: string | null;
          ticket_granted?: boolean | null;
          followed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "line_follows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      multi_gacha_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: string;
          total_pulls: number;
          current_pull: number | null;
          scenario_path: Json | null;
          status: string | null;
          results: Json | null;
          created_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: string;
          total_pulls: number;
          current_pull?: number | null;
          scenario_path?: Json | null;
          status?: string | null;
          results?: Json | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: string;
          total_pulls?: number;
          current_pull?: number | null;
          scenario_path?: Json | null;
          status?: string | null;
          results?: Json | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "multi_gacha_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string | null;
          referred_id: string | null;
          referral_code: string;
          status: string | null;
          ticket_granted: boolean | null;
          created_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          referrer_id?: string | null;
          referred_id?: string | null;
          referral_code: string;
          status?: string | null;
          ticket_granted?: boolean | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          referrer_id?: string | null;
          referred_id?: string | null;
          referral_code?: string;
          status?: string | null;
          ticket_granted?: boolean | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey";
            columns: ["referrer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referred_id_fkey";
            columns: ["referred_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      login_bonus_claims: {
        Row: {
          id: string;
          user_id: string;
          claimed_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          claimed_at: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          claimed_at?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "login_bonus_claims_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_user_id: string;
          status: string;
          requested_by: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_user_id: string;
          status?: string;
          requested_by: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_user_id?: string;
          status?: string;
          requested_by?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_friend_user_id_fkey";
            columns: ["friend_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      gifts: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          ticket_type_id: string | null;
          horse_id: string | null;
          quantity: number;
          status: string;
          created_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          ticket_type_id?: string | null;
          horse_id?: string | null;
          quantity?: number;
          status?: string;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          type?: string;
          ticket_type_id?: string | null;
          horse_id?: string | null;
          quantity?: number;
          status?: string;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gifts_from_user_id_fkey";
            columns: ["from_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_to_user_id_fkey";
            columns: ["to_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_ticket_type_id_fkey";
            columns: ["ticket_type_id"];
            referencedRelation: "ticket_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_horse_id_fkey";
            columns: ["horse_id"];
            referencedRelation: "horses";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_types: {
        Row: {
          id: string;
          name: string;
          code: string;
          color: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          color?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          color?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_tickets: {
        Row: {
          id: string;
          user_id: string;
          ticket_type_id: string;
          quantity: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticket_type_id: string;
          quantity?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticket_type_id?: string;
          quantity?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_tickets_ticket_type_id_fkey";
            columns: ["ticket_type_id"];
            isOneToOne: false;
            referencedRelation: "ticket_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
