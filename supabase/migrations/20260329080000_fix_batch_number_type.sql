-- Fix stock_exit_lots.batch_number type: text -> integer to match production_logs
alter table stock_exit_lots
  alter column batch_number type integer using batch_number::integer;
