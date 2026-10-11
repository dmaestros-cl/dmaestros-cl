alter table public.footer_settings add column if not exists weekday_open text not null default '09:00';
alter table public.footer_settings add column if not exists weekday_close text not null default '18:00';
alter table public.footer_settings add column if not exists saturday_active boolean not null default true;
alter table public.footer_settings add column if not exists saturday_open text not null default '10:00';
alter table public.footer_settings add column if not exists saturday_close text not null default '14:00';
alter table public.footer_settings add column if not exists sunday_active boolean not null default false;
alter table public.footer_settings add column if not exists sunday_open text not null default '';
alter table public.footer_settings add column if not exists sunday_close text not null default '';
