-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid()::text = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid()::text = id );
