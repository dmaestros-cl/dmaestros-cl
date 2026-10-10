with mobile_asset as (
  insert into public.media_assets (bucket, storage_path, public_url, kind, width, height, bytes, alt)
  values (
    'hero-images',
    'system/hero-piezas-mobile-v1.webp',
    'https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-mobile-v1.webp',
    'hero-mobile', 896, 1754, 99614,
    'Colección de juguetes espaciales artesanales sobre un mueble de madera'
  )
  on conflict (bucket, storage_path) do update set public_url = excluded.public_url
  returning id
), desktop_asset as (
  insert into public.media_assets (bucket, storage_path, public_url, kind, width, height, bytes, alt)
  values (
    'hero-images',
    'system/hero-piezas-desktop-v1.webp',
    'https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-desktop-v1.webp',
    'hero-desktop', 1672, 941, 96720,
    'Colección de juguetes espaciales artesanales sobre un mueble de madera'
  )
  on conflict (bucket, storage_path) do update set public_url = excluded.public_url
  returning id
)
update public.hero_slides
set
  mobile_image_url = 'https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-mobile-v1.webp',
  desktop_image_url = 'https://ahgugxxmdkihhhrgrsxw.supabase.co/storage/v1/object/public/hero-images/system/hero-piezas-desktop-v1.webp',
  mobile_asset_id = (select id from mobile_asset),
  desktop_asset_id = (select id from desktop_asset)
where mobile_image_url = '/images/hero/hero-piezas-mobile-v1.png'
   or desktop_image_url = '/images/hero/hero-piezas-desktop-v1.png';
