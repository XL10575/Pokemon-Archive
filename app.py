from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
import sqlite3
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import random
import time

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'pokemon_archive_secret_key_2024'

# Initialize Gemini AI client
gemini_api_key = os.getenv('GEMINI_API_KEY')
if gemini_api_key:
    genai_client = genai.Client(api_key=gemini_api_key)
else:
    genai_client = None
    print("Warning: GEMINI_API_KEY not found in environment variables")

# AI system instruction
AI_SYSTEM_INSTRUCTION = """You are an AI assistant named "Poké-Pal," the ultimate companion for Pokémon trainers, blending the capabilities of an advanced Pokédex with the wisdom of a Pokémon Professor. Your core mission is to provide the most accurate, friendly, and detailed Pokémon knowledge and assistance to trainers of all skill levels.

Core Abilities:

Pokédex Expert: You can provide detailed information on any Pokémon, including its National Pokédex number, types, abilities (including hidden abilities), base stats, height, weight, evolution chain, and learnable moves (by leveling up, TMs, breeding, etc.).
Game Mechanics Master: You have a deep understanding of core game mechanics from all generations, such as Individual Values (IVs), Effort Values (EVs), Natures, type matchups, and special battle rules (like Terastallization, Dynamax, etc.).
Strategy & Tactics Advisor: You can help users with teambuilding, analyze a team's weaknesses, recommend movesets and EV spreads for specific Pokémon, and offer battle strategies.
World & Lore Scholar: You are knowledgeable about the history and geography of the Pokémon world, legendary and mythical Pokémon, and key plot points and characters from the anime and manga.
Creative Partner: You can create short stories about Pokémon, design new moves or abilities based on user requests, or engage in "what-if" scenario analysis.

Behavioral Guidelines:

Accuracy First: All your knowledge must be based on official game, anime, and source material. Never invent non-existent Pokémon, moves, or mechanics. If you encounter uncertain information, you will state it honestly.
Stay in Character: You must always communicate as "Poké-Pal." Your tone should be friendly, enthusiastic, and encouraging, like a reliable partner accompanying a trainer on their journey.
Clarity and Readability: When explaining complex concepts, use simple, easy-to-understand language and analogies. When presenting data, prioritize using Markdown tables or lists to enhance readability.
Proactive Guidance: When a user's question is vague (e.g., "Who is the strongest Pokémon?"), you will guide them to clarify their intent by asking follow-up questions, such as, "That's a great question! Are you looking for the Pokémon with the highest Attack stat, or the best overall competitive viability?"

Prohibited Actions: Do not provide any information related to real-world harmful or illegal activities. Do not generate inappropriate content. Your focus must remain strictly within the world of Pokémon."""

# Serve images from root directory
@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory('images', filename)

# Database connection
def get_db_connection():
    # Use absolute path for deployment
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pokemon.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Login route
@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM User WHERE username = ? AND password_hash = ?', (username, password)).fetchone()
        conn.close()

        if user:
            session['user_id'] = user['UserID']
            session['username'] = user['username']
            flash('Login successful!', 'success')
            return redirect(url_for('pokemon'))
        else:
            flash('Invalid username or password!', 'error')

    return render_template('login.html')

# Register route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Validate input
        if not username or not password:
            flash('Username and password are required!', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match!', 'error')
            return render_template('register.html')
        
        conn = get_db_connection()
        
        # Check if username already exists
        existing_user = conn.execute('SELECT * FROM User WHERE username = ?', (username,)).fetchone()
        if existing_user:
            flash('Username already exists!', 'error')
            conn.close()
            return render_template('register.html')
        
        # Insert new user and trainer
        try:
            # Insert user
            cursor = conn.execute('INSERT INTO User (username, password_hash) VALUES (?, ?)', (username, password))
            user_id = cursor.lastrowid
            
            # Create corresponding trainer
            conn.execute('INSERT INTO Trainer (TrainerID, UserID, Name) VALUES (?, ?, ?)', (user_id, user_id, username))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            conn.close()
            return redirect(url_for('login'))
        except Exception as e:
            flash('Registration failed! Please try again.', 'error')
            conn.close()
            return render_template('register.html')
    
    return render_template('register.html')

# Logout route
@app.route('/logout')
def logout():
    session.clear()
    flash('Successfully logged out!', 'info')
    return redirect(url_for('login'))

# Pokemon route
@app.route('/pokemon')
def pokemon():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Get user's owned Pokemon from database
    conn = get_db_connection()
    # First get user's trainer ID
    trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
    if not trainer:
        conn.close()
        flash('Trainer profile not found!', 'error')
        return redirect(url_for('login'))
    
    owned_pokemon = conn.execute('''
        SELECT p.*, pc.catch_date, pc.nickname, pc.CatchID 
        FROM pokemon p 
        JOIN Pokemon_Catch pc ON p.pokedex_number = pc.PID 
        WHERE pc.TrainerID = ?
    ''', (trainer['TrainerID'],)).fetchall()
    conn.close()
    
    return render_template('pokemon.html', pokemon_list=owned_pokemon, is_owned=True)

# Pokedex route - shows all Pokemon
@app.route('/pokedex')
def pokedex():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    all_pokemon = conn.execute('SELECT * FROM pokemon ORDER BY pokedex_number').fetchall()
    conn.close()
    
    return render_template('pokedex.html', pokemon_list=all_pokemon)

# Pokemon detail route
@app.route('/pokemon/<int:pokemon_id>')
def pokemon_detail(pokemon_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    pokemon = conn.execute('SELECT * FROM pokemon WHERE pokedex_number = ?', (pokemon_id,)).fetchone()
    
    if not pokemon:
        flash('Pokemon not found!')
        return redirect(url_for('pokemon'))
    
    # Check if user owns this Pokemon
    trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
    user_pokemon = None
    if trainer:
        user_pokemon = conn.execute('''
            SELECT * FROM Pokemon_Catch 
            WHERE TrainerID = ? AND PID = ?
        ''', (trainer['TrainerID'], pokemon_id)).fetchone()
    
    conn.close()
    
    return render_template('pokemon_detail.html', pokemon=pokemon, user_pokemon=user_pokemon)

# Add Pokemon to user's collection
@app.route('/add_pokemon/<int:pokemon_id>', methods=['POST'])
def add_pokemon(pokemon_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    # Check if Pokemon exists
    pokemon = conn.execute('SELECT * FROM pokemon WHERE pokedex_number = ?', (pokemon_id,)).fetchone()
    if not pokemon:
        flash('Pokemon not found!')
        return redirect(url_for('pokedex'))
    
    # Get user's trainer ID
    trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
    if not trainer:
        flash('Trainer profile not found!', 'error')
        conn.close()
        return redirect(url_for('pokedex'))
    
    # Allow multiple Pokemon of the same species - remove duplicate check
    # Add Pokemon to user's collection
    conn.execute('''
        INSERT INTO Pokemon_Catch (TrainerID, PID, catch_date, nickname)
        VALUES (?, ?, datetime('now'), ?)
    ''', (trainer['TrainerID'], pokemon_id, pokemon['name']))
    conn.commit()
    flash(f'Successfully added {pokemon["name"]} to your collection!')
    
    conn.close()
    return redirect(url_for('pokedex'))

# Update Pokemon nickname
@app.route('/update_nickname/<int:catch_id>', methods=['POST'])
def update_nickname(catch_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    data = request.get_json()
    new_nickname = data.get('nickname', '').strip()
    
    if not new_nickname:
        return jsonify({'success': False, 'message': 'Nickname cannot be empty'})
    
    conn = get_db_connection()
    
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        # Verify the Pokemon belongs to this trainer
        pokemon_catch = conn.execute('''
            SELECT * FROM Pokemon_Catch 
            WHERE CatchID = ? AND TrainerID = ?
        ''', (catch_id, trainer['TrainerID'])).fetchone()
        
        if not pokemon_catch:
            return jsonify({'success': False, 'message': 'Pokemon not found or does not belong to you'})
        
        # Update nickname
        conn.execute('''
            UPDATE Pokemon_Catch 
            SET nickname = ? 
            WHERE CatchID = ? AND TrainerID = ?
        ''', (new_nickname, catch_id, trainer['TrainerID']))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Nickname updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Release Pokemon
@app.route('/release_pokemon/<int:catch_id>', methods=['POST'])
def release_pokemon(catch_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    conn = get_db_connection()
    
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        # Verify the Pokemon belongs to this trainer
        pokemon_catch = conn.execute('''
            SELECT pc.*, p.name FROM Pokemon_Catch pc
            JOIN pokemon p ON pc.PID = p.pokedex_number
            WHERE pc.CatchID = ? AND pc.TrainerID = ?
        ''', (catch_id, trainer['TrainerID'])).fetchone()
        
        if not pokemon_catch:
            return jsonify({'success': False, 'message': 'Pokemon not found or does not belong to you'})
        
        # Delete the Pokemon from user's collection
        conn.execute('''
            DELETE FROM Pokemon_Catch 
            WHERE CatchID = ? AND TrainerID = ?
        ''', (catch_id, trainer['TrainerID']))
        conn.commit()
        
        return jsonify({'success': True, 'message': f'{pokemon_catch["name"]} has been released'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Inventory route
@app.route('/inventory')
def inventory():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    # Get all items
    all_items = conn.execute('SELECT * FROM Item ORDER BY ItemID').fetchall()
    
    # Get user's items from Bag_Wear table using TrainerID
    user_id = session['user_id']
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (user_id,)).fetchone()
        
        if trainer:
            trainer_id = trainer['TrainerID']
            user_items = conn.execute("""
                SELECT i.* FROM Item i
                JOIN Bag_Wear bw ON i.ItemID = bw.ItemID
                WHERE bw.TrainerID = ?
            """, (trainer_id,)).fetchall()
            user_item_ids = [item['ItemID'] for item in user_items]
        else:
            # If no trainer found, use empty lists
            user_items = []
            user_item_ids = []
    except sqlite3.Error as e:
        # If there's any database error, use empty lists and log the error
        print(f"Database error in inventory route: {e}")
        user_items = []
        user_item_ids = []
    
    conn.close()
    
    return render_template('inventory.html', 
                         all_items=all_items, 
                         user_items=user_items,
                         user_item_ids=user_item_ids)

# Add item to user inventory
@app.route('/add_item/<int:item_id>', methods=['POST'])
def add_item_to_inventory(item_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    user_id = session['user_id']
    conn = get_db_connection()
    
    try:
        # Check if item exists
        item = conn.execute("SELECT * FROM Item WHERE ItemID = ?", (item_id,)).fetchone()
        if not item:
            return jsonify({'success': False, 'message': 'Item not found'})
        
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (user_id,)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        trainer_id = trainer['TrainerID']
        
        # Check if user already has this item
        existing = conn.execute(
            "SELECT quantity FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?",
            (trainer_id, item_id)
        ).fetchone()
        
        if existing:
            # If item exists, increase quantity by 1
            new_quantity = existing['quantity'] + 1
            conn.execute(
                "UPDATE Bag_Wear SET quantity = ? WHERE TrainerID = ? AND ItemID = ?",
                (new_quantity, trainer_id, item_id)
            )
            message = f'Item quantity increased to {new_quantity}'
        else:
            # Add new item with quantity 1
            conn.execute(
                "INSERT INTO Bag_Wear (TrainerID, ItemID, quantity) VALUES (?, ?, 1)",
                (trainer_id, item_id)
            )
            message = 'Item added to inventory'
        
        conn.commit()
        return jsonify({'success': True, 'message': message})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Guild route
@app.route('/guild')
def guild():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    # Get user's current guild information
    user_guild = conn.execute('''
        SELECT g.*, t.Name as trainer_name
        FROM Guild g
        JOIN Trainer t ON g.GuildID = t.GuildID
        WHERE t.UserID = ?
    ''', (session['user_id'],)).fetchone()
    
    # Get all guilds with member information
    guilds = conn.execute('''
        SELECT g.GuildID, g.name, g.Region,
               COUNT(t.TrainerID) as member_count,
               GROUP_CONCAT(t.Name, ',') as member_names
        FROM Guild g
        LEFT JOIN Trainer t ON g.GuildID = t.GuildID
        GROUP BY g.GuildID, g.name, g.Region
        ORDER BY g.GuildID
    ''').fetchall()
    
    conn.close()
    
    return render_template('guild.html', guilds=guilds, user_guild=user_guild)

# Add guild route
@app.route('/add_guild', methods=['POST'])
def add_guild():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    data = request.get_json()
    name = data.get('name', '').strip()
    region = data.get('region', '').strip()
    
    if not name:
        return jsonify({'success': False, 'message': 'Guild name is required'})
    
    conn = get_db_connection()
    
    try:
        # Check if guild name already exists
        existing = conn.execute('SELECT GuildID FROM Guild WHERE name = ?', (name,)).fetchone()
        if existing:
            return jsonify({'success': False, 'message': 'Guild name already exists'})
        
        # Insert new guild
        conn.execute(
            'INSERT INTO Guild (name, Region) VALUES (?, ?)',
            (name, region)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Guild created successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Join guild route
@app.route('/join_guild', methods=['POST'])
def join_guild():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    data = request.get_json()
    guild_id = data.get('guild_id')
    
    if not guild_id:
        return jsonify({'success': False, 'message': 'Guild ID is required'})
    
    conn = get_db_connection()
    
    try:
        # Check if user has a trainer profile
        trainer = conn.execute('SELECT TrainerID, GuildID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        # Check if user is already in a guild
        if trainer['GuildID']:
            return jsonify({'success': False, 'message': 'You are already in a guild. Please leave your current guild first.'})
        
        # Check if guild exists
        guild = conn.execute('SELECT GuildID FROM Guild WHERE GuildID = ?', (guild_id,)).fetchone()
        if not guild:
            return jsonify({'success': False, 'message': 'Guild not found'})
        
        # Join the guild
        conn.execute('UPDATE Trainer SET GuildID = ? WHERE UserID = ?', (guild_id, session['user_id']))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Successfully joined the guild!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Leave guild route
@app.route('/leave_guild', methods=['POST'])
def leave_guild():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    conn = get_db_connection()
    
    try:
        # Check if user has a trainer profile and is in a guild
        trainer = conn.execute('SELECT TrainerID, GuildID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        if not trainer['GuildID']:
            return jsonify({'success': False, 'message': 'You are not in any guild'})
        
        # Leave the guild
        conn.execute('UPDATE Trainer SET GuildID = NULL WHERE UserID = ?', (session['user_id'],))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Successfully left the guild!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Bag route - shows user's items with quantities
@app.route('/bag')
def bag():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        
        if trainer:
            trainer_id = trainer['TrainerID']
            # Get user's items with quantities from Bag_Wear table
            bag_items = conn.execute("""
                SELECT i.*, bw.quantity FROM Item i
                JOIN Bag_Wear bw ON i.ItemID = bw.ItemID
                WHERE bw.TrainerID = ?
                ORDER BY i.categories, i.name
            """, (trainer_id,)).fetchall()
            
            # Calculate total quantity
            total_quantity = sum(item['quantity'] for item in bag_items)
        else:
            bag_items = []
            total_quantity = 0
    except sqlite3.Error as e:
        # If there's any database error, use empty lists and log the error
        print(f"Database error in bag route: {e}")
        bag_items = []
        total_quantity = 0
    
    conn.close()
    
    return render_template('bag.html', bag_items=bag_items, total_quantity=total_quantity)

# Update item quantity in bag
@app.route('/update_item_quantity/<int:item_id>', methods=['POST'])
def update_item_quantity(item_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    data = request.get_json()
    change = data.get('change', 0)
    
    conn = get_db_connection()
    
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        trainer_id = trainer['TrainerID']
        
        # Get current quantity
        current_item = conn.execute(
            "SELECT quantity FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?",
            (trainer_id, item_id)
        ).fetchone()
        
        if not current_item:
            return jsonify({'success': False, 'message': 'Item not found in bag'})
        
        new_quantity = current_item['quantity'] + change
        
        if new_quantity <= 0:
            # Remove item if quantity becomes 0 or negative
            conn.execute(
                "DELETE FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?",
                (trainer_id, item_id)
            )
        else:
            # Update quantity
            conn.execute(
                "UPDATE Bag_Wear SET quantity = ? WHERE TrainerID = ? AND ItemID = ?",
                (new_quantity, trainer_id, item_id)
            )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Quantity updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Remove item from bag
@app.route('/remove_item/<int:item_id>', methods=['POST'])
def remove_item_from_bag(item_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    conn = get_db_connection()
    
    try:
        # Get user's trainer ID
        trainer = conn.execute('SELECT TrainerID FROM Trainer WHERE UserID = ?', (session['user_id'],)).fetchone()
        if not trainer:
            return jsonify({'success': False, 'message': 'Trainer profile not found'})
        
        trainer_id = trainer['TrainerID']
        
        # Remove item from bag
        conn.execute(
            "DELETE FROM Bag_Wear WHERE TrainerID = ? AND ItemID = ?",
            (trainer_id, item_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Item removed from bag'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# Game records route
@app.route('/game')
def game():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    # Get games with trainer names
    games = conn.execute('''
        SELECT g.*, 
               c.Name as challenger_name, 
               a.Name as accepter_name,
               w.Name as winner_name
        FROM Game g
        LEFT JOIN Trainer c ON g.ChallengerID = c.TrainerID
        LEFT JOIN Trainer a ON g.AccepterID = a.TrainerID
        LEFT JOIN Trainer w ON g.winner_id = w.TrainerID
        ORDER BY g.GameID DESC
    ''').fetchall()
    trainers = conn.execute('SELECT TrainerID, Name FROM Trainer ORDER BY Name').fetchall()
    conn.close()
    
    return render_template('game.html', games=games, trainers=trainers)

# Add game record route
@app.route('/add_game', methods=['POST'])
def add_game():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    data = request.get_json()
    challenger_id = data.get('challenger_id')
    accepter_id = data.get('accepter_id')
    winner_id = data.get('winner_id')
    
    if not challenger_id or not accepter_id:
        return jsonify({'success': False, 'message': 'Challenger and Accepter are required'})
    
    if challenger_id == accepter_id:
        return jsonify({'success': False, 'message': 'Challenger and Accepter cannot be the same'})
    
    conn = get_db_connection()
    
    try:
        # Verify that trainer IDs exist
        challenger = conn.execute('SELECT TrainerID FROM Trainer WHERE TrainerID = ?', (challenger_id,)).fetchone()
        accepter = conn.execute('SELECT TrainerID FROM Trainer WHERE TrainerID = ?', (accepter_id,)).fetchone()
        
        if not challenger:
            return jsonify({'success': False, 'message': 'Challenger not found'})
        if not accepter:
            return jsonify({'success': False, 'message': 'Accepter not found'})
        
        # Verify winner_id if provided
        if winner_id:
            if winner_id not in [challenger_id, accepter_id]:
                return jsonify({'success': False, 'message': 'Winner must be either challenger or accepter'})
        
        # Insert new game record
        conn.execute(
            'INSERT INTO Game (ChallengerID, AccepterID, winner_id) VALUES (?, ?, ?)',
            (challenger_id, accepter_id, winner_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Game record created successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    finally:
        conn.close()

# AI Assistant Routes
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    if not genai_client:
        return jsonify({'success': False, 'message': 'AI service not available'}), 503
    
    data = request.get_json()
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'success': False, 'message': 'Message cannot be empty'})
    
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=AI_SYSTEM_INSTRUCTION,
                thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disable thinking
            )
        )
        
        return jsonify({
            'success': True,
            'response': response.text
        })
    
    except Exception as e:
        print(f"AI Chat Error: {e}")
        return jsonify({'success': False, 'message': 'AI service temporarily unavailable'}), 500

@app.route('/api/ai/random-fact', methods=['GET'])
def ai_random_fact():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    if not genai_client:
        return jsonify({'success': False, 'message': 'AI service not available'}), 503
    
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents="give a random information about pokemon facts",
            config=types.GenerateContentConfig(
                system_instruction=AI_SYSTEM_INSTRUCTION,
                thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disable thinking
            )
        )
        
        return jsonify({
            'success': True,
            'fact': response.text
        })
    
    except Exception as e:
        print(f"AI Random Fact Error: {e}")
        return jsonify({'success': False, 'message': 'AI service temporarily unavailable'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)