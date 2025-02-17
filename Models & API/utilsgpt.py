# utilsgpt.py

import openai

def process_conversation(conversation, system_prompt, model="gpt-4o-mini", temperature=0.2, max_tokens=5000):
    """
    Sends a conversation to the OpenAI API and gets the response broken down into thinking, action, and response.
    
    Args:
        conversation (str): The complete conversation.
        system_prompt (str): The specific system prompt for the category.
        model (str): The OpenAI model to use.
        temperature (float): Temperature parameter for generation.
        max_tokens (int): Maximum number of tokens in the response.
    
    Returns:
        dict: A dictionary with 'thinking', 'action', and 'response'.
    """
    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": conversation}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            n=1,
            stop=None
        )
        
        # Get the response text
        reply = response.choices[0].message['content']

        # Parse the response
        thinking = ""
        action = "Null"
        response_text = "Null"
        
        # Extract <thinking>
        if "<thinking>" in reply and "</thinking>" in reply:
            start_t = reply.find("<thinking>")
            end_t = reply.find("</thinking>", start_t)
            if end_t != -1:
                thinking = reply[start_t + len("<thinking>"):end_t].strip()
        
        # Extract <action> and <response>
        if "<action>" in reply and "</action>" in reply:
            start_a = reply.find("<action>") + len("<action>")
            end_a = reply.find("</action>", start_a)
            action = reply[start_a:end_a].strip()

            if "<response>" in reply and "</response>" in reply:
                start_r = reply.find("<response>", end_a) + len("<response>")
                end_r = reply.find("</response>", start_r)
                response_text = reply[start_r:end_r].strip()
            else:
                response_text = "Null"
        else:
            action = "Null"
            response_text = "Null"

        return {
            "thinking": thinking,
            "action": action,
            "response": response_text
        }

    except Exception as e:
        print(f"Error processing the conversation: {e}")
        return {
            "thinking": "",
            "action": "Error",
            "response": str(e)
        }

