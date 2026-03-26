export type UserType = 'nithin' | 'aiswarya';

export interface Entry {
  id?: string;
  date: string;
  user_id: UserType;
  self_rating: number;
  partner_rating: number;
  ext_rating: number;
  note: string;
  created_at?: string;
}