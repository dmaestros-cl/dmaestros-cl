insert into public.shipping_regions (code,name,sort_order) values ('CL-AN','Antofagasta',30) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('an0101','CL-AN','Antofagasta',16990,5,9),
  ('an0102','CL-AN','Mejillones',16990,5,9),
  ('an0103','CL-AN','Sierra Gorda',16990,5,9),
  ('an0104','CL-AN','Taltal',16990,5,9),
  ('an0201','CL-AN','Calama',16990,5,9),
  ('an0202','CL-AN','Ollagüe',16990,5,9),
  ('an0203','CL-AN','San Pedro de Atacama',16990,5,9),
  ('an0301','CL-AN','Tocopilla',16990,5,9),
  ('an0302','CL-AN','María Elena',16990,5,9) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
