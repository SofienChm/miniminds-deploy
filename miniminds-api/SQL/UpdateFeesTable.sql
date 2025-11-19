-- Add missing PaymentNotes column to Fees table
ALTER TABLE Fees ADD COLUMN PaymentNotes VARCHAR(1000) NULL;
