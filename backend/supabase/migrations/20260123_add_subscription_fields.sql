-- Add type and category to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN type VARCHAR(10) DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
ADD COLUMN category VARCHAR(50) DEFAULT 'Subscription';

-- Make type NOT NULL (defaults applied to existing rows)
ALTER TABLE subscriptions ALTER COLUMN type SET NOT NULL;
