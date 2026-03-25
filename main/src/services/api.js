import { supabase } from './supabaseClient';
export const TABLES = { MOVIES: 'movies', SHOWTIMES: 'showtimes', SEATS: 'seats', BOOKINGS: 'bookings', BOOKING_SEATS: 'booking_seats', NEWS: 'news', PROMOTIONS: 'promotions', CAROUSEL: 'carousel_items', USERS: 'users', PRICES: 'prices', ROOMS: 'rooms', SYSTEM_LOGS: 'system_logs', COMMENTS: 'comments', REVENUE_HISTORY: 'revenue_history', SETTINGS: 'system_settings', AI_CHAT_HISTORY: 'ai_chat_history' };

export const aiChatAPI = {
  async getChatHistory(userId, limit = 20) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await supabase
      .from(TABLES.AI_CHAT_HISTORY)
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
  },
  async saveChatMessage(userId, role, content) {
    return await supabase
      .from(TABLES.AI_CHAT_HISTORY)
      .insert([{ user_id: userId, role, content }]);
  },
  async clearOldHistory() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return await supabase
      .from(TABLES.AI_CHAT_HISTORY)
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());
  }
};

export const movieAPI = {
  async getMovies() { return await supabase.from(TABLES.MOVIES).select('*, rooms(name, type)').order('created_at', { ascending: false }); },
  async getMovie(id) { return await supabase.from(TABLES.MOVIES).select('*, rooms(*)').eq('id', id).single(); },
  async getCurrentMovies() { return await supabase.from(TABLES.MOVIES).select('*, rooms(name, type)').eq('status', 'showing').order('created_at', { ascending: false }); },
  async getComingSoonMovies() { return await supabase.from(TABLES.MOVIES).select('*, rooms(name, type)').eq('status', 'coming').order('release_date', { ascending: true }); },
  async searchMovies(q) { return await supabase.from(TABLES.MOVIES).select('*, rooms(name, type)').or(`title.ilike.%${q}%,genre.ilike.%${q}%`).order('created_at', { ascending: false }); },
  async deleteMovie(id) { return await supabase.rpc('delete_movie_cascade', { movie_uuid: id }); },
  async createMovie(d) { return await supabase.from(TABLES.MOVIES).insert(d).select(); },
  async updateMovie(id, d) { return await supabase.from(TABLES.MOVIES).update(d).eq('id', id).select(); },
  async getTrendingMovies() {
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: b } = await supabase.from(TABLES.BOOKINGS).select('showtime_info').eq('status', 'confirmed').gte('created_at', sevenDaysAgo.toISOString());
    const counts = {};
    (b || []).forEach(x => {
      const info = typeof x.showtime_info === 'string' ? JSON.parse(x.showtime_info) : x.showtime_info;
      if (info?.movie_title) counts[info.movie_title] = (counts[info.movie_title] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(x => ({ title: x[0], score: x[1] }));
  }
};

export const roomAPI = {
  async getRooms() { return await supabase.from(TABLES.ROOMS).select('*').order('name', { ascending: true }); },
  async createRoom(d) { return await supabase.from(TABLES.ROOMS).insert(d).select(); },
  async updateRoom(id, d) { return await supabase.from(TABLES.ROOMS).update(d).eq('id', id).select(); },
  async deleteRoom(id) { return await supabase.from(TABLES.ROOMS).delete().eq('id', id); }
};

export const showtimeAPI = {
  async getMovieShowtimes(mid) { return await supabase.from(TABLES.SHOWTIMES).select('*').eq('movie_id', mid).gte('show_date', new Date().toISOString().split('T')[0]).order('show_date', { ascending: true }); },
  async getShowtimeSeatSummary(sid) {
    const { data: s } = await supabase.from(TABLES.SEATS).select('id, status').eq('showtime_id', sid);
    const total = s?.length || 0;
    const available = (s || []).filter(x => x.status === 'available').length;
    const vipAvailable = (s || []).filter(x => x.status === 'available' && x.seat_type === 'vip').length;
    return { total, available, vipAvailable };
  },
  async getMovieShowtimesInBulk(mids) {
    return await supabase.from(TABLES.SHOWTIMES).select('*').in('movie_id', mids).gte('show_date', new Date().toISOString().split('T')[0]).order('show_time', { ascending: true });
  },
  async getBulkShowtimeAvailability(sids) {
    // Use RPC to bypass the 1000-row limit and get accurate counts directly from DB
    const { data, error } = await supabase.rpc('get_bulk_showtime_availability', { 
      p_showtime_ids: sids 
    });
    
    if (error) {
      console.error('Availability RPC error:', error);
      return {};
    }

    const counts = {};
    (data || []).forEach(row => {
      counts[row.showtime_id] = row.available_count;
    });
    return counts;
  },
  async getDetailedSeatStats(sids) {
    // Sử dụng RPC để database tự tính toán counts, tránh lỗi 1000 rows limit và tăng tốc độ
    const { data, error } = await supabase.rpc('get_detailed_seat_stats', { 
      p_showtime_ids: sids 
    });
    
    if (error) {
      console.error('Detailed stats RPC error:', error);
      return {};
    }

    const stats = {};
    (data || []).forEach(row => {
      stats[row.showtime_id] = { 
        total: row.available_total, 
        vip: row.available_vip, 
        couple: row.available_couple, 
        centerVip: row.available_center_vip 
      };
    });
    return stats;
  }
};

export const bookingAPI = {
  async getSeats(sid) {
    const { data, error } = await supabase
      .from(TABLES.SEATS)
      .select(`*, booking_seats(id, bookings(status))`)
      .eq('showtime_id', sid)
      .order('row_letter', { ascending: true })
      .order('seat_index', { ascending: true });

    if (error) return { data: null, error };

    return { data: (data || []).map(s => {
      const isBookedInDB = s.booking_seats && s.booking_seats.some(bs => 
        bs.bookings && ['confirmed', 'pending'].includes(bs.bookings.status)
      );
      return { id: s.id, seat_id: s.id, soGhe: s.seat_number, gia: Number(s.price) || Number(s.base_price) || 0, daDat: isBookedInDB, loaiGhe: s.seat_type, rowLetter: s.row_letter, seatIndex: s.seat_index };
    }), error: null };
  },
  async createBooking(d) {
    const { user_id, showtime_id, seats, total_amount, customer_name, customer_email, customer_phone, showtime_info, status = 'confirmed' } = d;
    const { data: b, error: e } = await supabase.from(TABLES.BOOKINGS).insert({ user_id, showtime_id, total_amount, customer_name, customer_email, customer_phone, showtime_info, seats: JSON.stringify(seats), booking_date: new Date().toISOString(), status }).select().single();
    if (e) return { error: e };
    if (seats?.length > 0) {
      const recs = seats.map(s => ({ booking_id: b.id, seat_id: s.seat_id || s.id || null, seat_number: s.soGhe || s.seat_number, seat_price: s.gia || 0 }));
      await supabase.from(TABLES.BOOKING_SEATS).insert(recs);
      if (status === 'confirmed') {
        const ids = seats.map(s => s.seat_id || s.id).filter(id => id && typeof id !== 'string');
        if (ids.length > 0) await supabase.from(TABLES.SEATS).update({ status: 'booked' }).in('id', ids);
        
        // AUTO-RECORD TO REVENUE HISTORY
        await this.recordRevenue(b);
      }
    }
    return { data: b, error: null };
  },
  async updateBookingStatus(id, status, seats = []) {
    const { data, error } = await supabase.from(TABLES.BOOKINGS).update({ status }).eq('id', id).select().single();
    if (!error && status === 'confirmed') {
      if (seats.length > 0) {
        const ids = seats.map(s => s.seat_id || s.id).filter(id => id && typeof id !== 'string');
        if (ids.length > 0) await supabase.from(TABLES.SEATS).update({ status: 'booked' }).in('id', ids);
      }
      
      // AUTO-RECORD TO REVENUE HISTORY
      await this.recordRevenue(data);
    }
    return { data, error };
  },
  async recordRevenue(booking) {
    try {
      const info = typeof booking.showtime_info === 'string' ? JSON.parse(booking.showtime_info) : booking.showtime_info;
      const revenueData = {
        booking_id: booking.id,
        movie_title: info?.movie_title || 'N/A',
        room_name: info?.cinema_room || 'N/A',
        amount: booking.total_amount || 0,
        seats_count: info?.seats?.length || 0,
        created_at: new Date().toISOString()
      };
      await supabase.from(TABLES.REVENUE_HISTORY).insert([revenueData]);
    } catch (err) {
      console.error('Failed to record revenue:', err);
    }
  },
  async deleteBooking(id) {
    // Delete children first to satisfy foreign key constraints
    await supabase.from(TABLES.BOOKING_SEATS).delete().eq('booking_id', id);
    return await supabase.from(TABLES.BOOKINGS).delete().eq('id', id);
  },
  async getBookingById(id) {
    return await supabase.from(TABLES.BOOKINGS).select(`*, booking_seats(*), showtimes(*, movies(*))`).eq('id', id).single();
  },
  async getBookingForCheckin(id) {
    return await supabase.from(TABLES.BOOKINGS).select(`*, booking_seats(seat_number), showtimes(*, movies(title, duration))`).eq('id', id).single();
  },
  async getUserBookings(uid, email) {
    // ONLY GET CONFIRMED TICKETS FOR THE USER
    return await supabase.from(TABLES.BOOKINGS).select(`*, booking_seats(*), showtimes(*, movies(*))`).or(`user_id.eq.${uid},customer_email.eq.${email}`).eq('status', 'confirmed').order('booking_date', { ascending: false });
  }
};

export const contentAPI = {
  async getNews() { return await supabase.from(TABLES.NEWS).select('*').order('publish_date', { ascending: false }); },
  async createNews(d) { return await supabase.from(TABLES.NEWS).insert(d).select(); },
  async updateNews(id, d) { return await supabase.from(TABLES.NEWS).update(d).eq('id', id).select(); },
  async deleteNews(id) { return await supabase.from(TABLES.NEWS).delete().eq('id', id); },
  async getPromotions() { return await supabase.from(TABLES.PROMOTIONS).select('*').order('created_at', { ascending: false }); },
  async createPromotion(d) { return await supabase.from(TABLES.PROMOTIONS).insert(d).select(); },
  async updatePromotion(id, d) { return await supabase.from(TABLES.PROMOTIONS).update(d).eq('id', id).select(); },
  async deletePromotion(id) { return await supabase.from(TABLES.PROMOTIONS).delete().eq('id', id); },
  async getAllCarouselItems() { return await supabase.from(TABLES.CAROUSEL).select('*').order('order', { ascending: true }); },
  async updateCarouselItem(id, d) { return await supabase.from(TABLES.CAROUSEL).update(d).eq('id', id).select(); },
  async uploadCarouselImage(f) {
    const fn = `carousel/${Math.random()}.${f.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('assets').upload(fn, f);
    return error ? { error } : { publicUrl: supabase.storage.from('assets').getPublicUrl(fn).data.publicUrl };
  }
};

export const configurationAPI = {
  async getPricingConfig() {
    const { data } = await supabase.from(TABLES.PRICES).select('*');
    if (!data || data.length === 0) return { data: null };
    const p = {}; data.forEach(row => p[row.key] = Number(row.value));
    if (p.regular === undefined || p.vip === undefined || p.couple === undefined) return { data: null };
    return { data: { basePrice: p.regular, vipPrice: p.vip, couplePrice: p.couple, weekendMultiplier: p.weekend_multiplier || 1.0 } };
  },
  async savePricingConfig(c) {
    const rows = [{ key: 'regular', value: Number(c.basePrice) }, { key: 'vip', value: Number(c.vipPrice) }, { key: 'couple', value: Number(c.couplePrice) }, { key: 'weekend_multiplier', value: Number(c.weekendMultiplier) || 1.0 }];
    return await supabase.from(TABLES.PRICES).upsert(rows, { onConflict: 'key' });
  },
  async getAIConfig() {
    const { data } = await supabase.from(TABLES.SETTINGS).select('*').eq('key', 'active_ai_provider').single();
    return data ? data.value : 'llama';
  },
  async setAIConfig(provider) {
    return await supabase.from(TABLES.SETTINGS).upsert({ key: 'active_ai_provider', value: provider }, { onConflict: 'key' });
  },
  async getAISystemPrompt() {
    const { data } = await supabase.from(TABLES.SETTINGS).select('*').eq('key', 'ai_system_prompt').single();
    return data ? data.value : null;
  },
  async setAISystemPrompt(prompt) {
    return await supabase.from(TABLES.SETTINGS).upsert({ key: 'ai_system_prompt', value: prompt }, { onConflict: 'key' });
  }
};

export const showtimeManagementAPI = {
  async getLatestPrices() {
    const { data } = await configurationAPI.getPricingConfig();
    if (!data) throw new Error('Chưa cấu hình bảng prices!');
    return data;
  },
  async generateWeeklySchedule() {
    const p = await this.getLatestPrices();
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch Resources
    const { data: movies } = await supabase.from(TABLES.MOVIES).select('*').eq('status', 'showing');
    const { data: rooms } = await supabase.from(TABLES.ROOMS).select('*').eq('status', 'active');
    
    if (!movies || movies.length === 0) throw new Error('Không có phim nào đang ở trạng thái "Đang chiếu"!');
    if (!rooms || rooms.length === 0) throw new Error('Hệ thống chưa có phòng chiếu nào!');

    // 2. Intelligent Room Mapping
    const roomAssignments = []; // { room, movie }
    const imaxRooms = rooms.filter(r => r.type === 'IMAX');
    const dx4Rooms = rooms.filter(r => r.type === '4DX');
    const regularRooms = rooms.filter(r => r.type === '2D/3D');

    const imaxMovies = movies.filter(m => m.is_imax);
    const dx4Movies = movies.filter(m => m.is_4dx);
    const regularMovies = movies.filter(m => !m.is_imax && !m.is_4dx);
    const hotMovie = movies.find(m => m.is_hot);

    // Assign IMAX rooms: ONLY IMAX movies
    imaxRooms.forEach((room, idx) => {
      if (imaxMovies.length > 0) {
        roomAssignments.push({ room, movie: imaxMovies[idx % imaxMovies.length] });
      }
    });

    // Assign 4DX rooms: ONLY 4DX movies
    dx4Rooms.forEach((room, idx) => {
      if (dx4Movies.length > 0) {
        roomAssignments.push({ room, movie: dx4Movies[idx % dx4Movies.length] });
      }
    });

    // Assign Regular rooms: PRIORITIZE regular movies, fallback to others if no regular movies exist
    regularRooms.forEach((room, idx) => {
      // Use regular movies pool if available, otherwise use any movie
      const pool = regularMovies.length > 0 ? regularMovies : movies;
      const movie = pool[idx % pool.length];
      if (movie) {
        roomAssignments.push({ room, movie });
      }
    });

    // 3. Prepare Batch Data
    const newShowtimes = [];
    const times = ['09:00:00', '13:00:00', '16:00:00', '19:00:00', '21:30:00'];
    const primeTime = '19:00:00';

    for (let d = 0; d < 7; d++) {
      const dt = new Date();
      dt.setDate(dt.getDate() + d);
      const dateStr = dt.toISOString().split('T')[0];
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
      const dayMult = isWeekend ? p.weekendMultiplier : 1;

      roomAssignments.forEach(({ room, movie }) => {
        const roomMult = Number(room.multiplier) || 1.0;
        
        times.forEach(timeStr => {
          let assignedMovie = movie;

          // Hijack logic: Any HOT movie (Regular, IMAX, or 4DX) takes 19:00 in ALL regular rooms
          if (timeStr === primeTime && room.type === '2D/3D' && hotMovie) {
            assignedMovie = hotMovie;
          }

          if (assignedMovie && assignedMovie.id) {
            newShowtimes.push({
              movie_id: assignedMovie.id,
              room_id: room.id,
              show_date: dateStr,
              show_time: timeStr,
              cinema_room: room.name,
              price: Math.round((p.basePrice * dayMult) * roomMult)
            });
          }
        });
      });
    }

    // 4. Execute: Clear and Insert
    // For simplicity in this flow, we clear all showtimes from today onwards
    await supabase.from(TABLES.SHOWTIMES).delete().gte('show_date', today);
    
    const { data: createdSts, error } = await supabase.from(TABLES.SHOWTIMES).insert(newShowtimes).select('*');
    if (error) throw error;

    // 5. Mass Seat Generation (Async)
    for (const st of createdSts || []) {
      await supabase.rpc('generate_seats_for_showtime', { p_showtime_id: st.id });
    }

    return { count: createdSts?.length || 0 };
  },
  async setupMovieSchedule(mid, opt = {}) {
    const { data: st, error: e } = await this.generateShowtimes(mid, opt);
    if (e) return { error: e };
    for (const s of st || []) { await supabase.rpc('generate_seats_for_showtime', { p_showtime_id: s.id }); }
    return { data: { showtimes: st?.length || 0, seats: (st?.length || 0) * 90 }, error: null };
  },
  async clearMovieSchedule(mid) { return await supabase.rpc('clear_movie_showtimes_cascade', { target_movie_id: mid }); }
};

export const userAPI = {
  async getAllUsers() { return await supabase.from(TABLES.USERS).select('*'); },
  async updateUserStatus(id, s) { return await supabase.from(TABLES.USERS).update({ status: s }).eq('id', id); },
  async updateProfile(id, data) { return await supabase.from(TABLES.USERS).update(data).eq('id', id); }
};

export const logAPI = {
  async logAdminAction(action, detail, type, userId = null) {
    const payload = { action, detail, type };
    if (userId) payload.user_id = userId;
    return await supabase.from(TABLES.SYSTEM_LOGS).insert([payload]);
  },
  async getSystemLogs(limit = 20) {
    return await supabase.from(TABLES.SYSTEM_LOGS).select('*').neq('type', 'checkin').order('created_at', { ascending: false }).limit(limit);
  },
  async getCheckinLogs(limit = 50, userId = null) {
    let query = supabase.from(TABLES.SYSTEM_LOGS).select('*').eq('type', 'checkin').order('created_at', { ascending: false }).limit(limit);
    if (userId) query = query.eq('user_id', userId);
    return await query;
  },
  async logCheckin(userId, userName, movieTitle, showtime) {
    const action = "Quét vé thành công";
    const detail = `Mod: ${userName} | Phim: ${movieTitle} | Suất: ${showtime}`;
    return await this.logAdminAction(action, detail, 'checkin', userId);
  }
};

export const commentAPI = {
  async getMovieComments(movieId) {
    return await supabase.from(TABLES.COMMENTS)
      .select('*')
      .eq('movie_id', movieId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
  },
  async postComment(data) {
    return await supabase.from(TABLES.COMMENTS).insert([data]);
  },
  async getModerationList() {
    return await supabase.from(TABLES.COMMENTS)
      .select('*, movies(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
  },
  async getCommentsByStatus(status) {
    return await supabase.from(TABLES.COMMENTS)
      .select('*, movies(title)')
      .eq('status', status)
      .order('created_at', { ascending: false });
  },
  async updateCommentStatus(id, status) {
    return await supabase.from(TABLES.COMMENTS).update({ status }).eq('id', id);
  },
  async saveCommentSentiment(id, sentimentData) {
    return await supabase.from(TABLES.COMMENTS).update({ 
      ai_sentiment_score: sentimentData.score,
      ai_sentiment_label: sentimentData.label,
      ai_sentiment_reason: sentimentData.reason
    }).eq('id', id);
  }
};

export const overviewAPI = {
  async getNowShowingMovies() { return await supabase.from(TABLES.MOVIES).select('*').eq('status', 'showing').limit(10); },
  async getUserStats() {
    const { data: u } = await supabase.from(TABLES.USERS).select('role');
    return { data: { totalUsers: u?.length || 0, adminUsers: u?.filter(x => x.role === 'admin').length || 0, regularUsers: u?.filter(x => x.role !== 'admin').length || 0 } };
  },
  async getBookingStats() {
    const { data: b } = await supabase.from(TABLES.BOOKINGS).select('id, total_amount, created_at, showtime_info, customer_name').order('created_at', { ascending: false });
    return { data: { totalBookings: b?.length || 0, recentBookings: (b || []).slice(0, 10).map(x => ({ 
      id: x.id, 
      movieTitle: (typeof x.showtime_info === 'string' ? JSON.parse(x.showtime_info) : x.showtime_info)?.movie_title || 'N/A', 
      totalAmount: x.total_amount, 
      createdAt: x.created_at, 
      seats: (typeof x.showtime_info === 'string' ? JSON.parse(x.showtime_info) : x.showtime_info)?.seats?.length || 0,
      customerName: x.customer_name
    })) } };
  },
  async checkDatabaseStatus() {
    const { error } = await supabase.from(TABLES.MOVIES).select('id').limit(1);
    return { data: { connected: !error, lastCheck: new Date().toISOString() } };
  },
  async getBookingHourStats() {
    const { data: b } = await supabase.from(TABLES.BOOKINGS).select('showtime_info');
    const hourCounts = {};
    (b || []).forEach(x => {
      const info = typeof x.showtime_info === 'string' ? JSON.parse(x.showtime_info) : x.showtime_info;
      if (info?.show_time) {
        const hour = info.show_time.split(':')[0] + ':00';
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    return hourCounts;
  },
  async getRevenueStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from(TABLES.REVENUE_HISTORY)
      .select('amount, created_at, movie_title, seats_count')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
      
    return { data, error };
  }
};
