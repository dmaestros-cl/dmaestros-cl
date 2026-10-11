alter table public.products add column if not exists youtube_url text;

alter table public.products drop constraint if exists products_youtube_url_check;
alter table public.products add constraint products_youtube_url_check
check (youtube_url is null or youtube_url = '' or youtube_url ~* '^https?://(www\.)?(youtube\.com|youtu\.be)/');
