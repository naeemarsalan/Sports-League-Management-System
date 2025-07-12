from flask import Flask, render_template, request, redirect, session, url_for, flash
import psycopg2
import os

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev')
DATABASE_URL = os.environ.get("DATABASE_URL")


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


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
        role = 'player'  # Self-registration always assigns 'player'

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            flash("Username already exists.", "danger")
        else:
            cur.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, password, role)
            )
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


@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')


@app.route('/matches')
@login_required
def matches():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT m.id, p1.name, p2.name, m.date, m.score1, m.score2
        FROM matches m
        JOIN players p1 ON m.player1_id = p1.id
        JOIN players p2 ON m.player2_id = p2.id
        ORDER BY m.date DESC
    """)
    matches = cur.fetchall()
    cur.close()
    conn.close()
    return render_template('matches.html', matches=matches)


@app.route('/matches/new', methods=['GET', 'POST'])
@login_required
def new_match():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM players")
    players = cur.fetchall()

    if request.method == 'POST':
        player1_id = request.form['player1']
        player2_id = request.form['player2']
        date = request.form['date']

        cur.execute("INSERT INTO matches (player1_id, player2_id, date) VALUES (%s, %s, %s)",
                    (player1_id, player2_id, date))
        conn.commit()
        flash("Match scheduled!", "success")
        return redirect(url_for('matches'))

    cur.close()
    conn.close()
    return render_template('new_match.html', players=players)


@app.route('/matches/<int:match_id>/score', methods=['GET', 'POST'])
@login_required
def enter_score(match_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM matches WHERE id = %s", (match_id,))
    match = cur.fetchone()

    if not match:
        flash("Match not found.", "danger")
        return redirect(url_for('matches'))

    user_id = session.get('user_id')
    cur.execute("SELECT id FROM players WHERE user_id = %s", (user_id,))
    player = cur.fetchone()

    if not player or player[0] not in (match[1], match[2]):
        flash("You can only score matches you're involved in.", "danger")
        return redirect(url_for('matches'))

    if request.method == 'POST':
        score1 = request.form['score1']
        score2 = request.form['score2']
        cur.execute("UPDATE matches SET score1 = %s, score2 = %s WHERE id = %s",
                    (score1, score2, match_id))
        conn.commit()
        flash("Score submitted!", "success")
        return redirect(url_for('matches'))

    cur.close()
    conn.close()
    return render_template('enter_score.html', match=match)


@app.route('/leaderboard')
@login_required
def leaderboard():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.name,
               SUM(CASE WHEN (p.id = m.player1_id AND m.score1 > m.score2) OR 
                            (p.id = m.player2_id AND m.score2 > m.score1) THEN 1 ELSE 0 END) AS wins,
               COUNT(m.id) AS games_played
        FROM players p
        LEFT JOIN matches m ON p.id IN (m.player1_id, m.player2_id)
        GROUP BY p.id
        ORDER BY wins DESC
    """)
    leaderboard = cur.fetchall()
    cur.close()
    conn.close()
    return render_template('leaderboard.html', leaderboard=leaderboard)


@app.route('/profile/create', methods=['GET', 'POST'])
@login_required
def create_profile():
    user_id = session.get('user_id')

    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        name = request.form['name']
        cur.execute("INSERT INTO players (name, user_id) VALUES (%s, %s)", (name, user_id))
        conn.commit()
        flash("Profile created!", "success")
        return redirect(url_for('dashboard'))

    cur.close()
    conn.close()
    return render_template('create_profile.html')


if __name__ == '__main__':
    app.run(debug=True)
