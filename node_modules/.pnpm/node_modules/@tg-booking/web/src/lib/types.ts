export type Master = {
  id: string;
  display_name: string;
  city: string | null;
  bio: string | null;
  timezone: string;
  is_active: boolean;
};

export type Service = {
  id: string;
  title: string;
  duration_min: number;
  price_rub: number;
  is_active?: boolean;
};

export type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  cancel_reason?: string | null;
  master?: { id: string; display_name: string };
  client_tg_user_id?: number;
  service: { id: string; title: string; duration_min: number; price_rub: number };
};

export type WorkingHour = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};
