import express, { Request, Response } from "express";
import cors from "cors";
import { MongoClient, Db, Collection } from "mongodb";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createLogger, format, transports } from "winston";

// Configuración de logs
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => `${timestamp} - ${level}: ${message}`)
  ),
  transports: [new transports.Console()],
});

// Cargar variables de entorno
config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualychatts";
let db: Db, chatsCollection: Collection, chatDetailsCollection: Collection;

const connectMongoDB = async () => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(MONGO_DB_NAME);
    chatsCollection = db.collection("chats");
    chatDetailsCollection = db.collection("chat_details");
    logger.info("Conexión a MongoDB exitosa.");
  } catch (error) {
    logger.error(`Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};

connectMongoDB();

// Configuración de la API de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";

// Simulación de llamada a la API de Gemini
const generateResponseFromGemini = async (prompt: string): Promise<string> => {
  try {
    logger.info("Generando respuesta con Gemini para el prompt");
    // Simulación: Aquí deberías implementar la llamada real a Gemini API
    return `Simulated response for prompt: ${prompt}`;
  } catch (error) {
    logger.error(`Error al generar respuesta con Gemini: ${error}`);
    return "Error al generar respuesta.";
  }
};

// Guardar detalles del chat
const saveChatDetails = async (
  chatMessages: any[],
  chatGroupId: string,
  clienteNumero: string,
  vendedorNumero: string
): Promise<boolean> => {
  try {
    const chatDetails = chatMessages.map((message, index) => ({
      chat_group: chatGroupId,
      sequence: index + 1,
      from: message.from,
      to: message.from === clienteNumero ? vendedorNumero : clienteNumero,
      timestamp: message.timestamp || new Date().toISOString(),
      type: message.type || "text",
      body: message.text?.body || "",
    }));

    if (chatDetails.length > 0) {
      await chatDetailsCollection.insertMany(chatDetails);
      logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
      return true;
    }
  } catch (error) {
    logger.error(`Error al guardar detalles del chat: ${error}`);
    return false;
  }
  return false;
};

// Filtrar mensajes por tipo
const filterMessages = (chatMessages: any[], isVendedor: boolean): string => {
  return chatMessages
    .filter((message) => (isVendedor ? message.from === "vendedor_numero" : message.from !== "vendedor_numero"))
    .map((message) => message.text?.body || "")
    .join(" ");
};

// Crear prompts de análisis
const createAnalysisPrompts = (vendedorText: string, clienteText: string) => ({
  greetings: `Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no': ${vendedorText}`,
  goodbyes: `Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no': ${vendedorText}`,
  sentiment: `Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE: ${clienteText}`,
  sentimentTag: `Responde SOLO con una de estas palabras: 'positivo', 'negativo', 'neutral' para el texto: ${clienteText}`,
});

// Procesar respuesta booleana
const processBooleanResponse = (response: string): boolean => ["sí", "si"].includes(response.toLowerCase().trim());

// Procesar etiqueta de sentimiento
const processSentimentResponse = (response: string): string => {
  const validSentiments = ["positivo", "negativo", "neutral"];
  return validSentiments.includes(response.toLowerCase().trim()) ? response.toLowerCase().trim() : "neutral";
};

// Ruta principal
app.post("/analyze", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || !data.chat) {
      logger.warn("Solicitud inválida, 'chat' es un campo requerido.");
      return res.status(400).json({ error: "'chat' field is required" });
    }

    const chatGroupId = uuidv4();
    const { country_client_phone_number, cliente_numero, vendedor_numero } = data;

    const chatDetailsSaved = await saveChatDetails(data.chat, chatGroupId, cliente_numero, vendedor_numero);
    if (!chatDetailsSaved) {
      return res.status(500).json({ error: "Error saving chat details" });
    }

    const vendedorText = filterMessages(data.chat, true);
    const clienteText = filterMessages(data.chat, false);

    if (!vendedorText.trim() || !clienteText.trim()) {
      return res.status(400).json({ error: "No valid messages found" });
    }

    const prompts = createAnalysisPrompts(vendedorText, clienteText);
    const greetingsResponse = await generateResponseFromGemini(prompts.greetings);
    const goodbyeResponse = await generateResponseFromGemini(prompts.goodbyes);
    const sentimentResponse = await generateResponseFromGemini(prompts.sentiment);
    const sentimentTagResponse = await generateResponseFromGemini(prompts.sentimentTag);

    const chatSummary = {
      chat_group: chatGroupId,
      country_client_phone_number,
      cliente_numero,
      vendedor_numero,
      greetings_rule_pass: processBooleanResponse(greetingsResponse),
      goodbye_rule_pass: processBooleanResponse(goodbyeResponse),
      sentiment_analysis: sentimentResponse,
      sentiment_tags: processSentimentResponse(sentimentTagResponse),
    };

    const insertedId = await chatsCollection.insertOne(chatSummary);
    logger.info(`Análisis exitoso para el grupo de chat ${chatGroupId}`);
    res.json({ _id: insertedId.insertedId, ...chatSummary });
  } catch (error) {
    logger.error(`Error al analizar el chat: ${error}`);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Iniciar el servidor
console.log("Hola desde TypeScript!");

const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
