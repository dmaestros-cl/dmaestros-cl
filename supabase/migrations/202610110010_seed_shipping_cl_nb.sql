insert into public.shipping_regions (code,name,sort_order) values ('CL-NB','Región del Ñuble',100) on conflict (code) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.shipping_rates (commune_code,region_code,commune_name,price,estimated_days_min,estimated_days_max) values
  ('nb0101','CL-NB','Bulnes',10990,3,6),
  ('nb0102','CL-NB','Chillán',10990,3,6),
  ('nb0103','CL-NB','Chillán Viejo',10990,3,6),
  ('nb0104','CL-NB','El Carmen',10990,3,6),
  ('nb0105','CL-NB','Pemuco',10990,3,6),
  ('nb0106','CL-NB','Pinto',10990,3,6),
  ('nb0107','CL-NB','Quillón',10990,3,6),
  ('nb0108','CL-NB','San Ignacio',10990,3,6),
  ('nb0109','CL-NB','Yungay',10990,3,6),
  ('nb0201','CL-NB','Cobquecura',10990,3,6),
  ('nb0202','CL-NB','Coelemu',10990,3,6),
  ('nb0203','CL-NB','Ninhue',10990,3,6),
  ('nb0204','CL-NB','Portezuelo',10990,3,6),
  ('nb0205','CL-NB','Quirihue',10990,3,6),
  ('nb0206','CL-NB','Ránquil',10990,3,6),
  ('nb0207','CL-NB','Treguaco',10990,3,6),
  ('nb0301','CL-NB','Coihueco',10990,3,6),
  ('nb0302','CL-NB','Ñiquén',10990,3,6),
  ('nb0303','CL-NB','San Carlos',10990,3,6),
  ('nb0304','CL-NB','San Fabián',10990,3,6),
  ('nb0305','CL-NB','San Nicolas',10990,3,6) on conflict (commune_code) do update set region_code=excluded.region_code, commune_name=excluded.commune_name;
