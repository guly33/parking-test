from sqlalchemy import text

class User:
    def __init__(self, conn):
        self.conn = conn

    def find_by_username(self, username: str):
        query = text("SELECT id, password_hash FROM users WHERE username = :u")
        result = self.conn.execute(query, {"u": username}).fetchone()
        if result:
            return result
        return None
