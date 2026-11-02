begin;

-- Initial coverage requested by the store owner. Product overrides remain editable.
update public.categories
set shipping_rm_only = name in ('Muebles', 'Muebles a Pedido', 'Comedores', 'Espejos', 'Coffe / Bar')
where active;

update public.products as p
set shipping_scope = case when c.shipping_rm_only then 'rm' else 'chile' end
from public.categories as c
where p.category_id = c.id and c.active and p.shipping_scope is null;

commit;
