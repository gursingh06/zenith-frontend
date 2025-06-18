import re
from datetime import datetime
from fuzzywuzzy import fuzz
from data.contexts import command_contexts

class NLPParser:
    def __init__(self):
        self.command_contexts = command_contexts
    
    def fuzzy_match(self, text, pattern):
        """Calculate fuzzy match score between text and pattern"""
        text_lower = text.lower()
        pattern_lower = pattern.lower()
        
        if pattern_lower in text_lower:
            return 0.9
        
        # Use fuzzywuzzy for similarity scoring
        ratio = fuzz.ratio(text_lower, pattern_lower) / 100.0
        return max(0, ratio)
    
    def extract_parameters(self, text, pattern):
        """Extract parameters from text using regex pattern"""
        match = re.search(pattern['pattern'], text, re.IGNORECASE)
        if not match:
            return {}
        
        parameters = {}
        groups = match.groups()
        
        for i, param in enumerate(pattern['parameters']):
            if i < len(groups) and groups[i] is not None:
                value = groups[i].strip()
                if value:
                    # Smart type conversion and parameter handling
                    if param in ['force', 'dry_run']:
                        parameters[param] = True
                    elif param == 'disk_paths' and ',' in value:
                        parameters[param] = [path.strip() for path in value.split(',')]
                    elif param.endswith('_id') or param in ['port', 'replicas']:
                        try:
                            parameters[param] = int(value)
                        except ValueError:
                            parameters[param] = value
                    else:
                        parameters[param] = value
        
        # Set default values for boolean parameters if they appear in the text
        text_lower = text.lower()
        if 'force' in text_lower and 'force' not in parameters:
            parameters['force'] = True
        if ('dry run' in text_lower or 'dry-run' in text_lower) and 'dry_run' not in parameters:
            parameters['dry_run'] = True
        
        return parameters
    
    def calculate_confidence(self, text, pattern):
        """Calculate confidence score for pattern match"""
        if not re.search(pattern['pattern'], text, re.IGNORECASE):
            return 0
        
        # Base confidence from regex match
        confidence = 0.85
        
        # Boost confidence for exact action matches
        action_keywords = ['restart', 'start', 'stop', 'create', 'delete', 'scale', 
                          'backup', 'restore', 'clean', 'wipe', 'bounce', 'reboot']
        text_lower = text.lower()
        found_actions = [keyword for keyword in action_keywords if keyword in text_lower]
        confidence += len(found_actions) * 0.03
        
        # Boost confidence for context-specific terms
        context_terms = {
            'kafka': ['kafka', 'broker', 'node', 'datanode', 'consumer', 'producer'],
            'storage': ['storage', 'disk', 'box', 'rack', 'cleanup', 'maintenance'],
            'service': ['service', 'daemon', 'process']
        }
        
        relevant_terms = context_terms.get(pattern['context'], [])
        found_terms = [term for term in relevant_terms if term in text_lower]
        confidence += len(found_terms) * 0.02
        
        # Boost confidence for parameter presence
        parameters = self.extract_parameters(text, pattern)
        confidence += len(parameters) * 0.01
        
        # Penalize if required hostname is missing for infrastructure operations
        if 'hostname' in pattern['parameters'] and not re.search(r'(?:on|host|server)\s+[\w\-\.]+', text, re.IGNORECASE):
            confidence -= 0.1
        
        return min(confidence, 1.0)
    
    def parse_intent(self, input_text):
        """Parse natural language input into structured intent"""
        if not input_text.strip():
            return {
                'success': False,
                'error': 'Please enter a command'
            }
        
        matches = []
        
        # Find all matching patterns across all contexts
        for context in self.command_contexts:
            for pattern in context['patterns']:
                if re.search(pattern['pattern'], input_text, re.IGNORECASE):
                    confidence = self.calculate_confidence(input_text, pattern)
                    matches.append({
                        'pattern': pattern,
                        'context': context['id'],
                        'confidence': confidence
                    })
        
        if not matches:
            # Generate suggestions based on fuzzy matching
            suggestions = self.generate_suggestions(input_text)
            return {
                'success': False,
                'error': 'No matching infrastructure operation found. Try commands like "restart kafka node on server-01" or "clean disks on storage-02"',
                'suggestions': suggestions
            }
        
        # Sort by confidence and take the best match
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        best_match = matches[0]
        
        parameters = self.extract_parameters(input_text, best_match['pattern'])
        
        intent = {
            'intent': best_match['pattern']['intent'],
            'confidence': best_match['confidence'],
            'context': best_match['context'],
            'parameters': parameters,
            'action': best_match['pattern']['action'],
            'timestamp': datetime.now(),
            'api': best_match['pattern'].get('api')
        }
        
        return {
            'success': True,
            'intent': intent
        }
    
    def generate_suggestions(self, input_text):
        """Generate command suggestions based on fuzzy matching"""
        suggestions = []
        
        for context in self.command_contexts:
            for pattern in context['patterns']:
                for example in pattern['examples']:
                    score = self.fuzzy_match(input_text, example)
                    if score > 0.3:
                        suggestions.append({'example': example, 'score': score})
        
        # Sort by score and return top 5
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        return [s['example'] for s in suggestions[:5]]
    
    def get_context_examples(self, context_id=None):
        """Get example commands for a specific context or all contexts"""
        contexts = [c for c in self.command_contexts if c['id'] == context_id] if context_id else self.command_contexts
        
        examples = []
        for context in contexts:
            for pattern in context['patterns']:
                examples.extend(pattern['examples'])
        
        return examples[:15]
    
    def validate_parameters(self, intent):
        """Validate extracted parameters"""
        errors = []
        
        # Check for required hostname in infrastructure operations
        if intent['intent'] in ['restart_kafka_node', 'restart_storage_node', 'clean_disks', 'restart_service']:
            if not intent['parameters'].get('hostname'):
                errors.append('Hostname is required for infrastructure operations')
        
        # Validate service name for service operations
        if intent['intent'] == 'restart_service' and not intent['parameters'].get('service_name'):
            errors.append('Service name is required')
        
        # Validate cleanup type for disk cleaning
        if intent['intent'] == 'clean_disks' and intent['parameters'].get('cleanup_type'):
            valid_types = ['temp_files', 'log_files', 'cache', 'all']
            if intent['parameters']['cleanup_type'] not in valid_types:
                errors.append(f"Invalid cleanup type. Must be one of: {', '.join(valid_types)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }