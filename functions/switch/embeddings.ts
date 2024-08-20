// embeddings.ts
import axios from 'axios';

export async function embeddings(conversation: string): Promise<{ response: string }> {
   
    try {
        const response = await axios.post('http://127.0.0.1:8080/find_question', {
            question: conversation
        });
        console.log('Embeddings:', response.data);  // Añadir log
        const resToReturn = response.data
        console.log(resToReturn)
        return resToReturn
    } catch (error) {
        throw new Error(`Failed to get embeddings: ${error}`);
    }
}
