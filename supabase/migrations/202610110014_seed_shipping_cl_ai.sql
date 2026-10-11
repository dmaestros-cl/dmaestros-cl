insert into public.shipping_regions (code,name,sort_order) values ('CL-AI','Región Aisén del Gral. Carlos Ibañez del Campo',140) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('ai0101','CL-AI','Coyhaique',24990,7,14),
  ('ai0102','CL-AI','Lago Verde',24990,7,14),
  ('ai0201','CL-AI','Aisén',24990,7,14),
  ('ai0202','CL-AI','Cisnes',24990,7,14),
  ('ai0203','CL-AI','Guaitecas',34990,9,16),
  ('ai0301','CL-AI','Cochrane',24990,7,14),
  ('ai0302','CL-AI','O’Higgins',24990,7,14),
  ('ai0303','CL-AI','Tortel',36990,10,18),
  ('ai0401','CL-AI','Chile Chico',24990,7,14),
  ('ai0402','CL-AI','Río Ibáñez',24990,7,14) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
