from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import json
import os
from services.nlp_parser import NLPParser
from services.api_mapper import ApiMapper
from data.contexts import command_contexts

app = Flask(__name__)
CORS(app)

# Initialize services
nlp_parser = NLPParser()
api_mapper = ApiMapper()

# Store command history in memory (in production, use a database)
command_history = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/parse', methods=['POST'])
def parse_intent():
    try:
        data = request.get_json()
        input_text = data.get('input', '').strip()
        
        if not input_text:
            return jsonify({
                'success': False,
                'error': 'Please enter a command'
            })
        
        result = nlp_parser.parse_intent(input_text)
        
        if result['success'] and result.get('intent'):
            # Add to history
            intent = result['intent']
            intent['timestamp'] = datetime.now().isoformat()
            command_history.append(intent)
            
            # Validate parameters
            validation = nlp_parser.validate_parameters(intent)
            result['validation'] = validation
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing request: {str(e)}'
        }), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(command_history)

@app.route('/api/contexts', methods=['GET'])
def get_contexts():
    return jsonify(command_contexts)

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    if not command_history:
        return jsonify({
            'total_commands': 0,
            'avg_confidence': 0,
            'context_stats': {},
            'action_stats': {},
            'confidence_distribution': {
                'high': 0,
                'medium': 0,
                'low': 0
            }
        })
    
    # Calculate analytics
    context_stats = {}
    action_stats = {}
    total_confidence = 0
    high_confidence = 0
    medium_confidence = 0
    low_confidence = 0
    
    for intent in command_history:
        # Context stats
        context = intent['context']
        context_stats[context] = context_stats.get(context, 0) + 1
        
        # Action stats
        action = intent['action']
        action_stats[action] = action_stats.get(action, 0) + 1
        
        # Confidence stats
        confidence = intent['confidence']
        total_confidence += confidence
        
        if confidence >= 0.8:
            high_confidence += 1
        elif confidence >= 0.6:
            medium_confidence += 1
        else:
            low_confidence += 1
    
    avg_confidence = total_confidence / len(command_history)
    
    return jsonify({
        'total_commands': len(command_history),
        'avg_confidence': avg_confidence,
        'context_stats': context_stats,
        'action_stats': action_stats,
        'confidence_distribution': {
            'high': high_confidence,
            'medium': medium_confidence,
            'low': low_confidence
        }
    })

@app.route('/api/suggestions', methods=['POST'])
def get_suggestions():
    try:
        data = request.get_json()
        input_text = data.get('input', '')
        context_id = data.get('context_id')
        
        suggestions = nlp_parser.get_context_examples(context_id)
        return jsonify(suggestions)
    
    except Exception as e:
        return jsonify([]), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)