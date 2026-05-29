use smartcash;
create table conta (
ID integer not null auto_increment,
nome varchar (50),
tipo integer,
banco integer,
saldo real,
situacao integer,
primary key (ID),
foreign key (tipo) references tipo (ID),
foreign key (banco) references banco (ID),
foreign key (situacao) references situacao (ID));