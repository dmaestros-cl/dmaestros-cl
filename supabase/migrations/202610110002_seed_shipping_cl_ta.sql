insert into public.shipping_regions (code,name,sort_order) values ('CL-TA','Tarapacá',20) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('ta0101','CL-TA','Iquique',17990,5,9),
  ('ta0102','CL-TA','Alto Hospicio',17990,5,9),
  ('ta0201','CL-TA','Pozo Almonte',17990,5,9),
  ('ta0202','CL-TA','Camiña',17990,5,9),
  ('ta0203','CL-TA','Colchane',17990,5,9),
  ('ta0204','CL-TA','Huara',17990,5,9),
  ('ta0205','CL-TA','Pica',17990,5,9) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
