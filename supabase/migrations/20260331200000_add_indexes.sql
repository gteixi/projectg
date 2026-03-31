-- Performance: add indexes on frequently filtered columns

-- kitchen_user_id (used in WHERE on every query)
create index idx_productions_kitchen_user_id on productions(kitchen_user_id);
create index idx_production_logs_kitchen_user_id on production_logs(kitchen_user_id);
create index idx_stock_exits_kitchen_user_id on stock_exits(kitchen_user_id);
create index idx_stock_exit_lots_kitchen_user_id on stock_exit_lots(kitchen_user_id);

-- production_id (used in JOINs and WHERE)
create index idx_production_logs_production_id on production_logs(production_id);
create index idx_stock_exits_production_id on stock_exits(production_id);

-- batch_number on stock_exit_lots (used for FIFO calculations)
create index idx_stock_exit_lots_batch_number on stock_exit_lots(batch_number);

-- expires_at (used for urgent page, afegir filtering)
create index idx_production_logs_expires_at on production_logs(expires_at)
  where expires_at is not null;

-- logged_at (used for historial date range queries)
create index idx_production_logs_logged_at on production_logs(logged_at);
create index idx_stock_exits_logged_at on stock_exits(logged_at);
