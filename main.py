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

def is_admin():
    return session.get("role") == "admin"

def login_required(view):
    def wrapped_view(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return view(*args, **kwargs)
    wrapped_view.__name__ = view.__name__
    return wrapped_view

def admin_required(view):
    def wrapped_view(*args, **kwargs):
        if not is_admin():
            flash("Admin access required.", "danger")
            return redirect(url_for("dashboard"))
        return view(*args, **kwargs)
    wrapped_view.__name__ = view.__name__
    return wrapped_view

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
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid credentials', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
