-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_chat_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_chat_history_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.booking_seats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid,
  seat_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  seat_number character varying NOT NULL DEFAULT 'A1'::character varying,
  seat_price numeric NOT NULL DEFAULT 75000,
  CONSTRAINT booking_seats_pkey PRIMARY KEY (id),
  CONSTRAINT booking_seats_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id),
  CONSTRAINT booking_seats_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  showtime_id uuid,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  total_amount integer NOT NULL,
  booking_date timestamp with time zone DEFAULT now(),
  status text DEFAULT 'confirmed'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'expired'::text, 'checked_in'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  movie_id integer,
  showtime_info jsonb DEFAULT '{}'::jsonb,
  seats jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT bookings_showtime_id_fkey FOREIGN KEY (showtime_id) REFERENCES public.showtimes(id)
);
CREATE TABLE public.carousel_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  display_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT carousel_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  movie_id uuid NOT NULL,
  user_id uuid,
  author_name text NOT NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 0 AND rating <= 100),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.movies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  genre text,
  duration integer,
  rating integer,
  status text DEFAULT 'showing'::text CHECK (status = ANY (ARRAY['showing'::text, 'coming'::text, 'ended'::text, 'end'::text])),
  release_date date,
  poster text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  cinema_room integer CHECK (cinema_room IS NULL OR cinema_room >= 1 AND cinema_room <= 5),
  actors text,
  trailer_url text,
  age character varying DEFAULT 'P'::character varying,
  room_id uuid,
  is_hot boolean DEFAULT false,
  is_imax boolean DEFAULT false,
  is_4dx boolean DEFAULT false,
  CONSTRAINT movies_pkey PRIMARY KEY (id),
  CONSTRAINT movies_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text,
  summary text,
  image_url text,
  status text DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  publish_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  author_id uuid,
  CONSTRAINT news_pkey PRIMARY KEY (id),
  CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value numeric NOT NULL,
  CONSTRAINT prices_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text,
  discount_percent numeric,
  start_date date,
  end_date date,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'expired'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.revenue_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid,
  movie_title text NOT NULL,
  room_name text,
  amount integer NOT NULL,
  seats_count integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT revenue_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  multiplier numeric DEFAULT 1.0,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.seats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  showtime_id uuid,
  seat_number text NOT NULL,
  row_letter text NOT NULL,
  status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'booked'::text, 'reserved'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  seat_index integer NOT NULL,
  seat_type character varying DEFAULT 'regular'::character varying,
  base_price numeric,
  price numeric NOT NULL,
  CONSTRAINT seats_pkey PRIMARY KEY (id),
  CONSTRAINT seats_showtime_id_fkey FOREIGN KEY (showtime_id) REFERENCES public.showtimes(id)
);
CREATE TABLE public.showtimes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  movie_id uuid,
  show_date date NOT NULL,
  show_time time without time zone NOT NULL,
  cinema_room text DEFAULT 'Room 1'::text,
  price integer DEFAULT 75000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  room_id uuid,
  CONSTRAINT showtimes_pkey PRIMARY KEY (id),
  CONSTRAINT showtimes_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id),
  CONSTRAINT showtimes_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  action text NOT NULL,
  detail text,
  type text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id),
  CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'mod'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'banned'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  birth_year integer,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
