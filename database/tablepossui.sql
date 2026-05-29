use smartcash;
create table possui (
ID integer not null auto_increment,
idusuario integer,
idconta integer,
primary key (ID),
foreign key (idusuario) references usuario (ID),
foreign key (idconta) references conta (ID));