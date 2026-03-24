/**
 * CinX AI Service - Unified AI Orchestrator (Ollama Powered)
 * FIXED: Added weekend price detection
 */
import { movieAPI, bookingAPI, showtimeAPI, configurationAPI, aiChatAPI, commentAPI } from './api';

const OLLAMA_ENDPOINT = "/ai-api/chat";
const OLLAMA_MODELS = {
    llama: 'llama3.2:3b',
    gemini: 'gemini-3-flash-preview:cloud'
};

const DEFAULT_PRICING = {
    basePrice: 70000,
    vipPrice: 90000,
    couplePrice: 120000,
    weekendMultiplier: 1.1
};

/**
 * 1. Utility: Sanitize and Date/Time Helpers
 */
const sanitizeForPrompt = (input) => {
    if (!input) return "";
    return input.toString().replace(/["\\]/g, '\\$&').replace(/\n/g, ' ');
};

const getVnDate = () => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
};

const getVnDayName = () => {
    return new Date().toLocaleDateString('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' });
};

/**
 * NEW: Weekday Date Calculator
 */
const WEEKDAY_MAP = {
    'thứ hai': 1, 'thu hai': 1, 'thứ 2': 1,
    'thứ ba': 2, 'thu ba': 2, 'thứ 3': 2,
    'thứ tư': 3, 'thu tu': 3, 'thứ 4': 3,
    'thứ năm': 4, 'thu nam': 4, 'thứ 5': 4,
    'thứ sáu': 5, 'thu sau': 5, 'thứ 6': 5,
    'thứ bảy': 6, 'thu bay': 6, 'thứ 7': 6, 'thứ bay': 6,
    'chủ nhật': 0, 'chu nhat': 0, 'cn': 0
};

const TIME_RANGES = {
    'sáng': { start: 9, end: 12 }, 'buổi sáng': { start: 9, end: 12 },
    'chiều': { start: 13, end: 17 }, 'buổi chiều': { start: 13, end: 17 },
    'tối': { start: 18, end: 23 }, 'buổi tối': { start: 18, end: 23 },
    'khuya': { start: 22, end: 2 }
};

function getNextOccurrence(targetDay) {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const result = new Date(today);
    result.setDate(today.getDate() + daysUntil);
    return result.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function getWeekendDates() {
    return [getNextOccurrence(6), getNextOccurrence(0)];
}

function getVnDateOfOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function calculateDatesFromText(text) {
    const lowerText = text.toLowerCase();
    const results = [];
    
    if (lowerText.includes('hôm nay') || lowerText.includes('hom nay')) {
        results.push(getVnDate());
    }
    if (lowerText.includes('mai')) results.push(getVnDateOfOffset(1));
    if (lowerText.includes('mốt')) results.push(getVnDateOfOffset(2));
    
    for (const [dayName, dayNum] of Object.entries(WEEKDAY_MAP)) {
        if (lowerText.includes(dayName)) {
            const date = getNextOccurrence(dayNum);
            if (!results.includes(date)) results.push(date);
        }
    }
    
    if (lowerText.includes('cuối tuần') || lowerText.includes('cuoi tuan')) {
        getWeekendDates().forEach(d => {
            if (!results.includes(d)) results.push(d);
        });
    }
    
    return [...new Set(results)];
}

function calculateTimeRangesFromText(text) {
    const lowerText = text.toLowerCase();
    const results = [];
    for (const [keyword, range] of Object.entries(TIME_RANGES)) {
        if (lowerText.includes(keyword)) {
            const exists = results.find(r => r.start === range.start && r.end === range.end);
            if (!exists) results.push(range);
        }
    }
    return results;
}

function parseShowtimeHour(showTimeStr) {
    const match = showTimeStr.match(/^(\d{1,2})[:h]/i);
    return match ? parseInt(match[1]) : null;
}

function showtimeMatchesRanges(showTimeStr, ranges) {
    if (!ranges || ranges.length === 0) return true;
    const hour = parseShowtimeHour(showTimeStr);
    if (hour === null) return false;
    return ranges.some(range => {
        if (range.end < range.start) return hour >= range.start || hour <= range.end;
        return hour >= range.start && hour <= range.end;
    });
}

/**
 * 2. AI Call Engine
 */
async function callOllama(model, messages, options = {}) {
    const isStream = !!options.onChunk;
    const res = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            model: model, 
            messages, 
            stream: isStream,
            format: options.format || undefined,
            options: { temperature: options.temperature ?? 0.1 }
        }),
        signal: options.signal
    });

    if (!res.ok) throw new Error(`Ollama Error (${model}): ${res.status}`);
    if (!isStream) {
        const data = await res.json();
        return data.message.content;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        fullContent += json.message.content;
                        if (options.onChunk) options.onChunk(fullContent);
                    }
                    if (json.done) break;
                } catch (e) {}
            }
        }
    } finally {
        reader.releaseLock();
    }
    return fullContent;
}

/**
 * 3. Core AI Functions
 */
export const DEFAULT_SYSTEM_PROMPT = `
<IDENTITY> Bạn là CinX, trợ lý ảo thông minh, nhiệt tình và là chuyên gia tư vấn điện ảnh của rạp phim CinX. </IDENTITY>
<RULES>
1. Chỉ tư vấn dựa trên [DỮ LIỆU HỆ THỐNG] thực tế được cung cấp.
2. KHÔNG TỰ BỊA ĐẶT phim hoặc giờ chiếu không có trong bảng.
3. Nếu không có thông phù hợp, hãy xin lỗi và gợi ý khách chọn phim/ngày khác.
4. LUÔN sử dụng icon sinh động (🎬, 🍿, ✨).
5. Khi khách hỏi về giá vé cuối tuần (thứ 7, chủ nhật), hãy báo giá đã nhân với hệ số weekendMultiplier.
6. QUAN TRỌNG: 
   - Khi nhắc đến tên phim, hãy LUÔN hiển thị dưới dạng Markdown hyperlink: [Tên Phim](movie:ID_PHIM).
   - Khi nhắc đến giờ chiếu, hãy LUÔN hiển thị dưới dạng Markdown hyperlink: [Giờ](showtime:ID_SUAT_CHIEU:ID_PHIM).
7. CHIẾN THUẬT TƯ VẤN & BÁN HÀNG: 
   - Tiêu chí "Phim hay": Ưu tiên đề xuất phim có Rating > 70%.
   - Tiêu chí "Hẹn hò/Người yêu": Ưu tiên đề xuất phim có Rating cao kèm theo suất chiếu CÒN GHẾ COUPLE.
   - Khi khách hỏi về nội dung/diễn viên: Tóm tắt ngắn gọn từ "Mô tả" và "Diễn viên".
   - Khi khách hỏi "phim có hay không": Trích dẫn khéo léo từ "Bình luận khách" để tăng độ tin cậy.
   - Luôn nhấn mạnh vào các đặc điểm: "Phim được đánh giá cao (X%)", "Còn ghế VIP trung tâm", hoặc "Còn ghế Couple lãng mạn".
   - Nếu suất chiếu còn ít ghế (< 10), hãy hối thúc: "Chỉ còn vài chỗ, đặt ngay kẻo lỡ!"
   - Luôn mời khách bấm vào [Giờ chiếu] để giữ chỗ.
</RULES>
`;

export async function checkAIStatus() {
    try {
        const response = await fetch("/ai-api/tags", { method: 'GET' });
        return { connected: response.ok, lastCheck: new Date().toISOString() };
    } catch (error) {
        return { connected: false, lastCheck: new Date().toISOString() };
    }
}

async function getEntitiesFromAI(userMessage, modelName, signal) {
    const preCalculatedDates = calculateDatesFromText(userMessage);
    const preCalculatedTimeRanges = calculateTimeRangesFromText(userMessage);
    
    const prompt = `
[ROLE] Phân tích ngôn ngữ cho rạp phim CinX.
[CONTEXT] Hôm nay là: ${getVnDayName()}, ngày ${getVnDate()}.
[TASK] Trích xuất thông tin thành JSON:
{
  "movie_name": "tên phim hoặc null",
  "genres": ["Hành động", "Kinh dị", "Hài", "Hoạt hình", "Tình cảm"], 
  "dates": ["YYYY-MM-DD"],
  "time_ranges": [{"start": 9, "end": 12}, {"start": 13, "end": 17}],
  "action": "view_showtimes" | "view_movies" | "recommend"
}

[DATE RULES]
- "mai" → ${getVnDateOfOffset(1)}
- "thứ 7" → ${getNextOccurrence(6)}
- "chủ nhật" → ${getNextOccurrence(0)}
- "cuối tuần" → [${getWeekendDates().join(', ')}]

User: "${sanitizeForPrompt(userMessage)}"

${preCalculatedDates.length > 0 ? `[GỢI Ý NGÀY]: ${preCalculatedDates.join(', ')}` : ''}
${preCalculatedTimeRanges.length > 0 ? `[GỢI Ý GIỜ]: ${preCalculatedTimeRanges.map(r => `${r.start}h-${r.end}h`).join(', ')}` : ''}

JSON:`;

    try {
        const content = await callOllama(modelName, [{ role: 'user', content: prompt }], { 
            format: 'json', 
            temperature: 0,
            signal 
        });
        
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            // FALLBACK: Nếu AI bọc JSON trong Markdown code blocks (```json ... ```)
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1]);
            } else {
                // Thử tìm cặp ngoặc nhọn đầu tiên và cuối cùng
                const objMatch = content.match(/\{[\s\S]*\}/);
                if (objMatch) {
                    parsed = JSON.parse(objMatch[0]);
                } else {
                    throw parseError;
                }
            }
        }
        
        if (preCalculatedDates.length > 0 && (!parsed.dates || parsed.dates.length === 0)) {
            parsed.dates = preCalculatedDates;
        }
        if (preCalculatedTimeRanges.length > 0 && (!parsed.time_ranges || parsed.time_ranges.length === 0)) {
            parsed.time_ranges = preCalculatedTimeRanges;
        }
        
        parsed.dates = (parsed.dates || []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
        parsed.time_ranges = (parsed.time_ranges || []).filter(r => 
            typeof r.start === 'number' && typeof r.end === 'number'
        );
        
        return parsed;
    } catch (e) {
        console.warn("NLU Extraction failed, using fallback:", e);
        return { 
            movie_name: null, 
            genres: [], 
            dates: preCalculatedDates.length > 0 ? preCalculatedDates : [getVnDate()], 
            time_ranges: preCalculatedTimeRanges,
            action: 'recommend' 
        };
    }
}

/**
 * NEW: Check if dates are weekend (Saturday or Sunday)
 */
function isWeekendDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
}

/**
 * NEW: Check if any date in list is weekend
 */
function hasWeekendInDates(dates) {
    if (!dates || dates.length === 0) return false;
    return dates.some(date => isWeekendDate(date));
}

/**
 * NEW: Format pricing with weekend calculation
 */
function formatPricingWithWeekend(pricingConfig) {
    const p = { ...DEFAULT_PRICING, ...pricingConfig };
    const multiplier = p.weekendMultiplier;
    
    const normalPricing = `- Thường: ${p.basePrice.toLocaleString()}đ, VIP: ${p.vipPrice.toLocaleString()}đ, Đôi: ${p.couplePrice.toLocaleString()}đ.`;
    
    let weekendPricing = '';
    if (multiplier > 1) {
        const weekendBase = Math.round(p.basePrice * multiplier);
        const weekendVip = Math.round(p.vipPrice * multiplier);
        const weekendCouple = Math.round(p.couplePrice * multiplier);
        weekendPricing = `\n- Cuối tuần (T7-CN) x${multiplier}: Thường ${weekendBase.toLocaleString()}đ, VIP ${weekendVip.toLocaleString()}đ, Đôi ${weekendCouple.toLocaleString()}đ.`;
    }
    
    return normalPricing + weekendPricing;
}

/**
 * FIXED: Main response with weekend detection
 */
export async function getCinXResponse(userMessage, context = {}, onChunk = null, signal = null) {
    try {
        const [activeProviderKey, dbPrompt] = await Promise.all([
            configurationAPI.getAIConfig(),
            configurationAPI.getAISystemPrompt()
        ]);
        
        const modelName = OLLAMA_MODELS[activeProviderKey] || OLLAMA_MODELS.llama;
        const activeSystemPrompt = dbPrompt || DEFAULT_SYSTEM_PROMPT;
        const { user, userProfile, rawData } = context;
        const { movies, allShowtimes, seatAvailability, movieComments, pricing, favGenres, pricingConfig } = rawData;

        // 1. NLU Extraction
        const entities = await getEntitiesFromAI(userMessage, modelName, signal);
        
        console.log('[DEBUG] User message:', userMessage);
        console.log('[DEBUG] Extracted entities:', entities);
        console.log('[DEBUG] Pre-calculated dates:', calculateDatesFromText(userMessage));

        // 2. Data Filtering
        let filteredMovies = movies;
        if (entities.movie_name || (entities.genres && entities.genres.length > 0)) {
            const matches = movies.filter(m => {
                const matchName = entities.movie_name && 
                    m.title.toLowerCase().includes(entities.movie_name.toLowerCase());
                const matchGenre = entities.genres.some(g => m.genre?.toLowerCase().includes(g.toLowerCase()));
                return matchName || matchGenre;
            });
            // Nếu tìm thấy phim khớp yêu cầu thì dùng, nếu không thì dùng tất cả phim để AI tự chọn
            if (matches.length > 0) filteredMovies = matches;
        }

        const movieIds = filteredMovies.map(m => m.id);
        let filteredShowtimes = allShowtimes.filter(st => movieIds.includes(st.movie_id));
        
        // 3. Date filtering - Chỉ lọc nếu AI trích xuất được ngày cụ thể từ câu hỏi
        if (entities.dates.length > 0) {
            console.log('[DEBUG] Filtering dates:', entities.dates);
            const dateFiltered = filteredShowtimes.filter(st => entities.dates.includes(st.show_date));
            // Nếu lọc theo ngày mà hết sạch suất chiếu, ta giữ lại danh sách cũ để AI gợi ý ngày khác
            if (dateFiltered.length > 0) filteredShowtimes = dateFiltered;
        }
        
        // 4. Time range filtering - Chỉ lọc nếu AI trích xuất được khung giờ cụ thể
        if (entities.time_ranges && entities.time_ranges.length > 0) {
            console.log('[DEBUG] Filtering time ranges:', entities.time_ranges);
            const timeFiltered = filteredShowtimes.filter(st => showtimeMatchesRanges(st.show_time, entities.time_ranges));
            // Tương tự, nếu lọc giờ mà hết sạch, ta giữ lại để AI tư vấn giờ khác
            if (timeFiltered.length > 0) filteredShowtimes = timeFiltered;
        }

        // 5. NEW: Detect weekend query
        const isWeekendQuery = hasWeekendInDates(entities.dates);
        console.log('[DEBUG] Is weekend query:', isWeekendQuery);

        // 6. Build Context
        let dataContext = "### DANH SÁCH PHIM GỢI Ý (LUÔN dùng [Tên](movie:ID) khi nhắc đến):\n";
        
        // Luôn cung cấp Top 5 phim điểm cao nhất cho AI biết "phim nào hay"
        const topRatedMovies = [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
        topRatedMovies.forEach(m => {
            const comments = movieComments[m.id] || [];
            const commentStr = comments.length > 0 
                ? comments.map(c => `"${c.content}"`).join("; ") 
                : "Chưa có bình luận.";
                
            dataContext += `- [${m.title}](movie:${m.id}) - Thể loại: ${m.genre} - Đánh giá: ${m.rating}%\n`;
            dataContext += `  + Mô tả: ${m.description || 'Chưa có mô tả.'}\n`;
            dataContext += `  + Diễn viên: ${m.actors || 'Nhiều diễn viên.'}\n`;
            dataContext += `  + Bình luận khách: ${commentStr}\n`;
        });

        dataContext += "\n### CHI TIẾT SUẤT CHIẾU & GHẾ ĐẸP (Giờ chiếu là link [Giờ](showtime:ID_SUAT:ID_PHIM)):\n";
        
        const groupedByDate = filteredShowtimes.reduce((acc, st) => {
            if (!acc[st.show_date]) acc[st.show_date] = [];
            acc[st.show_date].push(st);
            return acc;
        }, {});
        
        if (Object.keys(groupedByDate).length > 0) {
            Object.entries(groupedByDate).forEach(([date, showtimes]) => {
                const dayName = new Date(date).toLocaleDateString('vi-VN', { weekday: 'long' });
                const isWeekend = isWeekendDate(date);
                const weekendIcon = isWeekend ? ' 🔥' : '';
                dataContext += `\n📅 ${dayName} (${date})${weekendIcon}:\n`;
                
                showtimes.sort((a, b) => a.show_time.localeCompare(b.show_time));
                
                const renderSlot = (st) => {
                    const m = movies.find(mov => mov.id === st.movie_id);
                    const s = seatAvailability[st.id] || { total: 90, vip: 40, couple: 10, centerVip: 20 };
                    
                    // Xử lý fallback nếu dữ liệu trống
                    const actualTotal = s.total || 90;
                    const actualVip = s.vip || 0;
                    const actualCouple = s.couple || 0;
                    const actualCenter = s.centerVip || 0;

                    let info = `    • [${m?.title}](movie:${m?.id}): [${st.show_time.substring(0,5)}](showtime:${st.id}:${m?.id}) (Trống: ${actualTotal}`;
                    if (actualCenter > 0) info += `, CÓ ${actualCenter} GHẾ VIP TRUNG TÂM! 👑`;
                    if (actualCouple > 0) info += `, CÓ ${actualCouple} GHẾ COUPLE LÃNG MẠN! 💖`;
                    if (actualTotal < 10) info += ` - CHỈ CÒN VÀI GHẾ! 😱`;
                    info += `)\n`;
                    return info;
                };

                const morning = showtimes.filter(st => {
                    const h = parseShowtimeHour(st.show_time);
                    return h >= 9 && h < 12;
                });
                const afternoon = showtimes.filter(st => {
                    const h = parseShowtimeHour(st.show_time);
                    return h >= 12 && h < 18;
                });
                const evening = showtimes.filter(st => {
                    const h = parseShowtimeHour(st.show_time);
                    return h >= 18;
                });
                
                if (morning.length > 0) {
                    dataContext += `  🌅 Sáng:\n`;
                    morning.forEach(st => dataContext += renderSlot(st));
                }
                if (afternoon.length > 0) {
                    dataContext += `  ☀️ Chiều:\n`;
                    afternoon.forEach(st => dataContext += renderSlot(st));
                }
                if (evening.length > 0) {
                    dataContext += `  🌙 Tối:\n`;
                    evening.forEach(st => dataContext += renderSlot(st));
                }
            });
        } else {
            dataContext += "_Không tìm thấy suất chiếu phù hợp với yêu cầu cụ thể của bạn._\n";
        }

        // Bổ sung các ngày có suất chiếu trong tương lai để AI gợi ý
        const availableDates = [...new Set(allShowtimes.map(st => st.show_date))].sort();
        if (availableDates.length > 0) {
            dataContext += `\n📅 Gợi ý các ngày khác có suất chiếu: ${availableDates.slice(0, 5).join(', ')}\n`;
        }

        // 7. NEW: Format pricing with weekend info
        const fullPricing = formatPricingWithWeekend(pricingConfig);
        
        // 8. NEW: Build weekend hint for AI
        const weekendHint = isWeekendQuery 
            ? `\n\n[QUAN TRỌNG]: Người dùng đang hỏi về cuối tuần (thứ 7 hoặc chủ nhật). Hãy báo giá vé CUỐI TUẦN với hệ số x${pricingConfig?.weekendMultiplier || 1.2}.` 
            : '';

        const timeContext = entities.time_ranges && entities.time_ranges.length > 0 
            ? entities.time_ranges.map(r => {
                if (r.start === 9 && r.end === 12) return 'sáng (9h-12h)';
                if (r.start === 13 && r.end === 17) return 'chiều (13h-17h)';
                if (r.start === 18 && r.end === 23) return 'tối (18h-23h)';
                return `${r.start}h-${r.end}h`;
            }).join(', ')
            : 'không xác định';

        // 9. Construct Messages with weekend awareness
        const messages = [
            { role: 'system', content: activeSystemPrompt + weekendHint },
            { 
                role: 'system', 
                content: `[DỮ LIỆU HỆ THỐNG THỰC TẾ]\n${dataContext}\n\n[GIÁ VÉ]\n${fullPricing}\n\n[KHÁCH HÀNG]\nTên: ${userProfile?.name || 'Khách'}. Gu: ${favGenres}.\n\n[PHÂN TÍCH YÊU CẦU]\nNgày: ${entities.dates.length > 0 ? entities.dates.join(', ') : 'không xác định'}\nKhung giờ: ${timeContext}${weekendHint}`
            }
        ];

        if (user?.id) {
            const { data: history } = await aiChatAPI.getChatHistory(user.id, 6);
            if (history) {
                const historyMsgs = [...history].reverse().map(h => ({ role: h.role, content: h.content }));
                messages.push(...historyMsgs);
            }
        }
        messages.push({ role: 'user', content: userMessage });

        // 10. Generate Response
        const finalContent = await callOllama(modelName, messages, { onChunk, signal });

        return { content: finalContent, error: null };
    } catch (error) {
        if (error.name === 'AbortError') return { content: null, error: 'Request cancelled' };
        console.error('CinX Orchestrator Error:', error);
        return { content: null, error: error.message };
    }
}

/**
 * 4. Helper & Support Functions
 */
export async function gatherAIContext(user, userProfile) {
    try {
        const [trendingRes, currentMoviesRes, historyRes, pricingRes] = await Promise.all([
            movieAPI.getTrendingMovies(),
            movieAPI.getCurrentMovies(),
            user ? bookingAPI.getUserBookings(user.id, user.email) : { data: [] },
            configurationAPI.getPricingConfig()
        ]);

        const movies = currentMoviesRes?.data || [];
        const trendingMovies = trendingRes || [];
        const bookingHistory = historyRes?.data || [];
        const { data: allShowtimes } = await showtimeAPI.getMovieShowtimesInBulk(movies.map(m => m.id));
        const showtimeIds = (allShowtimes || []).map(st => st.id);
        
        // Fetch seats and comments in parallel
        const [seatAvailability, commentsRes] = await Promise.all([
            showtimeIds.length > 0 ? showtimeAPI.getDetailedSeatStats(showtimeIds) : {},
            movies.length > 0 ? Promise.all(movies.map(m => commentAPI.getMovieComments(m.id))) : []
        ]);

        // Map comments to movie IDs
        const movieComments = {};
        movies.forEach((m, idx) => {
            movieComments[m.id] = (commentsRes[idx]?.data || []).slice(0, 3); // Lấy 3 bình luận gần nhất
        });

        const p = pricingRes?.data || { ...DEFAULT_PRICING };

        const genreStats = {};
        bookingHistory.forEach(booking => {
            const genres = booking.showtimes?.movies?.genre || "";
            genres.split(',').map(g => g.trim()).filter(g => g).forEach(g => { genreStats[g] = (genreStats[g] || 0) + 1; });
        });
        const favGenres = Object.entries(genreStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(x => x[0]);

        return {
            userProfile,
            rawData: { 
                movies, 
                trendingMovies,
                allShowtimes, 
                seatAvailability, 
                movieComments,
                pricing: formatPricingWithWeekend(p),
                favGenres: favGenres.join(', ') || 'Chưa rõ',
                favGenresList: favGenres,
                pricingConfig: {
                    basePrice: p.basePrice,
                    vipPrice: p.vipPrice,
                    couplePrice: p.couplePrice,
                    weekendMultiplier: p.weekendMultiplier || 1.0
                }
            }
        };
    } catch (err) {
        console.error('AI Context Error:', err);
        return { 
            rawData: { 
                movies: [], 
                trendingMovies: [],
                allShowtimes: [], 
                seatAvailability: {}, 
                pricing: "N/A", 
                favGenres: "N/A",
                favGenresList: [],
                pricingConfig: null
            } 
        };
    }
}

export function getSmartShowtimeCount(movieShowtimes, context) {
    const favHours = context?.preferences?.favoriteHours;
    if (!favHours || favHours.length === 0 || !movieShowtimes) return 0;
    const minH = Math.min(...favHours) - 1;
    const maxH = Math.max(...favHours) + 1;
    return movieShowtimes.filter(st => {
        const h = parseInt(st.show_time.split(':')[0]);
        return h >= minH && h <= maxH;
    }).length;
}

export async function getRecommendationChips(context) {
    const chips = [
        { id: 'all', label: '🎬 Tất cả' }, 
        { id: 'trending', label: '📈 Xu hướng' }, 
        { id: 'top_rated', label: '🏆 Đỉnh cao' }
    ];

    // Thêm chip "Dành cho bạn" nếu user có gu phim (favGenresList không rỗng)
    if (context?.rawData?.favGenresList && context.rawData.favGenresList.length > 0) {
        chips.push({ id: 'for_you', label: '✨ Dành cho bạn' });
    }

    return chips;
}

export function getRecommendedMovies(movies, chipId, chipValue, context) {
    if (!movies) return [];
    
    switch (chipId) {
        case 'all':
            return movies;
            
        case 'trending':
            const trendingTitles = (context?.rawData?.trendingMovies || [])
                .map(t => t.title?.toLowerCase().trim());

            const trending = movies
                .filter(m => trendingTitles.includes(m.title?.toLowerCase().trim()))
                .sort((a, b) => {
                    const indexA = trendingTitles.indexOf(a.title?.toLowerCase().trim());
                    const indexB = trendingTitles.indexOf(b.title?.toLowerCase().trim());
                    return indexA - indexB;
                })
                .slice(0, 3);

            // Fallback: nếu không có trending, trả về phim có nhiều booking nhất từ history
            if (trending.length === 0 && context?.rawData?.bookingHistory) {
                // Tính toán từ history...
            }

            return trending.length > 0 ? trending : movies.slice(0, 3);
            
        case 'top_rated':
            // Lọc các phim có điểm số (rating) lớn hơn 80%
            //return movies.filter(m => (m.rating || 0) > 80);
            return movies
                .filter(m => (m.rating || 0) > 80)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Thêm sort
            
        case 'for_you':
            const favGenres = context?.rawData?.favGenresList || [];
            if (favGenres.length === 0) return movies;

            return movies
                .map(m => {
                    const movieGenres = m.genre?.split(',').map(g => g.trim()) || [];
                    const matchCount = favGenres.filter(fg => movieGenres.includes(fg)).length;
                    return { ...m, matchScore: matchCount }; // Thêm điểm phù hợp
                })
                .filter(m => m.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore) // Sort theo độ phù hợp
                .map(({ matchScore, ...m }) => m); // Remove temp field
            
        default:
            return movies;
    }
}

// ... generateNewsFromURL, generateNewsFromText, generatePromotionFromPrompt giữ nguyên ...

// ai.js - SỬA LẠI generateNewsFromText

export async function generateNewsFromText(prompt, signal = null) {
  // prompt ở đây là chủ đề/topic, không phải article content
  // Ví dụ: "viết review deadpool 3", "tin tức phim mới tháng 3"
  
  if (!prompt || prompt.trim().length < 5) {
    return {
      error: 'Prompt quá ngắn. Vui lòng nhập chi tiết hơn (ví dụ: "viết review phim Deadpool 3")',
      title: null,
      summary: null,
      content: null
    };
  }

  try {
    const [activeProviderKey, dbPrompt] = await Promise.all([
      configurationAPI.getAIConfig(),
      configurationAPI.getAISystemPrompt()
    ]);
    
    const modelName = OLLAMA_MODELS[activeProviderKey] || OLLAMA_MODELS.llama;
    
    const aiPrompt = `[ROLE] Biên tập viên chuyên nghiệp của Rạp phim CinX - Chuyên gia điện ảnh
[NHIỆM VỤ] Viết một bài tin tức/review HOÀN TOÀN MỚI dựa trên yêu cầu sau.

[YÊU CẦU CỦA BIÊN TẬP VIÊN]: "${sanitizeForPrompt(prompt)}"

[QUY TẮC VIẾT]
1. Viết như một bài báo thực thụ, có giá trị đọc
2. Nếu là review: đánh giá cụ thể diễn xuất, kịch bản, hình ảnh, âm thanh
3. Nếu là tin tức: thông tin chính xác, có nguồn (có thể ghi "Theo các nguồn tin...")
4. Giọng văn thân thiện, hấp dẫn, dùng emoji 🎬🍿 phù hợp
5. Độ dài: 300-500 từ cho content
6. KHÔNG đề cập là "theo yêu cầu" hay "bài viết được tạo"

[OUTPUT FORMAT - JSON]
{
  "title": "Tiêu đề hấp dẫn, có emoji, max 80 ký tự",
  "summary": "Tóm tắt 2-3 câu thu hút, max 150 ký tự",
  "content": "Nội dung chi tiết 300-500 từ, chia đoạn rõ ràng"
}

JSON:`;

    const aiContent = await callOllama(modelName, [{ role: 'user', content: aiPrompt }], { 
      format: 'json', 
      temperature: 0.7, // Cao hơn để creative
      signal 
    });
    
    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (parseError) {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        const objMatch = aiContent.match(/\{[\s\S]*"title"[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error('AI response không đúng định dạng');
        }
      }
    }
    
    return {
      title: (parsed.title || 'Tin tức điện ảnh').substring(0, 100),
      summary: (parsed.summary || '').substring(0, 250),
      content: parsed.content || '',
      error: null
    };
    
  } catch (error) {
    console.error('generateNewsFromText Error:', error);
    return {
      error: error.name === 'AbortError' ? 'Đã hủy yêu cầu' : `Lỗi: ${error.message}`,
      title: null,
      summary: null,
      content: null
    };
  }
}

export async function generateNewsFromURL(sourceUrl, signal = null) {
  // Validate URL
  try {
    new URL(sourceUrl);
  } catch (e) {
    return { 
      error: 'URL không hợp lệ',
      title: null, summary: null, content: null 
    };
  }

  try {
    // Fetch with Jina
    const jinaUrl = `https://r.jina.ai/http://${sourceUrl.replace(/^https?:\/\//, '')}`;
    const jinaRes = await fetch(jinaUrl, { signal });

    if (!jinaRes.ok) {
      throw new Error(`Jina failed: ${jinaRes.status}`);
    }

    const articleText = await jinaRes.text();
    
    if (!articleText || articleText.trim().length < 50) {
      throw new Error('Không thể trích xuất nội dung từ URL');
    }

    // Use the text generation function
    return generateNewsFromText(articleText, sourceUrl, signal);
    
  } catch (error) {
    console.error('generateNewsFromURL Error:', error);
    return {
      error: error.name === 'AbortError' 
        ? 'Đã hủy yêu cầu' 
        : (error.message || 'Không thể xử lý URL'),
      title: null, summary: null, content: null
    };
  }
}

/**
 * NEW: Generate promotion from prompt (zero-shot)
 * Không cần URL, AI tự viết từ mô tả
 */
export async function generatePromotionFromPrompt(prompt, signal = null) {
  if (!prompt || prompt.trim().length < 5) {
    return {
      error: 'Mô tả quá ngắn. Vui lòng nhập chi tiết hơn (vd: "khuyến mãi 20% vé cuối tuần cho sinh viên")',
      title: null,
      description: null
    };
  }

  try {
    const [activeProviderKey, dbPrompt] = await Promise.all([
      configurationAPI.getAIConfig(),
      configurationAPI.getAISystemPrompt()
    ]);
    
    const modelName = OLLAMA_MODELS[activeProviderKey] || OLLAMA_MODELS.llama;
    
    const aiPrompt = `[ROLE] Trưởng phòng Marketing của Rạp phim CinX - Chuyên gia sáng tạo chiến dịch khuyến mãi
[NHIỆM VỤ] Tạo một chương trình khuyến mãi hấp dẫn dựa trên yêu cầu sau.

[YÊU CẦU]: "${sanitizeForPrompt(prompt)}"

[QUY TẮC VIẾT KHUYẾN MÃI]
1. Title: Ngắn gọn, catchy, có emoji 🎟️🍿💥, max 60 ký tự
2. Description: 
   - Mở đầu thu hút (1 câu hook)
   - Chi tiết ưu đãi (giảm bao nhiêu %, áp dụng khi nào)
   - Điều kiện áp dụng (nếu có)
   - Call-to-action mạnh mẽ
   - Độ dài: 100-200 từ
3. Giọng văn: Hào hứng, thôi thúc, tạo FOMO
4. KHÔNG dùng từ "theo yêu cầu" hay "chương trình được tạo"

[OUTPUT FORMAT - JSON]
{
  "title": "🎟️ Giảm 20% vé cuối tuần cho sinh viên!",
  "description": "🔥 Chỉ cuối tuần này! Flash sale giảm 20% tất cả các suất chiếu từ thứ 6 đến chủ nhật..."
}

JSON:`;

    const aiContent = await callOllama(modelName, [{ role: 'user', content: aiPrompt }], { 
      format: 'json', 
      temperature: 0.8, // Cao để creative, marketing cần bắt trend
      signal 
    });
    
    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (parseError) {
      // Try extract from markdown
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        const objMatch = aiContent.match(/\{[\s\S]*"title"[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error('AI response không đúng định dạng');
        }
      }
    }
    
    return {
      title: (parsed.title || 'Khuyến mãi đặc biệt').substring(0, 80),
      description: parsed.description || '',
      error: null
    };
    
  } catch (error) {
    console.error('generatePromotionFromPrompt Error:', error);
    return {
      error: error.name === 'AbortError' ? 'Đã hủy yêu cầu' : `Lỗi: ${error.message}`,
      title: null,
      description: null
    };
  }
}

export async function checkAIProvider() {
    return await configurationAPI.getAIConfig();
}
