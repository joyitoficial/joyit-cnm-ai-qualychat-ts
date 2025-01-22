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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("mongodb");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const generative_ai_1 = require("@google/generative-ai");
const winston_1 = require("winston");
const luxon_1 = require("luxon");
const stream_1 = require("stream");
// Configuración de variables de entorno
dotenv_1.default.config();
// Configuración de logs
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)),
    transports: [new winston_1.transports.Console()],
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuración de MongoDB
const MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualichat";
// Conexión a MongoDB
let client;
let chatsCollection;
let chatDetailsCollection;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        client = new mongodb_1.MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        yield client.connect();
        const db = client.db(MONGO_DB_NAME);
        chatsCollection = db.collection('chats');
        chatDetailsCollection = db.collection('chat_details');
        logger.info("Conexión a MongoDB exitosa.");
    }
    catch (e) {
        logger.error(`Error al conectar a MongoDB: ${e}`);
        throw e;
    }
}))();
// Gemini API configuration from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"; // Default to gemini-2.0-flash-exp
const GEMINI_URL = process.env.GEMINI_URL || "https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText";
const GEMINI_URL_API_KEY = `${GEMINI_URL}=${GEMINI_API_KEY}`;
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
const generateResponseFromGemini = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info("Generando respuesta con Gemini para el prompt");
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = yield model.generateContent(prompt);
        const response = yield result.response;
        const text = response.text();
        if (text) {
            return text.trim();
        }
        else {
            logger.error("Respuesta vacía de Gemini");
            return "Error: respuesta vacía";
        }
    }
    catch (e) {
        logger.error(`Error al generar respuesta con Gemini: ${e}`);
        return "Error al generar respuesta.";
    }
});
const saveChatDetails = (chatMessages, chatGroupId, clienteNumero, vendedorNumero) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatDetails = chatMessages.map((message, index) => {
            var _a;
            return {
                chat_group: chatGroupId,
                sequence: index + 1,
                from: message.from,
                to: message.to || (message.from === clienteNumero ? vendedorNumero : clienteNumero),
                timestamp: message.timestamp || luxon_1.DateTime.utc().toISO(),
                type: message.type || "text",
                body: ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || "",
            };
        });
        if (chatDetails.length) {
            yield chatDetailsCollection.insertMany(chatDetails);
            logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
            return true;
        }
        return false;
    }
    catch (e) {
        logger.error(`Error al guardar detalles del chat: ${e}`);
        return false;
    }
});
const processBooleanResponse = (response) => {
    response = response.toLowerCase().trim();
    return response.includes("sí") || response.includes("si");
};
const processSentimentResponse = (response) => {
    response = response.toLowerCase().trim();
    const validSentiments = ["positivo", "negativo", "neutral"];
    return validSentiments.includes(response) ? response : "neutral";
};
const filterMessages = (chatMessages, isVendedor = false) => {
    return chatMessages
        .filter((message) => {
        var _a;
        const isFromVendedor = message.from === "vendedor_numero";
        return isVendedor === isFromVendedor && typeof ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) === "string";
    })
        .map((message) => message.text.body)
        .join(" ");
};
const createAnalysisPrompts = (vendedorText, clienteText) => {
    return {
        greetings: `
        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no' 
        si el VENDEDOR usó saludos como "hola", "buenos días", etc.:
        ${vendedorText}
        `,
        goodbyes: `
        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no' 
        si el VENDEDOR usó despedidas como "adiós", "hasta luego", etc.:
        ${vendedorText}
        `,
        sentiment: `
        Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE en una conversación con un vendedor.
        Proporciona un análisis breve enfocado en:
        1. La actitud del cliente
        2. Su nivel de satisfacción
        3. Su disposición en la conversación

        Se breve y directo.

        Texto a analizar:
        ${clienteText}
        `,
        sentimentTag: `
        Para el siguiente texto que contiene SOLO mensajes del CLIENTE, responde SOLO con una de estas palabras 
        basándote en la actitud del cliente: 'positivo', 'negativo', 'neutral':
        ${clienteText}
        `,
    };
};
// Endpoint POST /analyze
app.post("/analyze", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info("Iniciando análisis de chat.");
        const data = req.body;
        if (!data || !data.chat) {
            logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
            return res.status(400).json({ error: "Invalid input, 'chat' field is required." });
        }
        const chatGroupId = (0, uuid_1.v4)();
        const countryClientPhoneNumber = data.country_client_phone_number || "No especificado";
        const clienteNumero = data.cliente_numero || "No especificado";
        const vendedorNumero = data.vendedor_numero || "No especificado";
        // Guardar detalles del chat
        const chatDetailsSaved = yield saveChatDetails(data.chat, chatGroupId, clienteNumero, vendedorNumero);
        if (!chatDetailsSaved) {
            return res.status(500).json({ error: "Error saving chat details" });
        }
        // Filtrar mensajes por tipo usando el nuevo formato
        const chatMessages = data.chat;
        const vendedorText = filterMessages(chatMessages, true);
        const clienteText = filterMessages(chatMessages, false);
        if (!vendedorText.trim()) {
            logger.warning("No se encontraron mensajes del vendedor");
            return res.status(400).json({ error: "No vendor messages found" });
        }
        if (!clienteText.trim()) {
            logger.warning("No se encontraron mensajes del cliente");
            return res.status(400).json({ error: "No client messages found" });
        }
        const prompts = createAnalysisPrompts(vendedorText, clienteText);
        const greetingsResponse = yield generateResponseFromGemini(prompts.greetings);
        const goodbyeResponse = yield generateResponseFromGemini(prompts.goodbyes);
        const sentimentResponse = yield generateResponseFromGemini(prompts.sentiment);
        const sentimentTagResponse = yield generateResponseFromGemini(prompts.sentimentTag);
        const greetingsRulePass = processBooleanResponse(greetingsResponse);
        const goodbyeRulePass = processBooleanResponse(goodbyeResponse);
        const sentimentalTag = processSentimentResponse(sentimentTagResponse);
        // Crear y guardar el resumen del chat
        const chatSummary = {
            chat: {
                chat_group: chatGroupId,
                country_client_phone_number: countryClientPhoneNumber,
                cliente_numero: clienteNumero,
                vendedor_numero: vendedorNumero,
                greetings_rule_pass: greetingsRulePass,
                goodbye_rule_pass: goodbyeRulePass,
                sentimental_analysis: sentimentResponse,
                sentimental_tags: sentimentalTag,
                rules: "greetings",
                raw_responses: {
                    greetings: greetingsResponse,
                    goodbyes: goodbyeResponse,
                    sentiment: sentimentResponse,
                    sentiment_tag: sentimentTagResponse,
                },
            },
        };
        try {
            const result = yield chatsCollection.insertOne(chatSummary);
            chatSummary.chat["_id"] = result.insertedId.toString();
        }
        catch (e) {
            logger.error(`Error al guardar en MongoDB: ${e}`);
            return res.status(500).json({ error: "Database error", details: e.toString() });
        }
        logger.info(`Análisis exitoso para el grupo de chat ${chatGroupId}`);
        return res.json(chatSummary);
    }
    catch (e) {
        logger.error(`Error al analizar el chat: ${e}`);
        return res.status(500).json({ error: "Internal server error", details: e.toString() });
    }
}));
// Endpoint GET /chats
app.get("/chats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        // Calcular el skip
        const skip = (page - 1) * perPage;
        // Obtener total de documentos
        const total = yield chatsCollection.countDocuments({});
        const chats = yield chatsCollection.find({})
            .sort({ _id: -1 })
            .skip(skip)
            .limit(perPage)
            .toArray();
        // Convertir _id a string
        chats.forEach((chat) => {
            chat._id = chat._id.toString();
        });
        return res.json({
            total,
            page,
            per_page: perPage,
            total_pages: Math.ceil(total / perPage),
            chats,
        });
    }
    catch (e) {
        logger.error(`Error al obtener chats: ${e}`);
        return res.status(500).json({ error: "Error al obtener chats" });
    }
}));
// Endpoint GET /chat_details/:chat_group
app.get("/chat_details/:chat_group", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatGroup = req.params.chat_group;
        const details = yield chatDetailsCollection.find({ chat_group: chatGroup }, { projection: { _id: 0 } }).sort({ sequence: 1 }).toArray();
        if (details.length > 0) {
            return res.json({ chat_detail: details });
        }
        return res.status(404).json({ error: "Chat details no encontrados" });
    }
    catch (e) {
        logger.error(`Error al obtener detalles del chat ${req.params.chat_group}: ${e}`);
        return res.status(500).json({ error: "Error al obtener detalles del chat" });
    }
}));
// Endpoint GET /chats_by_group/:chat_group
app.get("/chats_by_group/:chat_group", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatGroup = req.params.chat_group;
        const chat = yield chatsCollection.findOne({ 'chat.chat_group': chatGroup });
        if (chat) {
            chat._id = chat._id.toString();
            return res.json(chat);
        }
        return res.status(404).json({ error: "Chat no encontrado" });
    }
    catch (e) {
        logger.error(`Error al obtener chat ${req.params.chat_group}: ${e}`);
        return res.status(500).json({ error: "Error al obtener chat" });
    }
}));
// Endpoint GET /health
app.get("/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar conexión a MongoDB
        yield client.db().admin().command({ ping: 1 });
        // Verificar API key de Gemini
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no está configurada");
        }
        return res.json({
            status: "healthy",
            mongodb: "connected",
            gemini_api: "configured",
        });
    }
    catch (e) {
        return res.status(500).json({
            status: "unhealthy",
            error: e.toString(),
        });
    }
}));
// Endpoint GET /export/chats
app.get("/export/chats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chats = yield chatsCollection.find({}).toArray();
        const headers = [
            'chat_group',
            'country_client_phone_number',
            'cliente_numero',
            'vendedor_numero',
            'greetings_rule_pass',
            'goodbye_rule_pass',
            'sentimental_tags',
            'rules',
        ];
        const data = chats.map((chat) => {
            const chatData = chat.chat || {};
            return [
                chatData.chat_group || '',
                chatData.country_client_phone_number || '',
                chatData.cliente_numero || '',
                chatData.vendedor_numero || '',
                String(chatData.greetings_rule_pass || ''),
                String(chatData.goodbye_rule_pass || ''),
                chatData.sentimental_tags || '',
                chatData.rules || '',
            ];
        });
        const csvStream = new stream_1.Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach((row) => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);
        res.setHeader("Content-Disposition", `attachment; filename=chats_export_${luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);
    }
    catch (e) {
        logger.error(`Error al exportar chats: ${e}`);
        return res.status(500).json({ error: "Error al exportar chats" });
    }
}));
// Endpoint GET /export/chat_details
app.get("/export/chat_details", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatDetails = yield chatDetailsCollection.find({}).sort({ chat_group: 1, sequence: 1 }).toArray();
        const headers = [
            'chat_group',
            'sequence',
            'from',
            'to',
            'timestamp',
            'type',
            'body',
        ];
        const data = chatDetails.map((detail) => [
            detail.chat_group || '',
            String(detail.sequence || ''),
            detail.from || '',
            detail.to || '',
            detail.timestamp || '',
            detail.type || '',
            detail.body || '',
        ]);
        const csvStream = new stream_1.Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach((row) => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);
        res.setHeader("Content-Disposition", `attachment; filename=chat_details_export_${luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);
    }
    catch (e) {
        logger.error(`Error al exportar detalles de chat: ${e}`);
        return res.status(500).json({ error: "Error al exportar detalles de chat" });
    }
}));
// Iniciar el servidor
const port = parseInt(process.env.PORT || '5000');
const debug = ((_a = process.env.DEBUG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true";
logger.info(`Iniciando servidor Express en puerto ${port} con debug=${debug}`);
app.listen(port, () => {
    logger.info(`Servidor corriendo en puerto ${port}`);
});
