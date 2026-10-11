insert into public.shipping_regions (code,name,sort_order) values ('CL-AP','Arica y Parinacota',10) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('ap0101','CL-AP','Arica',18990,6,10),
  ('ap0102','CL-AP','Camarones',18990,6,10),
  ('ap0201','CL-AP','Putre',18990,6,10),
  ('ap0202','CL-AP','General Lagos',18990,6,10) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
