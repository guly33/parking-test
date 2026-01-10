from sqlalchemy import text

class Spot:
    def __init__(self, conn):
        self.conn = conn

    def get_all(self):
        result = self.conn.execute(text("SELECT * FROM spots ORDER BY id ASC")).mappings().all()
        return [dict(r) for r in result]
