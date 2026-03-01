import { createClient } from "@supabase/supabase-js";
import { getInitData } from "./telegram";
import type { Appointment, Master, Service, WorkingHour } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function invoke<T>(fn: string, body: unknown): Promise<T> {
  const initData = getInitData();
  const { data, error } = await supabase.functions.invoke(fn, {
    body,
    headers: { "x-telegram-init-data": initData }
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error ?? "Unknown error");
  return data as T;
}

// Client
export async function apiGetMaster(masterId: string): Promise<{ ok: true; master: Master }> {
  return invoke("get_master", { master_id: masterId });
}

export async function apiListServices(masterId: string): Promise<{ ok: true; services: Service[] }> {
  return invoke("list_services", { master_id: masterId });
}

export async function apiGetSlots(args: { masterId: string; serviceId: string; fromDate: string; days: number }) {
  return invoke<{ ok: true; slots: Record<string, string[]> }>("get_available_slots", {
    master_id: args.masterId,
    service_id: args.serviceId,
    from_date: args.fromDate,
    days: args.days
  });
}

export async function apiCreateAppointment(args: { masterId: string; serviceId: string; startAt: string; phone?: string }) {
  return invoke<{ ok: true; appointment: { id: string; start_at: string; end_at: string; status: string } }>("create_appointment", {
    master_id: args.masterId,
    service_id: args.serviceId,
    start_at: args.startAt,
    client_phone: args.phone ?? null
  });
}

export async function apiMyAppointments(): Promise<{ ok: true; appointments: Appointment[] }> {
  return invoke("my_appointments", {});
}

export async function apiCancelAppointment(appointmentId: string, reason?: string): Promise<{ ok: true }> {
  return invoke("cancel_appointment", { appointment_id: appointmentId, reason: reason ?? null });
}

export async function apiRescheduleAppointment(appointmentId: string, newStartAt: string): Promise<{ ok: true }> {
  return invoke("reschedule_appointment", { appointment_id: appointmentId, new_start_at: newStartAt });
}

// Master
export async function apiMasterMe(): Promise<{ ok: true; master: Master }> {
  return invoke("master_me", {});
}

export async function apiMasterUpdateProfile(patch: Partial<Pick<Master, "display_name" | "city" | "bio" | "timezone">>) {
  return invoke<{ ok: true; master: Master }>("master_update_profile", patch);
}

export async function apiMasterListServices(): Promise<{ ok: true; services: Service[] }> {
  return invoke("master_list_services", {});
}

export async function apiMasterUpsertService(svc: { id?: string; title: string; duration_min: number; price_rub: number; is_active?: boolean }) {
  return invoke<{ ok: true; service: Service }>("master_upsert_service", svc);
}

export async function apiMasterDeleteService(id: string) {
  return invoke<{ ok: true }>("master_delete_service", { id });
}

export async function apiMasterGetWorkingHours(): Promise<{ ok: true; working_hours: WorkingHour[] }> {
  return invoke("master_get_working_hours", {});
}

export async function apiMasterSetWorkingHours(intervals: { weekday: number; start_time: string; end_time: string }[]) {
  return invoke<{ ok: true }>("master_set_working_hours", { intervals });
}

export async function apiMasterListAppointments(from?: string, to?: string): Promise<{ ok: true; appointments: Appointment[] }> {
  return invoke("master_list_appointments", { from, to });
}

export async function apiMasterCancelAppointment(appointmentId: string, reason?: string) {
  return invoke<{ ok: true }>("master_cancel_appointment", { appointment_id: appointmentId, reason: reason ?? null });
}
