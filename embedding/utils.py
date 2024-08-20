import openai
import pandas as pd
import numpy as np
import joblib
import ast
import os
from dotenv import load_dotenv

# Cargar las variables de entorno
load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')

# Configura tu clave de API de OpenAI
openai.api_key = openai_api_key

# Cargar los modelos entrenados y los LabelEncoders
models = {
    'OfertaInicial': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/modelOfertaInicialPredict.pkl'),
    'OfertaInicial2': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/modelOfertaInicial2Predict.pkl'),
    'Fotos': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/modelFOTOSPredict.pkl'),
    'Ventas': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/modelVentasPredict.pkl')
}

label_encoders = {
    'OfertaInicial': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/label_encoderOfertaInicial.pkl'),
    'OfertaInicial2': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/label_encoderOfertaInicial2.pkl'),
    'Fotos': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/label_encoderFotos.pkl'),
    'Ventas': joblib.load('/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/embedding/Models/label_encoderVentas.pkl')
}

# Función para obtener embeddings en lotes
def create_embeddings_batch(texts):
    cleaned_texts = [text.strip()[:2048] for text in texts if text]
    if not cleaned_texts:
        return []
    response = openai.Embedding.create(
        input=cleaned_texts,
        model="text-embedding-ada-002"
    )
    return [np.array(item['embedding']) for item in response['data']]

# Función para ajustar el peso del último segmento basado en la longitud total de la conversación
def get_weights(total_length):
    if total_length <= 20:
        return 0.35, 0.65
    elif total_length <= 50:
        return 0.45, 0.55
    else:
        return 0.70, 0.30

# Función para obtener embeddings ponderados
def get_weighted_embedding(text):
    segments = text.split('\n')
    last_segment = segments[-1]
    previous_segments = '\n'.join(segments[:-1])
    
    total_length = len(text.split())
    weight_previous, weight_last = get_weights(total_length)
    
    last_segment_embedding = create_embeddings_batch([last_segment])
    if not last_segment_embedding:
        return np.zeros(1536)  # Tamaño del embedding de text-embedding-ada-002

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
        raise ValueError("Embeddings lengths do not match")
    
    final_embedding = weight_previous * previous_segments_embedding + weight_last * last_segment_embedding
    return final_embedding

# Función para clasificar el texto
def classify_text(text):
    if '{Oferta Inicial}' in text and '{Fotos Enviadas}' not in text and '{Fotos enviadas}' not in text:
        return 'OfertaInicial'
    elif '{Oferta Inicial2}' in text:
        return 'OfertaInicial2'
    elif '{Fotos Enviadas}' in text or '{Fotos enviadas}' in text:
        return 'Fotos'
    else:
        return 'Ventas'

# Función para procesar el texto según la categoría
def process_text(text, category):
    if category == 'Fotos':
        if '{Fotos Enviadas}' in text:
            text = text.split('{Fotos Enviadas}', 1)[-1]
        elif '{Fotos enviadas}' in text:
            text = text.split('{Fotos enviadas}', 1)[-1]
    elif category in ['OfertaInicial', 'OfertaInicial2']:
        text = text.replace(f'{{{category}}}', '').strip()
    return text

# Función principal para predecir la respuesta
def find_similar_question(input_text):
    category = classify_text(input_text)
    processed_text = process_text(input_text, category)
    input_embedding = get_weighted_embedding(processed_text)
    input_embedding = np.array(input_embedding).reshape(1, -1)
    
    model = models[category]
    label_encoder = label_encoders[category]
    
    predicted_label = model.predict(input_embedding)
    predicted_response = label_encoder.inverse_transform(predicted_label)[0]
    return predicted_response

