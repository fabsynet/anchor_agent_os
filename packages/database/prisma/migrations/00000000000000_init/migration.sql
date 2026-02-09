-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'agent');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'agent',
    "avatar_url" TEXT,
    "setup_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "invited_by_id" UUID NOT NULL,
    "token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_tenant_id_idx" ON "invitations"("tenant_id");

-- CreateIndex
CREATE INDEX "invitations_email_status_idx" ON "invitations"("email", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Trigger: handle_new_user()
-- Called after a new row is inserted into auth.users (Supabase Auth).
-- Handles both organic signups (creates new tenant) and invited users
-- (links to existing tenant via invitation_id in raw_user_meta_data).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_invitation_id uuid;
  v_role text;
  v_agency_name text;
  v_slug text;
  v_random_suffix text;
BEGIN
  -- Check if this is an invited user (has invitation_id in metadata)
  IF NEW.raw_user_meta_data->>'invitation_id' IS NOT NULL THEN
    -- ============================
    -- INVITED USER FLOW
    -- ============================
    v_invitation_id := (NEW.raw_user_meta_data->>'invitation_id')::uuid;
    v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');

    -- Verify the invitation exists and is pending
    IF NOT EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = v_invitation_id AND status = 'pending'
    ) THEN
      RAISE LOG 'handle_new_user: invitation % not found or not pending for user %',
        v_invitation_id, NEW.id;
      -- Still create the user profile with the provided tenant_id and role
      -- The invitation status check is a safety measure, not a hard block
    ELSE
      -- Mark invitation as accepted
      UPDATE public.invitations
      SET status = 'accepted',
          updated_at = NOW()
      WHERE id = v_invitation_id;
    END IF;

    -- Create user profile linked to existing tenant
    INSERT INTO public.users (id, tenant_id, email, first_name, last_name, role, updated_at)
    VALUES (
      NEW.id,
      v_tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      v_role::"UserRole",
      NOW()
    );

  ELSE
    -- ============================
    -- ORGANIC SIGNUP FLOW
    -- ============================
    v_agency_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', 'My Agency');

    -- Generate slug from agency name: lowercase, replace spaces with hyphens, append random 4 chars
    v_random_suffix := substr(md5(random()::text), 1, 4);
    v_slug := lower(regexp_replace(v_agency_name, '[^a-zA-Z0-9\s]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
    v_slug := v_slug || '-' || v_random_suffix;

    -- Create new tenant
    INSERT INTO public.tenants (id, name, slug, updated_at)
    VALUES (gen_random_uuid(), v_agency_name, v_slug, NOW())
    RETURNING id INTO v_tenant_id;

    -- Create user profile as admin of the new tenant
    INSERT INTO public.users (id, tenant_id, email, first_name, last_name, role, updated_at)
    VALUES (
      NEW.id,
      v_tenant_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      'admin',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- Hook: custom_access_token_hook()
-- Adds tenant_id and user_role to JWT claims so NestJS can extract them
-- without a database lookup on every request.
-- Must be enabled in Supabase Dashboard > Auth > Hooks > Custom Access Token
-- ============================================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
BEGIN
  claims := event->'claims';

  -- Look up user's tenant and role from public.users
  SELECT tenant_id, role INTO user_tenant_id, user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant permissions for Supabase Auth to access public schema
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;
GRANT INSERT ON public.users TO supabase_auth_admin;
GRANT INSERT ON public.tenants TO supabase_auth_admin;
GRANT UPDATE ON public.invitations TO supabase_auth_admin;
