-- Make a person an admin of Cleaning Twin.
--
-- Run this in the Supabase SQL editor. Replace the email with the address
-- they use to sign in. It works whether or not they have already registered:
-- the next request from that login is an admin, and a later sign-up with the
-- same email becomes an admin too.
--
-- This is the only supported way to grant admin. The app cannot write this
-- table, and clients cannot read it.

insert into public.admin_emails (email)
values ('you@example.com')
on conflict (email) do nothing;
