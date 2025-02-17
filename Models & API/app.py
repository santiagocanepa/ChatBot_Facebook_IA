# App.py

import openai
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from utils import find_similar_question
import logging

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

@app.route('/find_question', methods=['POST'])
def handle_find_question():
    data = request.get_json()
    question = data['question']
    try:
        response = find_similar_question(question)
        if isinstance(response, dict):
            return jsonify(response=response)
        else:
            return jsonify(response=response)
    except Exception as e:
        logging.exception("Error processing request")
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
