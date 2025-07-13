from flask import session, redirect, url_for, flash

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
            return redirect(url_for("player.dashboard"))
        return view(*args, **kwargs)
    wrapped_view.__name__ = view.__name__
    return wrapped_view
