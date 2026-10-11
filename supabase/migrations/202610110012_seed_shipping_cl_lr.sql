insert into public.shipping_regions (code,name,sort_order) values ('CL-LR','Región de los Ríos',120) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('lr0101','CL-LR','Valdivia',13990,4,7),
  ('lr0102','CL-LR','Corral',13990,4,7),
  ('lr0103','CL-LR','Lanco',13990,4,7),
  ('lr0104','CL-LR','Los Lagos',13990,4,7),
  ('lr0105','CL-LR','Máfil',13990,4,7),
  ('lr0106','CL-LR','Mariquina',13990,4,7),
  ('lr0107','CL-LR','Paillaco',13990,4,7),
  ('lr0108','CL-LR','Panguipulli',13990,4,7),
  ('lr0201','CL-LR','La Unión',13990,4,7),
  ('lr0202','CL-LR','Futrono',13990,4,7),
  ('lr0203','CL-LR','Lago Ranco',13990,4,7),
  ('lr0204','CL-LR','Río Bueno',13990,4,7) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
