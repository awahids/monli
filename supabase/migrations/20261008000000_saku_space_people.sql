-- Names of the people in a space (owner and active members), so a shared
-- transaction list can say who recorded each entry. Profiles RLS doesn't let
-- an owner read members' profiles (or members read each other's), hence a
-- definer function that only answers for spaces the caller can read.
create function saku.space_people(space_owner uuid)
  returns table (id uuid, name text)
  language sql stable security definer
  set search_path to 'saku'
  as $$
  select p.id, p.name
    from profiles p
   where space_owner in (select readable_owner_ids())
     and (p.id = space_owner
          or p.id in (select m.member_id from space_members m
                       where m.owner_id = space_owner and m.status = 'active'));
$$;

revoke execute on function saku.space_people(uuid) from public;
grant execute on function saku.space_people(uuid) to authenticated, service_role;
