insert into public.shipping_regions (code,name,sort_order) values ('CL-AT','Atacama',40) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('at0101','CL-AT','Copiapó',14990,4,8),
  ('at0102','CL-AT','Caldera',14990,4,8),
  ('at0103','CL-AT','Tierra Amarilla',14990,4,8),
  ('at0201','CL-AT','Chañaral',14990,4,8),
  ('at0202','CL-AT','Diego de Almagro',14990,4,8),
  ('at0301','CL-AT','Vallenar',14990,4,8),
  ('at0302','CL-AT','Alto del Carmen',14990,4,8),
  ('at0303','CL-AT','Freirina',14990,4,8),
  ('at0304','CL-AT','Huasco',14990,4,8) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
