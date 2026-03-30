-- Fix duplicate batch_numbers before adding UNIQUE constraint
-- Reassign duplicates to new unique batch numbers using nextval
do $$
declare
  rec record;
  new_bn bigint;
begin
  -- For each duplicate (keep the oldest, reassign the rest)
  for rec in
    select id
    from (
      select id, batch_number,
             row_number() over (partition by batch_number order by logged_at asc, id asc) as rn
      from production_logs
      where batch_number is not null
    ) sub
    where rn > 1
  loop
    select nextval_batch_number() into new_bn;
    update production_logs set batch_number = new_bn where id = rec.id;
  end loop;

  -- Now add the unique constraint
  if not exists (
    select 1
    from pg_constraint
    where conname = 'production_logs_batch_number_key'
      and conrelid = 'production_logs'::regclass
  ) then
    alter table production_logs
      add constraint production_logs_batch_number_key unique (batch_number);
  end if;
end
$$;
