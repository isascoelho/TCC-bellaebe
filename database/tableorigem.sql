use smartcash;
create table origem (
ID integer not null auto_increment,
banco integer,
agencia integer,
nºemissor integer,
primary key (ID),
foreign key (banco) references banco (ID));