use smartcash;
create table receita (
ID integer not null auto_increment,
valor real,
periodo date,
origem integer,
periodicidade integer,
descricao varchar (30),
primary key (ID),
foreign key (origem) references origem (ID),
foreign key (periodicidade) references periodicidade (ID));