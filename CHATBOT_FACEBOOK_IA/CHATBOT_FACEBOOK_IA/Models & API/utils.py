import os
import json
import openai
import pandas as pd
import numpy as np
import joblib
import ast
from dotenv import load_dotenv
from utilsgpt import process_conversation  # Import the conversation processing function from utilsgpt

# Load environment variables
load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')
openai.api_key = openai_api_key

# Import system prompts for specific actions
from system_prompts.SendDoc_prompt import SendDoc_SYSTEM_PROMPT
from system_prompts.response_two_prompt import response_two_SYSTEM_PROMPT
from system_prompts.promptgeneral import general_SYSTEM_PROMPT

# Load pre-trained models and their associated LabelEncoders for different categories
models = {
    'responseinit1': joblib.load('./Models/modelresponseinit1Predict.pkl'),
    'responsetwo': joblib.load('./Models/modelresponsetwoPredict.pkl'),
    'SendDoc': joblib.load('./Models/modelSendDocPredict.pkl'),
    'general': joblib.load('./Models/modelgeneralPredict.pkl')
}

label_encoders = {
    'responseinit1': joblib.load('./Models/label_encoderresponseinit1.pkl'),
    'responsetwo': joblib.load('./Models/label_encoderresponsetwo.pkl'),
    'SendDoc': joblib.load('./Models/label_encoderSendDoc.pkl'),
    'general': joblib.load('./Models/label_encodergeneral.pkl')
}

# Define the embedding size corresponding to the 'text-embedding-3-large' model
EMBEDDING_SIZE = 3072  # Dimensionality for 'text-embedding-3-large'

# ------------------------------------------------------------------------------
# Function: create_embeddings_batch
# ------------------------------------------------------------------------------
# Description:
#    Creates embeddings for a batch of texts using the new embedding model.
#    - Strips and truncates each text to 2048 characters.
#    - If an error occurs, returns a zero vector for each text.
# ------------------------------------------------------------------------------
def create_embeddings_batch(texts, model="text-embedding-3-large"):
    cleaned_texts = [text.strip()[:2048] for text in texts if isinstance(text, str) and text.strip()]
    if not cleaned_texts:
        return []
    try:
        response = openai.Embedding.create(
            input=cleaned_texts,
            model=model  # Updated to use the new model
        )
        return [np.array(item['embedding']) for item in response['data']]
    except Exception as e:
        print(f"Error creating embeddings: {e}")
        # Return a zero vector for each text in case of error
        return [np.zeros(EMBEDDING_SIZE) for _ in cleaned_texts]

# ------------------------------------------------------------------------------
# Function: get_weights
# ------------------------------------------------------------------------------
# Description:
#    Determines the weighting factors for the previous segments and the last segment
#    of the conversation based on the total word count.
# ------------------------------------------------------------------------------
def get_weights(total_length):
    if total_length <= 20:
        return 0.35, 0.65
    elif total_length <= 50:
        return 0.45, 0.55
    else:
        return 0.70, 0.30

# ------------------------------------------------------------------------------
# Function: get_weighted_embedding
# ------------------------------------------------------------------------------
# Description:
#    Computes a weighted embedding for the conversation text.
#    - Splits the text into segments (using newline as separator).
#    - Computes embeddings for the last segment and all previous segments separately.
#    - Weights the embeddings based on the conversation's total word count.
#    - Returns a combined embedding vector.
# ------------------------------------------------------------------------------
def get_weighted_embedding(text):
    segments = text.split('\n')
    last_segment = segments[-1]
    previous_segments = '\n'.join(segments[:-1])

    total_length = len(text.split())
    weight_previous, weight_last = get_weights(total_length)

    last_segment_embedding = create_embeddings_batch([last_segment])
    if not last_segment_embedding:
        return np.zeros(EMBEDDING_SIZE)  # Adjust size according to the new model

    last_segment_embedding = last_segment_embedding[0]

    if previous_segments:
        previous_segments_embedding = create_embeddings_batch([previous_segments])
        if not previous_segments_embedding:
            previous_segments_embedding = np.zeros_like(last_segment_embedding)
        else:
            previous_segments_embedding = previous_segments_embedding[0]
    else:
        previous_segments_embedding = np.zeros_like(last_segment_embedding)

    if len(previous_segments_embedding) != len(last_segment_embedding):
        raise ValueError("Embedding lengths do not match")

    final_embedding = weight_previous * previous_segments_embedding + weight_last * last_segment_embedding
    return final_embedding

# ------------------------------------------------------------------------------
# Function: classify_text
# ------------------------------------------------------------------------------
# Description:
#    Determines the category of the text based on specific markers:
#      - 'responseinit1' if '{responseinit1}' is present and '{docSent}' is not.
#      - 'responsetwo' if '{responsetwo}' is present.
#      - 'SendDoc' if '{docSent}' is present.
#      - 'general' for all other cases.
# ------------------------------------------------------------------------------
def classify_text(text):
    if '{responseinit1}' in text and '{docSent}' not in text:
        return 'responseinit1'
    elif '{responsetwo}' in text:
        return 'responsetwo'
    elif '{docSent}' in text:
        return 'SendDoc'
    else:
        return 'general'

# ------------------------------------------------------------------------------
# Function: extract_text_after_marker
# ------------------------------------------------------------------------------
# Description:
#    Extracts the portion of the text that comes after a specific marker for 
#    categories like 'SendDoc', 'responseinit1', and 'responsetwo'.
#    - Truncates the extracted text to 2048 characters if necessary.
#    - Returns an empty string if no text is found after the marker.
# ------------------------------------------------------------------------------
def extract_text_after_marker(text, category):
    """
    Extracts the text that follows the specific marker for the category.
    If there is no text after the marker, returns an empty string.
    """
    if not isinstance(text, str):
        return ""

    if category == 'SendDoc':
        markers = ["{docSent}", "{docSent}"]
    elif category == 'responseinit1':
        markers = ["{responseinit1}"]
    elif category == 'responsetwo':
        markers = ["{responsetwo}"]
    else:
        # For 'general', no extraction is performed
        return text

    for marker in markers:
        if marker in text:
            parts = text.split(marker, 1)
            if len(parts) > 1:
                return parts[-1].strip()[:2048]  # Truncate to 2048 characters if necessary
    return ""  # Return an empty string if no marker or text is found

# ------------------------------------------------------------------------------
# Function: process_text
# ------------------------------------------------------------------------------
# Description:
#    Processes the text based on its category:
#      - For 'SendDoc', 'responseinit1', and 'responsetwo': extracts the text after the marker.
#      - For 'general': simply strips the text.
# ------------------------------------------------------------------------------
def process_text(text, category):
    """
    Processes the text based on its category:
    - For 'SendDoc', 'responseinit1', 'responsetwo': extract text after the marker.
    - For 'general': return the text as is (after stripping whitespace).
    """
    if category in ['SendDoc', 'responseinit1', 'responsetwo']:
        extracted_text = extract_text_after_marker(text, category)
        return extracted_text
    elif category == 'general':
        return text.strip()
    else:
        return text.strip()

# ------------------------------------------------------------------------------
# Function: find_similar_question
# ------------------------------------------------------------------------------
# Description:
#    Main function to process the input text and predict the appropriate response:
#      1. Classifies the text into one of the four categories based on specific markers.
#      2. Processes the text (e.g., extracts relevant part after the marker).
#      3. Creates an embedding:
#           - For 'SendDoc', 'responseinit1', 'responsetwo': uses direct embedding.
#           - For 'general': computes a weighted embedding considering the conversation segments.
#      4. Retrieves the corresponding model and LabelEncoder.
#      5. Predicts the label using the model and maps it back using the LabelEncoder.
#      6. If the predicted response is "Noti" for categories 'SendDoc' or 'responsetwo':
#           - It uses system prompts to further process the conversation through OpenAI's API.
#           - Depending on the 'action' returned by the GPT model, it may return "Noti", a
#             detailed response, or "Null" if nothing valid is determined.
#      7. For all other cases, returns the predicted response directly.
# ------------------------------------------------------------------------------
def find_similar_question(input_text):
    category = classify_text(input_text)
    processed_text = process_text(input_text, category)

    if category in ['SendDoc', 'responseinit1', 'responsetwo']:
        if not processed_text and category in ['SendDoc', 'responseinit1', 'responsetwo']:
            return "Null"

        # For these categories, create a direct embedding of the processed text
        if category in ['SendDoc', 'responseinit1', 'responsetwo']:
            input_embedding = create_embeddings_batch([processed_text])
            if not input_embedding:
                return "Null"
            input_embedding = np.array(input_embedding[0]).reshape(1, -1)

    elif category == 'general':
        # For 'general', create a weighted embedding based on conversation segmentation
        input_embedding = get_weighted_embedding(processed_text)
        input_embedding = np.array(input_embedding).reshape(1, -1)
    else:
        return "Null"

    model = models.get(category)
    label_encoder = label_encoders.get(category)

    if model is None or label_encoder is None:
        print(f"Model or encoder not found for category '{category}'.")
        return "Null"

    try:
        predicted_label = model.predict(input_embedding)
        predicted_response = label_encoder.inverse_transform(predicted_label)[0]
    except Exception as e:
        print(f"Error predicting response: {e}")
        return "Null"
# If you already have your conversations segmented by regex you can add more promts systems, by default it will use the promtgeneral.

    # For 'SendDoc' or 'responsetwo' with predicted response "Noti", call OpenAI's API
    if category in ['SendDoc', 'responsetwo'] and predicted_response == "Noti":
        # Select the appropriate system prompt based on the category
        if category == 'SendDoc':
            system_prompt = SendDoc_SYSTEM_PROMPT
        elif category == 'responsetwo':
            system_prompt = response_two_SYSTEM_PROMPT
        else:
            system_prompt = general_SYSTEM_PROMPT 

        # Process the complete conversation using the utilsgpt module
        gpt_result = process_conversation(input_text, system_prompt)
        action = gpt_result.get('action', 'Null')
        gpt_response = gpt_result.get('response', 'Null')

        # Return according to the action provided by the GPT response
        if action == "Null":
            return "Null"
        elif action == "Notify":
            return "Noti"
        elif action == "Respose":
            # Return a dictionary for the 'Respose' action; the app.py will jsonify it
            return {"action": "Respose", "response": gpt_response}
        else:
            return "Null"
    else:
        # For all other cases, return the original predicted response without modifications
        return predicted_response
