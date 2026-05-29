use smartcash;
create table despesa (
ID integer not null auto_increment,
periodo date,
hora time,
valor real,
parcelamento boolean,
situacao integer,
descricao varchar (30),
periodicidade integer,
obs varchar (30),
primary key (ID),
foreign key (situacao) references situacao (ID),
foreign key (periodicidade) references periodicidade (ID));