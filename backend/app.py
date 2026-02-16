from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from math import ceil

DB = 'cars.db'
app = Flask(__name__)
CORS(app)

def get_conn():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/search')
def search():
    q = request.args.get('q', '').strip()
    brand = request.args.get('brand', '').strip()
    min_year = request.args.get('min_year')
    max_year = request.args.get('max_year')
    try:
        page = int(request.args.get('page', 1))
    except ValueError:
        page = 1
    try:
        page_size = int(request.args.get('page_size', 20))
    except ValueError:
        page_size = 20

    params = []
    where = []
    if q:
        like = f'%{q}%'
        where.append('(make LIKE ? OR model LIKE ? OR title LIKE ? OR description LIKE ?)')
        params += [like] * 4
    if brand:
        where.append('make = ?')
        params.append(brand)
    if min_year:
        where.append('year >= ?')
        params.append(min_year)
    if max_year:
        where.append('year <= ?')
        params.append(max_year)

    where_sql = 'WHERE ' + ' AND '.join(where) if where else ''

    conn = get_conn()
    cur = conn.cursor()
    count_q = f'SELECT COUNT(*) FROM cars {where_sql}'
    cur.execute(count_q, params)
    total = cur.fetchone()[0]
    offset = (page - 1) * page_size
    q_sql = f'SELECT * FROM cars {where_sql} ORDER BY id LIMIT ? OFFSET ?'
    cur.execute(q_sql, params + [page_size, offset])
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({'total': total, 'page': page, 'page_size': page_size, 'pages': ceil(total / page_size) if page_size else 0, 'data': rows})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
