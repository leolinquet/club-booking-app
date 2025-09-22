BEGIN;

-- Only insert the manager if a user with that username doesn't exist.
-- NOTE: adapt as needed for your users schema. This migration tries a best-effort
-- insert using common columns. If your schema differs, adjust manually.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE LOWER(username)=LOWER('leolinquet')) THEN
    INSERT INTO users (display_name, username, email, password_hash, role, is_manager, email_verified_at)
    VALUES (
      'leolinquet',
      'leolinquet',
      'leolinquet@example.local',
      crypt('1234', gen_salt('bf', 10)), -- NOTE: this uses Postgres crypt; may not match your app's bcrypt stores
      'manager',
      true,
      NOW()
    );
  END IF;
END$$;

COMMIT;
