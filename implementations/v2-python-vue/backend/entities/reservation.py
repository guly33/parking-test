from sqlalchemy import text

class Reservation:
    def __init__(self, conn):
        self.conn = conn

    def get_active_in_range(self, start_time, end_time):
        query = text("""
            SELECT * FROM reservations 
            WHERE status = 'active' 
            AND (start_time < :end AND end_time > :start)
        """)
        result = self.conn.execute(query, {"start": start_time, "end": end_time}).mappings().all()
        return [dict(r) for r in result]

    def lock_spot(self, spot_id: int):
        query = text("SELECT id FROM spots WHERE id = :id FOR UPDATE")
        return self.conn.execute(query, {"id": spot_id}).fetchone()

    def count_overlaps(self, spot_id, start_time, end_time):
        query = text("""
            SELECT count(*) FROM reservations 
            WHERE spot_id = :sid 
            AND status = 'active'
            AND (start_time < :end AND end_time > :start)
        """)
        return self.conn.execute(query, {"sid": spot_id, "start": start_time, "end": end_time}).scalar()

    def create(self, spot_id, user_id, start_time, end_time):
        query = text("""
            INSERT INTO reservations (spot_id, user_id, start_time, end_time, status)
            VALUES (:sid, :uid, :start, :end, 'active')
        """)
        self.conn.execute(query, {"sid": spot_id, "uid": user_id, "start": start_time, "end": end_time})

    def find_by_id(self, reservation_id):
        query = text("SELECT * FROM reservations WHERE id = :id")
        result = self.conn.execute(query, {"id": reservation_id}).mappings().fetchone()
        return dict(result) if result else None
    
    def complete(self, reservation_id):
        query = text("UPDATE reservations SET status = 'completed' WHERE id = :id")
        self.conn.execute(query, {"id": reservation_id})

    def get_hour_stats(self):
        query = text("""
            SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count 
            FROM reservations 
            GROUP BY hour 
            ORDER BY count DESC
        """)
        result = self.conn.execute(query).mappings().all()
        return [dict(r) for r in result]
