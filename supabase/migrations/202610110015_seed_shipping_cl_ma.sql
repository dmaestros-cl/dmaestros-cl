insert into public.shipping_regions (code,name,sort_order) values ('CL-MA','Región de Magallanes y de la Antártica Chilena',150) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('ma0101','CL-MA','Punta Arenas',27990,7,14),
  ('ma0102','CL-MA','Laguna Blanca',34990,9,16),
  ('ma0103','CL-MA','Río Verde',34990,9,16),
  ('ma0104','CL-MA','San Gregorio',27990,7,14),
  ('ma0201','CL-MA','Cabo de Hornos (Ex. Navarino)',27990,7,14),
  ('ma0202','CL-MA','Antártica',59990,15,30),
  ('ma0301','CL-MA','Porvenir',27990,7,14),
  ('ma0302','CL-MA','Primavera',34990,9,16),
  ('ma0303','CL-MA','Timaukel',39990,10,18),
  ('ma0401','CL-MA','Natales',27990,7,14),
  ('ma0402','CL-MA','Torres del Paine',27990,7,14) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
