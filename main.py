from flask import Flask, render_template, request, redirect, session, url_for, flash
from db import get_db_connection
import os
from admin_routes import admin_bp
from player_routes import player_bp

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev')
DATABASE_URL = os.environ.get("DATABASE_URL")

app.register_blueprint(admin_bp)
app.register_blueprint(player_bp)


@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = 'player'
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            flash("Username already exists.", "danger")
        else:
            cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", (username, password, role))
            conn.commit()
            flash("Registration successful!", "success")
            return redirect(url_for('login'))
        cur.close()
        conn.close()
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            # Fetch and store player's ID if they're a player
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM players WHERE user_id = %s", (user[0],))
            player = cur.fetchone()
            if player:
                session['player_id'] = player[0]
            cur.close()
            conn.close()
            return redirect(url_for('player.dashboard'))
        else:
            flash('Invalid credentials', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
