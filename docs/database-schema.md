# ScholarAI — Database Schema

All tables live in Supabase (PostgreSQL). Create these in the Supabase SQL editor.

## Tables

### users (managed by Supabase Auth — do not create manually)
Supabase Auth handles this. Access via `auth.users`.

---

### profiles
Extends Supabase auth.users with app-specific fields.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  faculty     text not null,  -- 'engineering' | 'law' | 'medicine' | 'business' | 'general'
  university  text default 'Lagos State University',
  created_at  timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, faculty)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'faculty');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

### courses
```sql
create table courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,           -- e.g. "ECE 514 — Digital Control Systems"
  course_code text,                    -- e.g. "ECE514"
  faculty     text not null,           -- inherited from user profile
  created_at  timestamptz default now()
);

create index on courses(user_id);
```

---

### documents
```sql
create table documents (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,           -- original filename
  storage_path text not null,          -- path in Supabase Storage
  size_bytes  bigint,
  status      text default 'processing', -- 'processing' | 'ready' | 'error'
  created_at  timestamptz default now()
);

create index on documents(course_id);
```

---

### topic_interactions
Tracks every query and quiz — powers the progress tracker.

```sql
create table topic_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  topic_tag   text not null,           -- extracted topic keyword
  type        text not null,           -- 'query' | 'quiz' | 'summary'
  created_at  timestamptz default now()
);

create index on topic_interactions(user_id, course_id);
```

---

### study_rooms
```sql
create table study_rooms (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  name        text not null,
  invite_code text unique default substring(md5(random()::text), 1, 8),
  created_at  timestamptz default now()
);
```

---

### room_members
```sql
create table room_members (
  room_id     uuid not null references study_rooms(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (room_id, user_id)
);
```

---

## Storage Buckets

Create in Supabase Storage:
- `course-documents` — private bucket, stores all uploaded PDFs
  - Access policy: authenticated users can upload/read their own files only
