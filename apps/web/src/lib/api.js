// apps/web/src/lib/api.ts
import { createClient } from "@supabase/supabase-js";
import { getInitData } from "./telegram";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
});
async function invoke(fn, body) {
    const initData = getInitData();
    if (!initData)
        throw new Error("OPEN_IN_TELEGRAM");
    const { data, error } = await supabase.functions.invoke(fn, {
        body,
        headers: { "x-telegram-init-data": initData }
    });
    if (error)
        throw new Error(error.message);
    if (!data?.ok)
        throw new Error(data?.error ?? "Unknown error");
    return data;
}
// Client
export async function apiGetMaster(masterId) {
    return invoke("get_master", { master_id: masterId });
}
export async function apiListServices(masterId) {
    return invoke("list_services", { master_id: masterId });
}
export async function apiGetSlots(args) {
    return invoke("get_available_slots", {
        master_id: args.masterId,
        service_id: args.serviceId,
        from_date: args.fromDate,
        days: args.days
    });
}
export async function apiCreateAppointment(args) {
    return invoke("create_appointment", {
        master_id: args.masterId,
        service_id: args.serviceId,
        start_at: args.startAt,
        client_phone: args.phone ?? null
    });
}
export async function apiMyAppointments() {
    return invoke("my_appointments", {}); // или undefined
}
export async function apiCancelAppointment(appointmentId, reason) {
    return invoke("cancel_appointment", { appointment_id: appointmentId, reason: reason ?? null });
}
export async function apiRescheduleAppointment(appointmentId, newStartAt) {
    return invoke("reschedule_appointment", { appointment_id: appointmentId, new_start_at: newStartAt });
}
// Master
export async function apiMasterMe() {
    return invoke("master_me", {});
}
export async function apiMasterUpdateProfile(patch) {
    return invoke("master_update_profile", patch);
}
export async function apiMasterListServices() {
    return invoke("master_list_services", {});
}
export async function apiMasterUpsertService(svc) {
    return invoke("master_upsert_service", svc);
}
export async function apiMasterDeleteService(id) {
    return invoke("master_delete_service", { id });
}
export async function apiMasterGetWorkingHours() {
    return invoke("master_get_working_hours", {});
}
export async function apiMasterSetWorkingHours(intervals) {
    return invoke("master_set_working_hours", { intervals });
}
export async function apiMasterListAppointments(from, to) {
    return invoke("master_list_appointments", { from, to });
}
export async function apiMasterCancelAppointment(appointmentId, reason) {
    return invoke("master_cancel_appointment", { appointment_id: appointmentId, reason: reason ?? null });
}
