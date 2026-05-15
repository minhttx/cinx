## Table `ai_chat_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `role` | `text` |  |
| `content` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `booking_seats`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `booking_id` | `uuid` |  Nullable |
| `seat_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `seat_number` | `varchar` |  |
| `seat_price` | `numeric` |  |

## Table `bookings`

Private data - RLS enabled, users see only their bookings

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `showtime_id` | `uuid` |  Nullable |
| `customer_name` | `text` |  |
| `customer_email` | `text` |  Nullable |
| `customer_phone` | `text` |  Nullable |
| `total_amount` | `int4` |  |
| `booking_date` | `timestamptz` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `movie_id` | `int4` |  Nullable |
| `showtime_info` | `jsonb` |  Nullable |
| `seats` | `jsonb` |  Nullable |

## Table `comments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `movie_id` | `uuid` |  |
| `user_id` | `uuid` |  Nullable |
| `author_name` | `text` |  |
| `content` | `text` |  |
| `rating` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `ai_sentiment_score` | `float8` |  Nullable |
| `ai_sentiment_label` | `text` |  Nullable |
| `ai_sentiment_reason` | `text` |  Nullable |

## Table `movies`

Public content - RLS disabled for open read access

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `genre` | `text` |  Nullable |
| `duration` | `int4` |  Nullable |
| `rating` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `release_date` | `date` |  Nullable |
| `poster` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `cinema_room` | `int4` |  Nullable |
| `actors` | `text` |  Nullable |
| `trailer_url` | `text` |  Nullable |
| `age` | `varchar` |  Nullable |
| `room_id` | `uuid` |  Nullable |
| `is_hot` | `bool` |  Nullable |
| `is_imax` | `bool` |  Nullable |
| `is_4dx` | `bool` |  Nullable |

## Table `news`

Public content - RLS disabled for open read access

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `content` | `text` |  Nullable |
| `summary` | `text` |  Nullable |
| `image_url` | `text` |  Nullable |
| `status` | `text` |  Nullable |
| `publish_date` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `author_id` | `uuid` |  Nullable |

## Table `prices`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `key` | `text` |  Unique |
| `value` | `numeric` |  |

## Table `promotions`

Public content - RLS disabled for open read access

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `image_url` | `text` |  Nullable |
| `discount_percent` | `numeric` |  Nullable |
| `start_date` | `date` |  Nullable |
| `end_date` | `date` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `revenue_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `booking_id` | `uuid` |  Nullable |
| `movie_title` | `text` |  |
| `room_name` | `text` |  Nullable |
| `amount` | `int4` |  |
| `seats_count` | `int4` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `rooms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `type` | `text` |  |
| `multiplier` | `numeric` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `seats`

Public content - RLS disabled for seat selection

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `showtime_id` | `uuid` |  Nullable |
| `seat_number` | `text` |  |
| `row_letter` | `text` |  |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `seat_index` | `int4` |  |
| `seat_type` | `varchar` |  Nullable |
| `base_price` | `numeric` |  Nullable |
| `price` | `numeric` |  |

## Table `showtimes`

Public content - RLS disabled for open read access

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `movie_id` | `uuid` |  Nullable |
| `show_date` | `date` |  |
| `show_time` | `time` |  |
| `cinema_room` | `text` |  Nullable |
| `price` | `int4` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `room_id` | `uuid` |  Nullable |

## Table `system_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `action` | `text` |  |
| `detail` | `text` |  Nullable |
| `type` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `user_id` | `uuid` |  Nullable |

## Table `system_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `key` | `text` |  Unique |
| `value` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `users`

Users table with practical RLS policies - includes bootstrap for admin@cinemahub.vn

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  Nullable |
| `email` | `text` |  Unique |
| `phone` | `text` |  Nullable |
| `address` | `text` |  Nullable |
| `role` | `text` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `birth_year` | `int4` |  Nullable |


