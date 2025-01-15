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
<<<<<<< HEAD
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var mongodb_1 = require("mongodb");
var uuid_1 = require("uuid");
var dotenv_1 = require("dotenv");
var winston_1 = require("winston"); // Usamos winston para logging
var luxon_1 = require("luxon");
var csv_stringify_1 = require("csv-stringify");
var string_decoder_1 = require("string_decoder");
// Configuración de logs con winston
var logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
    ],
});
dotenv_1.default.config();
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuración de MongoDB
var MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
var MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualichat";
// Conexión a MongoDB
var client;
var db;
var chatsCollection;
var chatDetailsCollection;
try {
    client = new mongodb_1.MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    db = client.db(MONGO_DB_NAME);
    chatsCollection = db.collection('chats');
    chatDetailsCollection = db.collection('chat_details');
    logger.info("Conexión a MongoDB exitosa.");
}
catch (e) {
    logger.error("Error al conectar a MongoDB: ".concat(e));
    throw e;
}
// Configuración de Gemini API
var GEMINI_API_KEY = process.env.GEMINI_API_KEY;
var GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
// Configurar Gemini API
// Asegúrate de configurar correctamente la API si se requiere
function generateResponseFromGemini(prompt) {
    try {
        logger.info("Generando respuesta con Gemini para el prompt");
        // Asumimos que existe un modelo similar en la librería TypeScript
        var model = new GenerativeModel(GEMINI_MODEL);
        var response = model.generateContent(prompt);
        if (response.parts) {
            return response.text.trim();
        }
        else {
            logger.error("Respuesta vacía de Gemini");
            return "Error: respuesta vacía";
        }
    }
    catch (e) {
        logger.error("Error al generar respuesta con Gemini: %s", e);
        return "Error al generar respuesta.";
    }
}
function saveChatDetails(chatMessages, chatGroupId, clienteNumero, vendedorNumero) {
    try {
        var chatDetails = chatMessages.map(function (message, index) {
=======
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
>>>>>>> e08085a (Actualizaciones en app.ts, app.js, package.json, package-lock.json y tsconfig.json)
            var _a;
            return ({
                chat_group: chatGroupId,
                sequence: index + 1,
                from: message.from,
<<<<<<< HEAD
                to: message.to || (message.from === clienteNumero ? vendedorNumero : clienteNumero),
                timestamp: message.timestamp || luxon_1.DateTime.utc().toISO(),
                type: message.type || "text",
                body: ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || ""
            });
        });
        if (chatDetails.length > 0) {
            chatDetailsCollection.insertMany(chatDetails);
            logger.info("Detalles del chat guardados exitosamente para el grupo ".concat(chatGroupId));
            return true;
        }
    }
    catch (e) {
        logger.error("Error al guardar detalles del chat: ".concat(e));
        return false;
    }
    return false;
}
function processBooleanResponse(response) {
    response = response.toLowerCase().trim();
    return response.includes('sí') || response.includes('si');
}
function processSentimentResponse(response) {
    response = response.toLowerCase().trim();
    var validSentiments = ['positivo', 'negativo', 'neutral'];
    return validSentiments.includes(response) ? response : 'neutral';
}
function filterMessages(chatMessages, isVendedor) {
    if (isVendedor === void 0) { isVendedor = false; }
    var filteredMessages = chatMessages.filter(function (message) {
        var _a;
        var isFromVendedor = message.from === "vendedor_numero";
        return isVendedor === isFromVendedor && ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body);
    }).map(function (message) { return message.text.body; });
    return filteredMessages.join(" ");
}
function createAnalysisPrompts(vendedorText, clienteText) {
    return {
        greetings: "\n        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 's\u00ED' o 'no' \n        si el VENDEDOR us\u00F3 saludos como \"hola\", \"buenos d\u00EDas\", etc.:\n        ".concat(vendedorText, "\n        "),
        goodbyes: "\n        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 's\u00ED' o 'no' \n        si el VENDEDOR us\u00F3 despedidas como \"adi\u00F3s\", \"hasta luego\", etc.:\n        ".concat(vendedorText, "\n        "),
        sentiment: "\n        Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE en una conversaci\u00F3n con un vendedor.\n        Proporciona un an\u00E1lisis breve enfocado en:\n        1. La actitud del cliente\n        2. Su nivel de satisfacci\u00F3n\n        3. Su disposici\u00F3n en la conversaci\u00F3n\n\n        Se breve y directo.\n\n        Texto a analizar:\n        ".concat(clienteText, "\n        "),
        sentiment_tag: "\n        Para el siguiente texto que contiene SOLO mensajes del CLIENTE, responde SOLO con una de estas palabras \n        bas\u00E1ndote en la actitud del cliente: 'positivo', 'negativo', 'neutral':\n        ".concat(clienteText, "\n        ")
    };
}
app.post("/analyze", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, chatGroupId, countryClientPhoneNumber, clienteNumero, vendedorNumero, chatDetailsSaved, chatMessages, vendedorText, clienteText, prompts, greetingsResponse, goodbyeResponse, sentimentResponse, sentimentTagResponse, greetingsRulePass, goodbyeRulePass, sentimentalTag, chatSummary, insertedId, e_1, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                logger.info("Iniciando análisis de chat.");
                data = req.body;
                if (!data || !data.chat) {
                    logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
                    return [2 /*return*/, res.status(400).json({ error: "Invalid input, 'chat' field is required." })];
                }
                chatGroupId = (0, uuid_1.v4)();
                countryClientPhoneNumber = data.country_client_phone_number || "No especificado";
                clienteNumero = data.cliente_numero || "No especificado";
                vendedorNumero = data.vendedor_numero || "No especificado";
                chatDetailsSaved = saveChatDetails(data.chat, chatGroupId, clienteNumero, vendedorNumero);
                if (!chatDetailsSaved) {
                    return [2 /*return*/, res.status(500).json({ error: "Error saving chat details" })];
                }
                chatMessages = data.chat;
                vendedorText = filterMessages(chatMessages, true);
                clienteText = filterMessages(chatMessages, false);
                if (!vendedorText.trim()) {
                    logger.warning("No se encontraron mensajes del vendedor");
                    return [2 /*return*/, res.status(400).json({ error: "No vendor messages found" })];
                }
                if (!clienteText.trim()) {
                    logger.warning("No se encontraron mensajes del cliente");
                    return [2 /*return*/, res.status(400).json({ error: "No client messages found" })];
                }
                prompts = createAnalysisPrompts(vendedorText, clienteText);
                return [4 /*yield*/, generateResponseFromGemini(prompts.greetings)];
            case 1:
                greetingsResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.goodbyes)];
            case 2:
                goodbyeResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.sentiment)];
            case 3:
                sentimentResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.sentiment_tag)];
            case 4:
                sentimentTagResponse = _a.sent();
                greetingsRulePass = processBooleanResponse(greetingsResponse);
                goodbyeRulePass = processBooleanResponse(goodbyeResponse);
                sentimentalTag = processSentimentResponse(sentimentTagResponse);
                chatSummary = {
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
                            sentiment_tag: sentimentTagResponse
                        }
                    }
                };
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, chatsCollection.insertOne(chatSummary)];
            case 6:
                insertedId = _a.sent();
                chatSummary["_id"] = insertedId.insertedId.toString();
                return [3 /*break*/, 8];
            case 7:
                e_1 = _a.sent();
                logger.error("Error al guardar en MongoDB: ".concat(e_1));
                return [2 /*return*/, res.status(500).json({ error: "Database error", details: e_1.toString() })];
            case 8:
                logger.info("An\u00E1lisis exitoso para el grupo de chat ".concat(chatGroupId));
                return [2 /*return*/, res.json(chatSummary)];
            case 9:
                e_2 = _a.sent();
                logger.error("Error al analizar el chat: ".concat(e_2));
                return [2 /*return*/, res.status(500).json({ error: "Internal server error", details: e_2.toString() })];
            case 10: return [2 /*return*/];
        }
    });
}); });
app.get("/chats", function (req, res) {
    try {
        // Obtener parámetros de paginación
        var page = parseInt(req.query.page) || 1;
        var perPage = parseInt(req.query.per_page) || 10;
        // Calcular el skip
        var skip = (page - 1) * perPage;
        // Obtener total de documentos
        var total = chatsCollection.countDocuments({});
        var chats = chatsCollection.find({})
            .sort({ _id: -1 })
            .skip(skip)
            .limit(perPage)
            .toArray();
        chats.forEach(function (chat) {
            chat['_id'] = chat['_id'].toString();
        });
        return res.json({
            total: total,
            page: page,
            per_page: perPage,
            total_pages: Math.ceil(total / perPage),
            chats: chats
        });
    }
    catch (e) {
        logger.error("Error al obtener chats: ".concat(e));
        return res.status(500).json({ error: "Error al obtener chats" });
    }
});
app.get("/chat_details/:chat_group", function (req, res) {
    var chatGroup = req.params.chat_group;
    try {
        var details = chatDetailsCollection.find({ chat_group: chatGroup }, { projection: { _id: 0 } }).sort({ sequence: 1 }).toArray();
        if (details.length > 0) {
            return res.json({ chat_detail: details });
        }
        return res.status(404).json({ error: "Chat details no encontrados" });
    }
    catch (e) {
        logger.error("Error al obtener detalles del chat ".concat(chatGroup, ": ").concat(e));
        return res.status(500).json({ error: "Error al obtener detalles del chat" });
    }
});
app.get("/chats_by_group/:chat_group", function (req, res) {
    var chatGroup = req.params.chat_group;
    try {
        var chat = chatsCollection.findOne({ 'chat.chat_group': chatGroup });
        if (chat) {
            chat['_id'] = chat['_id'].toString();
            return res.json(chat);
        }
        return res.status(404).json({ error: "Chat no encontrado" });
    }
    catch (e) {
        logger.error("Error al obtener chat ".concat(chatGroup, ": ").concat(e));
        return res.status(500).json({ error: "Error al obtener chat" });
    }
});
// Ruta de health check
app.get("/health", function (req, res) {
    try {
        // Verificar conexión a MongoDB
        client.db().admin().command({ ping: 1 });
        // Verificar API key de Gemini
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no está configurada");
        }
        return res.json({
            status: "healthy",
            mongodb: "connected",
            gemini_api: "configured"
        });
    }
    catch (e) {
        return res.status(500).json({
            status: "unhealthy",
            error: e.toString()
        });
    }
});
app.get("/export/chats", function (req, res) {
    try {
        // Crear un buffer en memoria para el CSV
        var si = new string_decoder_1.StringDecoder('utf8');
        var writer_1 = (0, csv_stringify_1.default)();
        // Escribir encabezados
        var headers = [
            'chat_group',
            'country_client_phone_number',
            'cliente_numero',
            'vendedor_numero',
            'greetings_rule_pass',
            'goodbye_rule_pass',
            'sentimental_tags',
            'rules'
        ];
        writer_1.write(headers);
        // Obtener todos los chats
        var chats = chatsCollection.find({}).toArray();
        // Escribir datos
        chats.forEach(function (chat) {
            var chatData = chat.chat || {};
            var row = [
                chatData.chat_group || '',
                chatData.country_client_phone_number || '',
                chatData.cliente_numero || '',
                chatData.vendedor_numero || '',
                String(chatData.greetings_rule_pass || ''),
                String(chatData.goodbye_rule_pass || ''),
                chatData.sentimental_tags || '',
                chatData.rules || ''
            ];
            writer_1.write(row);
        });
        // Crear la respuesta
        var output = res;
        output.setHeader("Content-Disposition", "attachment; filename=chats_export_".concat(luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
        output.setHeader("Content-type", "text/csv");
        writer_1.pipe(output);
    }
    catch (e) {
        logger.error("Error al exportar chats: ".concat(e));
        return res.status(500).json({ error: "Error al exportar chats" });
    }
});
app.get("/export/chat_details", function (req, res) {
    try {
        // Crear un buffer en memoria para el CSV
        var si = new string_decoder_1.StringDecoder('utf8');
        var writer_2 = (0, csv_stringify_1.default)();
        // Escribir encabezados
        var headers = [
            'chat_group',
            'sequence',
            'from',
            'to',
            'timestamp',
            'type',
            'body'
        ];
        writer_2.write(headers);
        // Obtener todos los detalles de chat
        var chatDetails = chatDetailsCollection.find({}).sort([
            ['chat_group', 1],
            ['sequence', 1]
        ]).toArray();
        // Escribir datos
        chatDetails.forEach(function (detail) {
            var row = [
                detail.chat_group || '',
                String(detail.sequence || ''),
                detail.from || '',
                detail.to || '',
                detail.timestamp || '',
                detail.type || '',
                detail.body || ''
            ];
            writer_2.write(row);
        });
        // Crear la respuesta
        var output = res;
        output.setHeader("Content-Disposition", "attachment; filename=chat_details_export_".concat(luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
        output.setHeader("Content-type", "text/csv");
        writer_2.pipe(output);
    }
    catch (e) {
        logger.error("Error al exportar detalles de chat: ".concat(e));
        return res.status(500).json({ error: "Error al exportar detalles de chat" });
    }
});
// Rutas de exportación y demás código sin cambios significativos
var port = parseInt(process.env.FLASK_RUN_PORT || "5000");
logger.info("Iniciando servidor Express en puerto ".concat(port));
app.listen(port, function () {
    logger.info("Servidor corriendo en puerto ".concat(port));
=======
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
>>>>>>> e08085a (Actualizaciones en app.ts, app.js, package.json, package-lock.json y tsconfig.json)
});
