
-- Restrict projects visibility strictly to members + owner
DROP POLICY IF EXISTS projects_select_member ON public.projects;
CREATE POLICY projects_select_member ON public.projects
FOR SELECT TO authenticated
USING (is_project_member(id, auth.uid()) OR owner_id = auth.uid());

-- Restrict tasks visibility strictly to project members
DROP POLICY IF EXISTS tasks_select_member ON public.tasks;
CREATE POLICY tasks_select_member ON public.tasks
FOR SELECT TO authenticated
USING (is_project_member(project_id, auth.uid()));

-- Restrict project_members visibility to that project's members only
DROP POLICY IF EXISTS pm_select ON public.project_members;
CREATE POLICY pm_select ON public.project_members
FOR SELECT TO authenticated
USING (is_project_member(project_id, auth.uid()));

-- Ensure owner is auto-added as a project member on insert
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_owner_as_member ON public.projects;
CREATE TRIGGER trg_add_owner_as_member
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- Add unique constraint to prevent duplicate memberships if not present
DO $$ BEGIN
  ALTER TABLE public.project_members ADD CONSTRAINT project_members_project_user_unique UNIQUE (project_id, user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;
