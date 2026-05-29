use smartcash;
create table agenda (
ID integer not null auto_increment,
data_inc date,
data_pvst date,
valor_limite real,
valor_gasto real,
objetivo varchar (30),
obs varchar (50),
codusuario integer,
primary key (ID),
foreign key (codusuario) references usuario (ID));