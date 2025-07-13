from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from functools import wraps
from db import get_db

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'user_id' not in session or not session.get('is_admin'):
            flash('You need to be an admin to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrap

def get_existing_data(table_name):
    db = get_db()
    cur = db.cursor()
    cur.execute(f'SELECT * FROM {table_name}')
    data = cur.fetchall()
    cur.close()
    return data

@admin_bp.route('/manage_players', methods=['GET', 'POST'])
@admin_required
def manage_players():
    db = get_db()
    cur = db.cursor()

    if request.method == 'POST':
        try:
            player_id = request.form.get('player_id')
            name = request.form['name']
            user_id = request.form['user_id']

            if 'submit' in request.form:
                if player_id:
                    cur.execute('UPDATE players SET name = %s, user_id = %s WHERE id = %s', 
                                (name, user_id, player_id))
                    flash('Player updated successfully', 'success')
                else:
                    cur.execute('INSERT INTO players (name, user_id) VALUES (%s, %s)', 
                                (name, user_id))
                    flash('Player added successfully', 'success')
            elif 'delete' in request.form:
                player_id = request.form['deleteEntityId']
                cur.execute('DELETE FROM players WHERE id = %s', (player_id,))
                flash('Player deleted successfully', 'success')
            db.commit()
        except Exception as e:
            db.rollback()
            flash('An error occurred: ' + str(e), 'error')
        finally:
            cur.close()
        return redirect(url_for('admin.manage_players'))

    cur.execute('SELECT id, name, user_id FROM players')
    players = cur.fetchall()
    cur.execute('SELECT id, username FROM users WHERE role = %s', ('player',))
    users = cur.fetchall()
    cur.close()
    return render_template('manage_players.html', players=players, users=users)

@admin_bp.route('/admin/matches/<int:match_id>/reset', methods=['POST'])
@admin_required
def reset_match(match_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE matches
            SET score_player1 = NULL,
                score_player2 = NULL,
                is_completed = FALSE
            WHERE id = %s
        """, (match_id,))
        conn.commit()
        flash("Match has been reset.", "success")
    except Exception as e:
        conn.rollback()
        flash("Error resetting match: " + str(e), "danger")
    finally:
        cur.close()
        conn.close()
    return redirect(url_for('matches'))