import { Page } from 'puppeteer';
import { writeFile } from 'node:fs/promises';
import { selectors } from '../constants/selectors';

const { messageSelectors } = selectors;

/**
 * The `responseregex` function analyzes the input text and replaces
 * portions of automated responses (identified by specific prefixes and suffixes)
 * with predefined tags (e.g., "{responseinit1}", "{responsetwo}", or "{docSent}").
 *
 * This enables you to detect automated responses and route them to the appropriate
 * AI model. The automated responses may include variable information (like a product name),
 * so only the fixed prefix and suffix parts are used to identify the response type.
 *
 * Each group in the `groups` array contains:
 *  - prefixes: An array of possible starting phrases for the automated message.
 *  - suffixes: An array of possible ending phrases for the automated message.
 *  - replacement: The tag that will replace the full message once detected.
 *
 * Users can modify or add groups as needed by adjusting the arrays of `prefixes` and `suffixes`
 * and setting the desired `replacement` tag.
 *
 * Additionally, there are specific replacement cases for messages that do not follow the prefix/suffix format.
 *
 * @param text - The input text to be analyzed.
 * @returns The modified text with appropriate tags.
 */
export function responseregex(text: string): string {


    const groups = [
        {
          //Group for "responseinit1": automated initial response to first contact.
          prefixes: [
            "¡Hola! Gracias por tu interés en nuestros productos. Tenemos disponible ",
            "¡Buen día! Agradecemos tu consulta. En este momento ofrecemos "
          ],
          suffixes: [
            " y estamos listos para asesorarte. ¿Nos cuentas cómo te enteraste de nuestra marca?",
            " y estamos a tu disposición para cualquier consulta. ¿Puedes contarnos cómo conociste nuestra empresa?"
          ],
          replacement: "{responseinit1}"
        },
        {
          // Group for "responseinit2": automated initial response to first contact.
          prefixes: [
            "¡Excelente! Notamos que ",
            "Gracias por tu respuesta. Con base en lo que nos comentas, "
          ],
          suffixes: [
            ", ¿prefieres que te llamemos para una asesoría rápida o que te enviemos más información?",
            ", ¿deseas agendar una llamada o que te enviemos detalles adicionales?"
          ],
          replacement: "{responsetwo}"
        },
        {
          // Group for "docSent": response to send DOC
          prefixes: [
            "Te hemos enviado el PDF con la información solicitada. ",
            "Acabamos de enviar el PDF a tu correo. "
          ],
          suffixes: [
            " ¿Te parece bien si te llamamos para resolver cualquier duda?",
            " Por favor, confírmanos si recibiste la información para poder continuar."
          ],
          replacement: "{docSent}"
        }
      ];
      
      
      groups.forEach(({ prefixes, suffixes, replacement }) => {
        for (const prefix of prefixes) {
          for (const suffix of suffixes) {
            if (text.includes(prefix) && text.includes(suffix)) {
              const startIndex = text.indexOf(prefix) + prefix.length;
              const endIndex = text.indexOf(suffix, startIndex);
              if (endIndex !== -1) {
                const extracted = text.substring(startIndex, endIndex).trim();
                const fullText = `${prefix}${extracted}${suffix}`;
                text = text.replace(fullText, replacement);
              }
            }
          }
        }
      });
    


    return text;
}
