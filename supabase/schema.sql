-- ============================================================================
-- Melani Cristine Lashes & Brows — esquema de base de datos (Supabase/Postgres)
-- ============================================================================
-- Cómo usar: Supabase Dashboard -> SQL Editor -> pegar todo este archivo -> Run.
-- Es seguro volver a correrlo (usa IF NOT EXISTS / OR REPLACE donde es posible).

-- Necesaria para el índice de exclusión que evita horarios superpuestos.
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. PERFILES (clientas + Melani como admin)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,                       -- número de WhatsApp, formato internacional ej. 595981234567
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Crea automáticamente un perfil cuando alguien se registra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. SERVICIOS (pestañas, cejas, micropigmentación...)
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'general', -- 'pestanas' | 'cejas' | 'micropigmentacion' | 'general'
  description text default '',
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(12,0) not null check (price >= 0), -- guaraníes, sin decimales
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "services_select_active_or_admin" on public.services;
create policy "services_select_active_or_admin" on public.services
  for select using (
    active = true
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 3. HORARIO DE ATENCIÓN (para calcular horas disponibles)
-- ----------------------------------------------------------------------------
create table if not exists public.business_hours (
  weekday int primary key check (weekday between 0 and 6), -- 0=domingo ... 6=sábado
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

insert into public.business_hours (weekday, open_time, close_time, is_closed) values
  (0, null, null, true),
  (1, '09:00', '18:00', false),
  (2, '09:00', '18:00', false),
  (3, '09:00', '18:00', false),
  (4, '09:00', '18:00', false),
  (5, '09:00', '19:00', false),
  (6, '09:00', '13:00', false)
on conflict (weekday) do nothing;

alter table public.business_hours enable row level security;

drop policy if exists "business_hours_select_all" on public.business_hours;
create policy "business_hours_select_all" on public.business_hours for select using (true);

drop policy if exists "business_hours_admin_write" on public.business_hours;
create policy "business_hours_admin_write" on public.business_hours
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 4. CITAS
-- ----------------------------------------------------------------------------
-- client_id es opcional: permite que Melani cargue citas tomadas por teléfono/WhatsApp
-- de clientas que todavía no usan la app (guest_name / guest_phone en ese caso).
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete cascade,
  guest_name text,
  guest_phone text,
  service_id uuid not null references public.services (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes text default '',
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_client_or_guest check (client_id is not null or guest_name is not null),
  -- Evita que dos citas confirmadas se superpongan (una sola profesional).
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (status = 'confirmed')
);

create index if not exists appointments_client_idx on public.appointments (client_id);
create index if not exists appointments_starts_at_idx on public.appointments (starts_at);

-- Calcula ends_at automáticamente a partir de la duración del servicio.
create or replace function public.set_appointment_ends_at()
returns trigger
language plpgsql
as $$
declare
  v_duration int;
begin
  select duration_minutes into v_duration from public.services where id = new.service_id;
  if v_duration is null then
    raise exception 'Servicio inválido';
  end if;
  new.ends_at := new.starts_at + make_interval(mins => v_duration);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_appointment_ends_at on public.appointments;
create trigger trg_set_appointment_ends_at
  before insert or update of starts_at, service_id on public.appointments
  for each row execute function public.set_appointment_ends_at();

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_own_or_admin" on public.appointments;
create policy "appointments_select_own_or_admin" on public.appointments
  for select using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "appointments_insert_own_or_admin" on public.appointments;
create policy "appointments_insert_own_or_admin" on public.appointments
  for insert with check (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "appointments_update_own_or_admin" on public.appointments;
create policy "appointments_update_own_or_admin" on public.appointments
  for update using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "appointments_delete_admin_only" on public.appointments;
create policy "appointments_delete_admin_only" on public.appointments
  for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Horarios disponibles para un servicio en una fecha dada (function pública, security definer
-- para poder leer todas las citas sin exponer la tabla completa a las clientas).
create or replace function public.get_available_slots(p_date date, p_service_id uuid, p_slot_minutes int default 30)
returns table (slot_start timestamptz)
language plpgsql
security definer set search_path = public
as $$
declare
  v_weekday int := extract(dow from p_date);
  v_open time;
  v_close time;
  v_closed boolean;
  v_duration int;
  v_tz text := 'America/Asuncion';
  v_cursor timestamptz;
  v_day_end timestamptz;
  v_candidate_end timestamptz;
begin
  select open_time, close_time, is_closed into v_open, v_close, v_closed
  from public.business_hours where weekday = v_weekday;

  if v_closed or v_open is null then
    return;
  end if;

  select duration_minutes into v_duration from public.services where id = p_service_id and active = true;
  if v_duration is null then
    return;
  end if;

  v_cursor := (p_date::text || ' ' || v_open::text)::timestamp at time zone v_tz;
  v_day_end := (p_date::text || ' ' || v_close::text)::timestamp at time zone v_tz;

  while v_cursor < v_day_end loop
    v_candidate_end := v_cursor + make_interval(mins => v_duration);
    if v_candidate_end <= v_day_end
       and v_cursor > now()
       and not exists (
         select 1 from public.appointments a
         where a.status = 'confirmed'
           and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(v_cursor, v_candidate_end, '[)')
       )
    then
      slot_start := v_cursor;
      return next;
    end if;
    v_cursor := v_cursor + make_interval(mins => p_slot_minutes);
  end loop;
end;
$$;

grant execute on function public.get_available_slots(date, uuid, int) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. RESEÑAS
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);

drop policy if exists "reviews_insert_own_completed_appointment" on public.reviews;
create policy "reviews_insert_own_completed_appointment" on public.reviews
  for insert with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.client_id = auth.uid()
        and a.status = 'confirmed'
        and a.ends_at < now()
    )
  );

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- 6. STORAGE — bucket público para fotos de reseñas
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "review_photos_public_read" on storage.objects;
create policy "review_photos_public_read" on storage.objects
  for select using (bucket_id = 'review-photos');

drop policy if exists "review_photos_auth_upload" on storage.objects;
create policy "review_photos_auth_upload" on storage.objects
  for insert with check (bucket_id = 'review-photos' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 7. Servicios de ejemplo (podés editarlos luego desde el panel de admin)
-- ----------------------------------------------------------------------------
insert into public.services (name, category, description, duration_minutes, price)
select * from (values
  ('Extensión de pestañas clásicas', 'pestanas', 'Aplicación pelo a pelo, efecto natural', 90, 150000),
  ('Extensión de pestañas volumen ruso', 'pestanas', 'Efecto denso y dramático', 120, 200000),
  ('Diseño y laminado de cejas', 'cejas', 'Diseño, tinte y laminado', 60, 100000),
  ('Micropigmentación de cejas', 'micropigmentacion', 'Técnica microblading / hair strokes', 150, 450000),
  ('Retoque de micropigmentación', 'micropigmentacion', 'Retoque hasta 45 días después del procedimiento', 90, 150000)
) as v (name, category, description, duration_minutes, price)
where not exists (select 1 from public.services);

-- ============================================================================
-- ÚLTIMO PASO MANUAL: convertir a Melani en administradora.
-- 1) Que ella se registre una vez en la app con su email.
-- 2) Correr (reemplazando el email):
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'email-de-melani@ejemplo.com');
-- ============================================================================
