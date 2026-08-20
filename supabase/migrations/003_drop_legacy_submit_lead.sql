-- `submit_lead` is the predecessor of `internal_submit_lead` and is no longer
-- called by anything. It matters that it goes: it performs the same insert but
-- without the per-IP rate limiting, so it is a bypass waiting to be wired up
-- by accident.
--
-- It is not currently reachable from the browser — EXECUTE is granted only to
-- postgres and service_role, not to anon or authenticated — so this is
-- hygiene, not an incident.

drop function if exists public.submit_lead(text, text, text);
