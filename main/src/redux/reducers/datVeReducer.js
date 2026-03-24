const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const initialState = {
    danhSachGhe: rows.map(row => ({
        "hang": row,
        "danhSachGhe": Array.from({length: (row === 'H' ? 6 : 12)}, (_, i) => ({
            "soGhe": `${row}${i + 1}`,
            "gia": 0 
        }))
    })),
    gheDangChon: [],
    nguoiDatVe: { hoTen: "", soLuong: 0 },
    tongTien: 0,
    isSubmitting: false,
    isLoadingSeats: false,
    seatsError: null,
    bookingInProgress: false,
    pendingBookingId: null,
}

export const datVeReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_BOOKING_PROGRESS':
            return {
                ...state,
                bookingInProgress: action.inProgress,
                pendingBookingId: action.bookingId || state.pendingBookingId
            };
        case 'LOAD_SEATS':
            const seatsData = action.seats || [];
            const rowsMap = {};
            
            seatsData.forEach(seat => {
                const rowLetter = seat.rowLetter || seat.row_letter || seat.soGhe?.charAt(0) || seat.seat_number?.charAt(0);
                if (!rowLetter) return;
                
                if (!rowsMap[rowLetter]) rowsMap[rowLetter] = [];
                
                // FORCE NUMBER CONVERSION
                const seatPrice = Number(seat.gia) || Number(seat.price) || Number(seat.base_price) || 0;
                
                rowsMap[rowLetter].push({
                    soGhe: seat.soGhe || seat.seat_number,
                    gia: seatPrice,
                    daDat: seat.daDat || seat.status === 'booked',
                    loaiGhe: seat.loaiGhe || seat.seat_type,
                    seat_id: seat.seat_id || seat.id
                });
            });
            
            const sortedRows = Object.keys(rowsMap).sort().map(rowLetter => ({
                "hang": rowLetter,
                "danhSachGhe": rowsMap[rowLetter].sort((a, b) => {
                    const numA = parseInt(a.soGhe.replace(/^\D+/g, ''));
                    const numB = parseInt(b.soGhe.replace(/^\D+/g, ''));
                    return numA - numB;
                })
            }));
            
            return { 
                ...state, 
                danhSachGhe: sortedRows.length > 0 ? sortedRows : state.danhSachGhe,
                isLoadingSeats: false 
            };

        case "CHON_GHE":
            const indexGhe = state.gheDangChon.findIndex(g => g.soGhe === action.gheChon.soGhe);
            let newGheDangChon = [...state.gheDangChon];
            let newTongTien = state.tongTien;
            
            // Ensure action.gheChon.gia is a number
            const currentGia = Number(action.gheChon.gia) || 0;

            if (indexGhe === -1) {
                newGheDangChon.push(action.gheChon);
                newTongTien += currentGia;
            } else {
                newGheDangChon.splice(indexGhe, 1);
                newTongTien -= currentGia;
            }

            return { 
                ...state, 
                gheDangChon: newGheDangChon,
                tongTien: Math.max(0, newTongTien), // Prevent negative prices
                nguoiDatVe: { ...state.nguoiDatVe, soLuong: newGheDangChon.length }
            }

        case "XAC_NHAN":
            return { ...state, gheDangChon: [], tongTien: 0, isSubmitting: false }

        case "RESET_SEATS":
            return { ...state, danhSachGhe: initialState.danhSachGhe, gheDangChon: [], tongTien: 0 }

        default:
            return state
    }
};
