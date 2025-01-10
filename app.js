"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("mongodb");
const dotenv_1 = require("dotenv");
const uuid_1 = require("uuid");
const winston_1 = require("winston");
// Configuración de logs
const logger = (0, winston_1.createLogger)({
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level}: ${message}`)),
    transports: [new winston_1.transports.Console()],
});
// Cargar variables de entorno
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualychatts";
let db, chatsCollection, chatDetailsCollection;
const connectMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new mongodb_1.MongoClient(MONGO_URI);
        yield client.connect();
        db = client.db(MONGO_DB_NAME);
        chatsCollection = db.collection("chats");
        chatDetailsCollection = db.collection("chat_details");
        logger.info("Conexión a MongoDB exitosa.");
    }
    catch (error) {
        logger.error(`Error al conectar a MongoDB: ${error}`);
        process.exit(1);
    }
});
connectMongoDB();
// Configuración de la API de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
// Simulación de llamada a la API de Gemini
const generateResponseFromGemini = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info("Generando respuesta con Gemini para el prompt");
        // Simulación: Aquí deberías implementar la llamada real a Gemini API
        return `Simulated response for prompt: ${prompt}`;
    }
    catch (error) {
        logger.error(`Error al generar respuesta con Gemini: ${error}`);
        return "Error al generar respuesta.";
    }
});
// Guardar detalles del chat
const saveChatDetails = (chatMessages, chatGroupId, clienteNumero, vendedorNumero) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatDetails = chatMessages.map((message, index) => {
            var _a;
            return ({
                chat_group: chatGroupId,
                sequence: index + 1,
                from: message.from,
                to: message.from === clienteNumero ? vendedorNumero : clienteNumero,
                timestamp: message.timestamp || new Date().toISOString(),
                type: message.type || "text",
                body: ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || "",
            });
        });
        if (chatDetails.length > 0) {
            yield chatDetailsCollection.insertMany(chatDetails);
            logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
            return true;
        }
    }
    catch (error) {
        logger.error(`Error al guardar detalles del chat: ${error}`);
        return false;
    }
    return false;
});
// Filtrar mensajes por tipo
const filterMessages = (chatMessages, isVendedor) => {
    return chatMessages
        .filter((message) => (isVendedor ? message.from === "vendedor_numero" : message.from !== "vendedor_numero"))
        .map((message) => { var _a; return ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || ""; })
        .join(" ");
};
// Crear prompts de análisis
const createAnalysisPrompts = (vendedorText, clienteText) => ({
    greetings: `Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no': ${vendedorText}`,
    goodbyes: `Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no': ${vendedorText}`,
    sentiment: `Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE: ${clienteText}`,
    sentimentTag: `Responde SOLO con una de estas palabras: 'positivo', 'negativo', 'neutral' para el texto: ${clienteText}`,
});
// Procesar respuesta booleana
const processBooleanResponse = (response) => ["sí", "si"].includes(response.toLowerCase().trim());
// Procesar etiqueta de sentimiento
const processSentimentResponse = (response) => {
    const validSentiments = ["positivo", "negativo", "neutral"];
    return validSentiments.includes(response.toLowerCase().trim()) ? response.toLowerCase().trim() : "neutral";
};
// Ruta principal
app.post("/analyze", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        if (!data || !data.chat) {
            logger.warn("Solicitud inválida, 'chat' es un campo requerido.");
            return res.status(400).json({ error: "'chat' field is required" });
        }
        const chatGroupId = (0, uuid_1.v4)();
        const { country_client_phone_number, cliente_numero, vendedor_numero } = data;
        const chatDetailsSaved = yield saveChatDetails(data.chat, chatGroupId, cliente_numero, vendedor_numero);
        if (!chatDetailsSaved) {
            return res.status(500).json({ error: "Error saving chat details" });
        }
        const vendedorText = filterMessages(data.chat, true);
        const clienteText = filterMessages(data.chat, false);
        if (!vendedorText.trim() || !clienteText.trim()) {
            return res.status(400).json({ error: "No valid messages found" });
        }
        const prompts = createAnalysisPrompts(vendedorText, clienteText);
        const greetingsResponse = yield generateResponseFromGemini(prompts.greetings);
        const goodbyeResponse = yield generateResponseFromGemini(prompts.goodbyes);
        const sentimentResponse = yield generateResponseFromGemini(prompts.sentiment);
        const sentimentTagResponse = yield generateResponseFromGemini(prompts.sentimentTag);
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
        const insertedId = yield chatsCollection.insertOne(chatSummary);
        logger.info(`Análisis exitoso para el grupo de chat ${chatGroupId}`);
        res.json(Object.assign({ _id: insertedId.insertedId }, chatSummary));
    }
    catch (error) {
        logger.error(`Error al analizar el chat: ${error}`);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
}));
// Iniciar el servidor
console.log("Hola desde TypeScript!");
const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
