from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from functools import wraps
from db import get_db
from db import get_db_connection 
from auth_utils import admin_required
import csv
from io import TextIOWrapper

admin_bp = Blueprint('admin', __name__)

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
    return redirect(url_for('player.matches'))

@admin_bp.route('/matches/new', methods=['GET', 'POST'])
@admin_required
def new_match():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM players")
    players = cur.fetchall()

    if request.method == 'POST':
        player1_id = request.form['player1_id']
        player2_id = request.form['player2_id']
        week_commencing = request.form['week_commencing']

        # Optional: Validate date format
        from datetime import datetime
        try:
            datetime.strptime(week_commencing, "%Y-%m-%d")
        except ValueError:
            flash("Invalid date format for week commencing.", "danger")
            return redirect(url_for('admin.new_match'))

        cur.execute(
            "INSERT INTO matches (player1_id, player2_id, week_commencing) VALUES (%s, %s, %s)",
            (player1_id, player2_id, week_commencing)
        )
        conn.commit()
        flash("Match created for week commencing " + week_commencing, "success")
        return redirect(url_for('player.matches'))

    cur.close()
    conn.close()
    return render_template('new_match.html', players=players)



@admin_bp.route('/admin/reset_password/<int:user_id>', methods=['GET', 'POST'])
@admin_required
def reset_password(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()

    if not user:
        flash("User not found.", "danger")
        return redirect(url_for('admin.manage_players'))

    username = user[0]

    if request.method == 'POST':
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
        else:
            cur.execute("UPDATE users SET password = %s WHERE id = %s", (password, user_id))
            conn.commit()
            flash(f"Password for {username} has been reset.", "success")
            return redirect(url_for('admin.manage_players'))

    cur.close()
    conn.close()
    return render_template('reset_password.html', username=username, user_id=user_id)

@admin_bp.route('/matches/upload', methods=['GET', 'POST'])
@admin_required
def upload_matches():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        file = request.files.get('csv_file')
        if not file or not file.filename.endswith('.csv'):
            flash('Please upload a valid CSV file.', 'danger')
            return redirect(url_for('admin.upload_matches'))

        try:
            reader = csv.DictReader(TextIOWrapper(file, encoding='utf-8'))
            for row in reader:
                player1_name = row['player1'].strip()
                player2_name = row['player2'].strip()
                scheduled_at = row['scheduled_at'].strip()

                cur.execute("SELECT id FROM players WHERE name = %s", (player1_name,))
                player1 = cur.fetchone()

                cur.execute("SELECT id FROM players WHERE name = %s", (player2_name,))
                player2 = cur.fetchone()

                if not player1 or not player2:
                    flash(f"Player not found: {player1_name if not player1 else player2_name}", 'danger')
                    continue

                cur.execute(
                    "INSERT INTO matches (player1_id, player2_id, scheduled_at) VALUES (%s, %s, %s)",
                    (player1[0], player2[0], scheduled_at)
                )
            conn.commit()
            flash('Matches uploaded successfully.', 'success')
        except Exception as e:
            conn.rollback()
            flash(f'Error uploading CSV: {str(e)}', 'danger')

        finally:
            cur.close()
            conn.close()
        return redirect(url_for('admin.upload_matches'))

    cur.close()
    conn.close()
    return render_template('upload_matches.html')