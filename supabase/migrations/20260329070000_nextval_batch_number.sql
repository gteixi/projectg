-- RPC to reserve the next batch number before inserting
create or replace function nextval_batch_number()
returns bigint
language sql
security definer
as $$
  select nextval('batch_number_seq');
$$;
