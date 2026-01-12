from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import json
import os
import sqlite3

app = Flask(__name__)
app.secret_key = "tyukghjouygdtyryfgyhkutgdtrghgfutrfgfu6ythgfuyrfuuyfv65ytgvf"

DB_NAME = "database.db"

# --------------------------- 🗄 БД ---------------------------
def get_db():
    return sqlite3.connect(DB_NAME, check_same_thread=False)

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

# --------------------------- ⭐ Страницы ---------------------------
@app.route("/")
def index():
    return "<h1>Mensem Fun Test</h1><a href='/reviews/'>Отзывы</a>"

@app.route("/reviews/")
def reviews():
    return render_template("reviews.html")

# --------------------------- 🔐 Telegram Auth ---------------------------
@app.route("/api/auth/telegram", methods=["POST"])
def telegram_auth():
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute("SELECT id FROM users WHERE telegram_id=?", (data["id"],))
    row = c.fetchone()
    if not row:
        c.execute("""
        INSERT INTO users (telegram_id, username, name, avatar)
        VALUES (?, ?, ?, ?)
        """, (
            data["id"],
            data.get("username"),
            data.get("first_name"),
            data.get("photo_url")
        ))
        db.commit()
        user_id = c.lastrowid
    else:
        user_id = row[0]
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
            "rating": r[0],
            "text": r[1],
            "time": r[2],
            "username": r[3],
            "name": r[4],
            "avatar": r[5]
        } for r in rows
    ])

@app.route("/api/review", methods=["POST"])
def add_review():
    if "user_id" not in session:
        return {"error": "auth required"}, 403
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute("SELECT id FROM reviews WHERE user_id=?", (session["user_id"],))
    if c.fetchone():
        return {"error": "already exists"}, 400
    c.execute("""
    INSERT INTO reviews (user_id, rating, text)
    VALUES (?, ?, ?)
    """, (session["user_id"], data["rating"], data["text"]))
    db.commit()
    return {"status": "ok"}

# --------------------------- ⭐ Ошибки ---------------------------
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

# --------------------------- 🚀 Запуск ---------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

