use smartcash;
alter table fone
add constraint fk_codusuario foreign key (codusuario) references usuario (ID);
