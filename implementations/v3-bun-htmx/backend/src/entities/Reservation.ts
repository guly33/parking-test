export interface Reservation {
    id: number;
    spot_id: number;
    user_id: number;
    start_time: Date;
    end_time: Date;
    status: 'active' | 'completed' | 'cancelled';
    created_at: Date;
}
