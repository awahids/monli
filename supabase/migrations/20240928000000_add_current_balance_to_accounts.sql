-- Add current_balance column to accounts and maintain via triggers

alter table accounts add column current_balance numeric not null default 0;

-- backfill existing accounts with computed balances
update accounts a set current_balance = a.opening_balance
  + coalesce((select sum(amount) from transactions t where t.account_id = a.id and t.type = 'income'), 0)
  - coalesce((select sum(amount) from transactions t where t.account_id = a.id and t.type = 'expense'), 0)
  - coalesce((select sum(amount) from transactions t where t.from_account_id = a.id and t.type = 'transfer'), 0)
  + coalesce((select sum(amount) from transactions t where t.to_account_id = a.id and t.type = 'transfer'), 0);

-- trigger function to keep current_balance in sync with transactions
create or replace function update_account_current_balance()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (NEW.type = 'income') then
      update accounts set current_balance = current_balance + NEW.amount where id = NEW.account_id;
    elsif (NEW.type = 'expense') then
      update accounts set current_balance = current_balance - NEW.amount where id = NEW.account_id;
    elsif (NEW.type = 'transfer') then
      update accounts set current_balance = current_balance - NEW.amount where id = NEW.from_account_id;
      update accounts set current_balance = current_balance + NEW.amount where id = NEW.to_account_id;
    end if;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    -- revert old values
    if (OLD.type = 'income') then
      update accounts set current_balance = current_balance - OLD.amount where id = OLD.account_id;
    elsif (OLD.type = 'expense') then
      update accounts set current_balance = current_balance + OLD.amount where id = OLD.account_id;
    elsif (OLD.type = 'transfer') then
      update accounts set current_balance = current_balance + OLD.amount where id = OLD.from_account_id;
      update accounts set current_balance = current_balance - OLD.amount where id = OLD.to_account_id;
    end if;
    -- apply new values
    if (NEW.type = 'income') then
      update accounts set current_balance = current_balance + NEW.amount where id = NEW.account_id;
    elsif (NEW.type = 'expense') then
      update accounts set current_balance = current_balance - NEW.amount where id = NEW.account_id;
    elsif (NEW.type = 'transfer') then
      update accounts set current_balance = current_balance - NEW.amount where id = NEW.from_account_id;
      update accounts set current_balance = current_balance + NEW.amount where id = NEW.to_account_id;
    end if;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    if (OLD.type = 'income') then
      update accounts set current_balance = current_balance - OLD.amount where id = OLD.account_id;
    elsif (OLD.type = 'expense') then
      update accounts set current_balance = current_balance + OLD.amount where id = OLD.account_id;
    elsif (OLD.type = 'transfer') then
      update accounts set current_balance = current_balance + OLD.amount where id = OLD.from_account_id;
      update accounts set current_balance = current_balance - OLD.amount where id = OLD.to_account_id;
    end if;
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger transactions_update_account_balance
  after insert or update or delete on transactions
  for each row execute function update_account_current_balance();

-- adjust current_balance if opening_balance is changed
create or replace function adjust_account_balance_on_opening_update()
returns trigger as $$
begin
  if (NEW.opening_balance <> OLD.opening_balance) then
    NEW.current_balance := NEW.current_balance - OLD.opening_balance + NEW.opening_balance;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger accounts_adjust_balance_before_update
  before update on accounts
  for each row execute function adjust_account_balance_on_opening_update();
