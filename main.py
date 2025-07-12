from flask import Flask, render_template, request, redirect, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import psycopg2
import os

app = Flask(__name__)
app.secret_key = "super-secret"

def get_db():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "sports_league"),
        user=os.getenv("POSTGRES_USER", "sports_league_owner"),
        password=os.getenv("POSTGRES_PASSWORD", "sports_league_password"),
        host="db"
    )

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            flash("You must be logged in.", "error")
            return redirect('/login')
        return f(*args, **kwargs)
    return wrapper

@app.route('/')
def home():
    return redirect('/dashboard')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        role = request.form.get('role', 'player')

        db = get_db()
        cur = db.cursor()
        cur.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
            (username, password, role)
        )
        db.commit()
        cur.close()

        flash("Registration successful. Please login.", "success")
        return redirect('/login')

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT id, password_hash, role FROM users WHERE username = %s", (request.form['username'],))
        user = cur.fetchone()
        cur.close()

        if user and check_password_hash(user[1], request.form['password']):
            session['user_id'] = user[0]
            session['role'] = user[2]
            return redirect('/dashboard')

        flash("Invalid login credentials", "error")
        return redirect('/login')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("Logged out successfully", "success")
    return redirect('/login')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/create_profile', methods=['GET', 'POST'])
@login_required
def create_profile():
    if request.method == 'POST':
        name = request.form['name']
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO players (user_id, name) VALUES (%s, %s)", (session['user_id'], name))
        db.commit()
        cur.close()
        return redirect('/dashboard')
    return render_template('create_profile.html')

@app.route('/matches/new', methods=['GET', 'POST'])
@login_required
def new_match():
    db = get_db()
    cur = db.cursor()

    if request.method == 'POST':
        p1 = request.form['player1_id']
        p2 = request.form['player2_id']
        date = request.form['scheduled_at']

        cur.execute(
            "INSERT INTO matches (player1_id, player2_id, scheduled_at) VALUES (%s, %s, %s)",
            (p1, p2, date)
        )
        db.commit()
        return redirect('/matches')

    cur.execute("SELECT id, name FROM players")
    players = cur.fetchall()
    cur.close()

    return render_template('new_match.html', players=players)

@app.route('/matches')
@login_required
def matches():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT m.id, p1.name, p2.name, m.scheduled_at,
               m.score_player1, m.score_player2, m.is_completed,
               p1.user_id, p2.user_id
        FROM matches m
        JOIN players p1 ON m.player1_id = p1.id
        JOIN players p2 ON m.player2_id = p2.id
    """)
    raw_matches = cur.fetchall()
    cur.close()

    matches = []
    for m in raw_matches:
        matches.append({
            'id': m[0],
            'player1': m[1],
            'player2': m[2],
            'scheduled_at': m[3],
            'score1': m[4],
            'score2': m[5],
            'is_completed': m[6],
            'can_edit': session['role'] == 'admin' or session['user_id'] in (m[7], m[8])
        })

    return render_template('matches.html', matches=matches)

@app.route('/matches/<int:match_id>/score', methods=['GET', 'POST'])
@login_required
def score_match(match_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT m.id, m.player1_id, m.player2_id, m.scheduled_at,
               m.score_player1, m.score_player2, m.is_completed,
               p1.name, p2.name, p1.user_id, p2.user_id
        FROM matches m
        JOIN players p1 ON m.player1_id = p1.id
        JOIN players p2 ON m.player2_id = p2.id
        WHERE m.id = %s
    """, (match_id,))
    m = cur.fetchone()
    cur.close()

    if not m:
        return "Match not found", 404

    if session['role'] != 'admin' and session['user_id'] not in (m[9], m[10]):
        return "Unauthorized", 403

    match = {
        'id': m[0],
        'player1': m[7],
        'player2': m[8],
        'scheduled_at': m[3],
        'score1': m[4],
        'score2': m[5],
        'is_completed': m[6]
    }

    if request.method == 'POST':
        score1 = request.form['score1']
        score2 = request.form['score2']

        db = get_db()
        cur = db.cursor()
        cur.execute(
            "UPDATE matches SET score_player1 = %s, score_player2 = %s, is_completed = TRUE WHERE id = %s",
            (score1, score2, match_id)
        )
        db.commit()
        cur.close()

        return redirect('/matches')

    return render_template('enter_score.html', match=match)

@app.route('/leaderboard')
@login_required
def leaderboard():
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT p.name,
               COUNT(m.id) as games_played,
               SUM(
                   CASE
                       WHEN (m.player1_id = p.id AND m.score_player1 > m.score_player2)
                         OR (m.player2_id = p.id AND m.score_player2 > m.score_player1)
                       THEN 1 ELSE 0
                   END
               ) as wins
        FROM players p
        LEFT JOIN matches m ON p.id IN (m.player1_id, m.player2_id)
        GROUP BY p.name
        ORDER BY wins DESC NULLS LAST
    """)
    rows = cur.fetchall()
    cur.close()
    return render_template('leaderboard.html', rows=rows)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
