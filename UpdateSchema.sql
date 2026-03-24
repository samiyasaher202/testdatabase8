// post office phone number datatype fix
alter table post_office modify Phone_Number Phone_Number varchar(20) not null;
  //post office time constraint fix
alter table post_office modify Sun_Start_Time time not null default '00:00:00' check(Sun_Start_Time >= '00:00:00' and Sun_Start_Time <= '23:59:59');
alter table post_office modify Sun_Finish_Time time not null default '00:00:00' check(Sun_Finish_Time >= '00:00:00' and Sun_Finish_Time <= '23:59:59');
alter table post_office modify Mon_Start_Time time not null default '00:00:00' check(Mon_Start_Time >= '00:00:00' and Mon_Start_Time <= '23:59:59');
alter table post_office modify Mon_Finish_Time time not null default '00:00:00' check(Mon_Finish_Time >= '00:00:00' and Mon_Finish_Time <= '23:59:59');
alter table post_office RENAME column Tues_Start_Time TO Tue_Start_Time;
alter table post_office modify Tue_Start_Time time not null default '00:00:00' check(Tue_Start_Time >= '00:00:00' and Tue_Start_Time <= '23:59:59');
alter table post_office modify tue_Finish_Time time not null default '00:00:00' check(tue_Finish_Time >= '00:00:00' and tue_Finish_Time <= '23:59:59');
alter table post_office modify wed_Start_Time time not null default '00:00:00' check(wed_Start_Time >= '00:00:00' and wed_Start_Time <= '23:59:59');
alter table post_office modify wed_Finish_Time time not null default '00:00:00' check(wed_Finish_Time >= '00:00:00' and wed_Finish_Time <= '23:59:59');
alter table post_office modify thu_Start_Time time not null default '00:00:00' check(thu_Start_Time >= '00:00:00' and thu_Start_Time <= '23:59:59');
alter table post_office modify thu_Finish_Time time not null default '00:00:00' check(thu_Finish_Time >= '00:00:00' and thu_Finish_Time <= '23:59:59');
alter table post_office modify fri_Start_Time time not null default '00:00:00' check(fri_Start_Time >= '00:00:00' and fri_Start_Time <= '23:59:59');
alter table post_office modify fri_Finish_Time time not null default '00:00:00' check(fri_Finish_Time >= '00:00:00' and fri_Finish_Time <= '23:59:59');
alter table post_office modify sat_Start_Time time not null default '00:00:00' check(sat_Start_Time >= '00:00:00' and sat_Start_Time <= '23:59:59');
alter table post_office modify sat_Finish_Time time not null default '00:00:00' check(sat_Finish_Time >= '00:00:00' and sat_Finish_Time <= '23:59:59');

//employee password, email,phone number add in
alter table employee add Password_Hash varchar(255) not null;
alter table employee add Email_Address varchar(255) not null unique;
alter table employee add Phone_Number varchar(20) null;
