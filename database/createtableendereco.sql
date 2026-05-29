use smartcash;
create table endereco  (
ID integer not null auto_increment,
rua varchar (50),
num integer,
bairro varchar (20),
cidade varchar (35),
uf char (2),
cep char (9),
primary key (ID)); 
