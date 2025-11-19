UPDATE Messages SET Subject = 'No Subject' WHERE Subject IS NULL OR Subject = '';
UPDATE Messages SET RecipientType = 'individual' WHERE RecipientType IS NULL OR RecipientType = '';
