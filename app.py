from flask import Flask, render_template, request, session, jsonify
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "tyukghjouygdtyryfgyhkutgdtrghgfutrfgfu6ythgfuyrfuuyfv65ytgvf"

DB_NAME = "database.db"

# --------------------------- 🗄 БД ---------------------------
def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    c = db.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        name TEXT,
        avatar TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        rating INTEGER,
        text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    db.commit()
init_db()

# --------------------------- 🌍 Страницы ---------------------------
@app.route("/")
def reviews_page():
    return render_template("reviews.html")

# --------------------------- 🔐 Telegram Auth ---------------------------
@app.route("/api/auth/telegram", methods=["POST"])
def telegram_auth():
    data = request.form.to_dict()  # Telegram присылает POST form-data
    telegram_id = data.get("id")
    if not telegram_id:
        return jsonify({"error": "Telegram auth failed"}), 400

    db = get_db()
    c = db.cursor()
    c.execute("SELECT id FROM users WHERE telegram_id=?", (telegram_id,))
    row = c.fetchone()

    if not row:
        c.execute("""
        INSERT INTO users (telegram_id, username, name, avatar)
        VALUES (?, ?, ?, ?)
        """, (
            telegram_id,
            data.get("username"),
            data.get("first_name"),
            data.get("photo_url")
        ))
        db.commit()
        user_id = c.lastrowid
    else:
        user_id = row["id"]

    session["user_id"] = user_id
    return jsonify({"status": "ok"})

# --------------------------- ⭐ API отзывов ---------------------------
@app.route("/api/reviews")
def api_reviews():
    db = get_db()
    c = db.cursor()
    c.execute("""
    SELECT r.rating, r.text, r.created_at,
           u.username, u.name, u.avatar
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
    """)
    rows = c.fetchall()
    return jsonify([
        {
            "rating": r["rating"],
            "text": r["text"],
            "time": r["created_at"],
            "username": r["username"],
            "name": r["name"],
            "avatar": r["avatar"]
        } for r in rows
    ])

@app.route("/api/review", methods=["POST"])
def add_review():
    if "user_id" not in session:
        return jsonify({"error": "auth required"}), 403

    data = request.get_json()
    rating = data.get("rating")
    text = data.get("text", "").strip()
    if not text or not rating:
        return jsonify({"error": "invalid data"}), 400

    db = get_db()
    c = db.cursor()
    c.execute("SELECT id FROM reviews WHERE user_id=?", (session["user_id"],))
    if c.fetchone():
        return jsonify({"error": "already exists"}), 400

    c.execute("""
    INSERT INTO reviews (user_id, rating, text)
    VALUES (?, ?, ?)
    """, (session["user_id"], rating, text))
    db.commit()
    return jsonify({"status": "ok"})

# --------------------------- ⭐ Ошибки ---------------------------
@app.errorhandler(404)
def page_not_found(e):
    return "Page not found", 404

@app.errorhandler(500)
def internal_error(e):
    return "Internal server error", 500

# --------------------------- 🚀 Запуск ---------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)