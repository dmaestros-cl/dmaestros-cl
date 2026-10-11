insert into public.shipping_regions (code,name,sort_order) values ('CL-CO','Coquimbo',50) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('co0101','CL-CO','La Serena',11990,3,6),
  ('co0102','CL-CO','Coquimbo',11990,3,6),
  ('co0103','CL-CO','Andacollo',11990,3,6),
  ('co0104','CL-CO','La Higuera',11990,3,6),
  ('co0105','CL-CO','Paiguano',11990,3,6),
  ('co0106','CL-CO','Vicuña',11990,3,6),
  ('co0201','CL-CO','Illapel',11990,3,6),
  ('co0202','CL-CO','Canela',11990,3,6),
  ('co0203','CL-CO','Los Vilos',11990,3,6),
  ('co0204','CL-CO','Salamanca',11990,3,6),
  ('co0301','CL-CO','Ovalle',11990,3,6),
  ('co0302','CL-CO','Combarbalá',11990,3,6),
  ('co0303','CL-CO','Monte Patria',11990,3,6),
  ('co0304','CL-CO','Punitaqui',11990,3,6),
  ('co0305','CL-CO','Río Hurtado',11990,3,6) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
