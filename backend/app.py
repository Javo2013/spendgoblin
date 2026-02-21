from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests

from extensions import db, jwt

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///spendgoblin.db'
app.config['JWT_SECRET_KEY'] = 'super-secret-key'

db.init_app(app)
jwt.init_app(app)

from models import User, Transaction, Budget

# -----------------------
# AUTH ROUTES
# -----------------------

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "User already exists"}), 400

    hashed_pw = generate_password_hash(data['password'])

    new_user = User(username=data['username'], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "username": user.username
        })

    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = int(get_jwt_identity())
    budgets = Budget.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": b.id,
            "month": b.month,
            "category": b.category,
            "amount": b.amount
        }
        for b in budgets
    ])


@app.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    new_budget = Budget(
        month=data['month'],
        category=data['category'],
        amount=data['amount'],
        user_id=user_id
    )

    db.session.add(new_budget)
    db.session.commit()

    return jsonify({"message": "Budget created"}), 201


# -----------------------
# TRANSACTION ROUTES
# -----------------------

@app.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())
    transactions = Transaction.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "description": t.description
        }
        for t in transactions
    ])


@app.route('/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    new_transaction = Transaction(
        amount=data['amount'],
        type=data['type'],
        category=data['category'],
        description=data['description'],
        user_id=user_id
    )

    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({"message": "Transaction created"}), 201


@app.route('/transactions/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = int(get_jwt_identity())
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    if not transaction:
        return jsonify({"message": "Transaction not found"}), 404

    data = request.get_json()
    transaction.amount = data['amount']
    transaction.type = data['type']
    transaction.description = data['description']

    db.session.commit()

    return jsonify({"message": "Transaction updated"})


@app.route('/transactions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = int(get_jwt_identity())
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    if not transaction:
        return jsonify({"message": "Transaction not found"}), 404

    db.session.delete(transaction)
    db.session.commit()

    return jsonify({"message": "Transaction deleted"})


# -----------------------
# EXCHANGE RATE API
# -----------------------

@app.route('/exchange-rate', methods=['GET'])
def get_exchange_rate():
    try:
        url = "https://open.er-api.com/v6/latest/USD"
        response = requests.get(url)
        data = response.json()

        return jsonify({
            "USD_to_EUR": data["rates"]["EUR"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------
# Meal Suggestion API
# -----------------------

@app.route('/cheap-meal', methods=['GET'])
def get_cheap_meal():
    try:
        url = "https://www.themealdb.com/api/json/v1/1/random.php"
        response = requests.get(url)
        data = response.json()

        meal = data["meals"][0]

        return jsonify({
            "name": meal["strMeal"],
            "image": meal["strMealThumb"],
            "instructions": meal["strInstructions"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------
# RUN APP
# -----------------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)