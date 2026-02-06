-- Returns ticket type metadata together with the requesting user's balance in a single call
create or replace function public.get_ticket_balances(p_user_id uuid)
returns table (
  code text,
  name text,
  color text,
  sort_order integer,
  quantity integer
)
language sql
stable
as $$
  select
    tt.code,
    tt.name,
    tt.color,
    coalesce(tt.sort_order, row_number() over (order by tt.sort_order nulls last, tt.created_at)) as sort_order,
    coalesce(ut.quantity, 0)::integer as quantity
  from ticket_types tt
  left join user_tickets ut
    on ut.ticket_type_id = tt.id
   and ut.user_id = p_user_id
  order by tt.sort_order nulls last, tt.created_at;
$$;

comment on function public.get_ticket_balances is 'Returns ticket type metadata with the requesting user''s quantity.';
