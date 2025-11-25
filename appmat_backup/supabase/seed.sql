insert into public.categories (id, name, image) values
  (uuid_generate_v4(), 'Nasi', '/images/nasi.png'),
  (uuid_generate_v4(), 'Mee', '/images/mee.png'),
  (uuid_generate_v4(), 'Kopi', '/images/kopi.png'),
  (uuid_generate_v4(), 'Western', '/images/western.png'),
  (uuid_generate_v4(), 'Dessert', '/images/dessert.png');

insert into public.products (id, name, description, price, category_id, image_url)
select uuid_generate_v4(), 'Nasi Kerabu Ayam', 'Resepi Kelantan', 12.50, id, '/food/nasi-kerabu.jpg'
from public.categories where name = 'Nasi';

insert into public.products
select uuid_generate_v4(), 'Mee Goreng Mamak', 'Pedas dan padu', 8.50, id, '/food/mee-mamak.jpg'
from public.categories where name = 'Mee';

insert into public.products
select uuid_generate_v4(), 'Iced Latte', 'Kopi susu premium', 9.90, id, '/food/latte.jpg'
from public.categories where name = 'Kopi';
