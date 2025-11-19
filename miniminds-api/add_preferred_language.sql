-- Add PreferredLanguage column to AspNetUsers table
ALTER TABLE AspNetUsers ADD COLUMN PreferredLanguage VARCHAR(10) NULL;
