use smartcash;
create table docs (
ID integer not null auto_increment,
cpf char (11),
rg char (7),
comp_resid blob,
primary key (ID));
