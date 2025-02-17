// embeddings.ts
import axios from 'axios';

interface AnswerResponse {
    action: "Answer";
    response: string;
}

type ApiResponse = string | AnswerResponse;

export async function embeddings(conversation: string): Promise<{ response: ApiResponse }> {
    try {
        const apiResponse = await axios.post('http://127.0.0.1:8080/find_question', {
            question: conversation
        });
        console.log('Embeddings:', apiResponse.data);  

        const resToReturn: ApiResponse = apiResponse.data.response;
        console.log('Processed Response:', resToReturn);
        
        return { response: resToReturn };
    } catch (error) {
        console.error('Error en embeddings.ts:', error);
        throw new Error(`Failed to get embeddings: ${error}`);
    }
}
