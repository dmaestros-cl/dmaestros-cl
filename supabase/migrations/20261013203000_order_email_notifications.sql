begin;

create table public.order_email_notifications (
  order_id uuid not null references public.orders(id) on delete cascade,
  audience text not null check (audience in ('customer','admin')),
  state text not null default 'pending' check (state in ('pending','sending','sent','failed','review')),
  payload jsonb,
  provider_id text,
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  primary key (order_id,audience)
);
alter table public.order_email_notifications enable row level security;
revoke all on public.order_email_notifications from anon, authenticated;
grant all on public.order_email_notifications to service_role;

create function public.queue_paid_order_emails() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.payment_status = 'authorized' and old.payment_status is distinct from 'authorized' then
    insert into public.order_email_notifications (order_id,audience)
    values (new.id,'customer'),(new.id,'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger queue_paid_order_emails after update of payment_status on public.orders
for each row execute function public.queue_paid_order_emails();
revoke all on function public.queue_paid_order_emails() from public,anon,authenticated;

create function public.claim_order_email(p_order_id uuid,p_audience text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job public.order_email_notifications;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server only' using errcode='42501'; end if;
  if not exists (select 1 from public.orders where id=p_order_id and payment_status='authorized') then return null; end if;
  select * into job from public.order_email_notifications where order_id=p_order_id and audience=p_audience for update;
  if not found or job.state in ('sent','review') or job.locked_until > now() then return null; end if;
  -- Resend deduplicates for 24h. Never automatically replay an ambiguous send beyond that window.
  if job.first_attempt_at < now() - interval '23 hours' or job.attempts >= 6 then
    update public.order_email_notifications set state='review',last_error='manual_review_required' where order_id=p_order_id and audience=p_audience;
    return null;
  end if;
  if job.payload is null and (p_payload is null or jsonb_typeof(p_payload) <> 'object') then raise exception 'Missing email payload'; end if;
  update public.order_email_notifications set state='sending',payload=coalesce(payload,p_payload),
    first_attempt_at=coalesce(first_attempt_at,now()),locked_until=now()+interval '90 seconds',attempts=attempts+1,last_error=null
    where order_id=p_order_id and audience=p_audience returning * into job;
  return to_jsonb(job);
end;
$$;
revoke all on function public.claim_order_email(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_order_email(uuid,text,jsonb) to service_role;

commit;
