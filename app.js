var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var _a;
var _this = this;
var express = require('express');
var _b = require('express'), Request = _b.Request, Response = _b.Response;
var cors = require('cors');
var MongoClient = require('mongodb').MongoClient;
var uuidv4 = require('uuid').v4;
require('dotenv').config(); // Cargar las variables de entorno
var axios = require('axios'); // Reemplaza google-generativeai con axios
var _c = require('winston'), createLogger = _c.createLogger, format = _c.format, transports = _c.transports;
var DateTime = require('luxon').DateTime;
var csv = require('csv-stringify');
var Readable = require('stream').Readable;
// Logger configuration
var logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message;
        return "".concat(timestamp, " - ").concat(level.toUpperCase(), " - ").concat(message);
    })),
    transports: [new transports.Console()]
});
var app = express();
app.use(cors());
app.use(express.json());
// Logger configuration
var logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message;
        return "".concat(timestamp, " - ").concat(level.toUpperCase(), " - ").concat(message);
    })),
    transports: [new transports.Console()]
});
var app = express();
app.use(cors());
app.use(express.json());
// MongoDB configuration
var MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
var MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualichat";
// MongoDB connection
var client;
var chatsCollection;
var chatDetailsCollection;
(function () { return __awaiter(_this, void 0, void 0, function () {
    var db, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
                return [4 /*yield*/, client.connect()];
            case 1:
                _a.sent();
                db = client.db(MONGO_DB_NAME);
                chatsCollection = db.collection('chats');
                chatDetailsCollection = db.collection('chat_details');
                logger.info("Conexión a MongoDB exitosa.");
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                logger.error("Error al conectar a MongoDB: ".concat(e_1));
                throw e_1;
            case 3: return [2 /*return*/];
        }
    });
}); })();
// Gemini API configuration from .env
var GEMINI_API_KEY = process.env.GEMINI_API_KEY;
var GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"; // Default to gemini-2.0-flash-exp
var GEMINI_URL = process.env.GEMINI_URL || "https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText";
// Axios function to call Gemini API
function generateResponseFromGemini(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var response, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    logger.info("Generando respuesta con Gemini para el prompt");
                    // Verifica si el GEMINI_API_KEY está presente
                    if (!GEMINI_API_KEY) {
                        throw new Error("API key no configurada en el archivo .env");
                    }
                    return [4 /*yield*/, axios.post(GEMINI_URL, // URL del endpoint de Gemini
                        {
                            prompt: prompt, // El contenido del prompt que estás pasando
                            temperature: 0.7, // Control de la creatividad de la respuesta (opcional)
                            max_output_tokens: 200, // Control del número máximo de tokens en la respuesta (opcional)
                            model: GEMINI_MODEL // El modelo específico de Gemini que deseas usar
                        }, {
                            headers: {
                                'Authorization': "Bearer ".concat(GEMINI_API_KEY), // Autenticación de la API
                                'Content-Type': 'application/json' // Tipo de contenido JSON
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (response.data && response.data.text) {
                        return [2 /*return*/, response.data.text.trim()]; // Devuelve el texto de la respuesta generada
                    }
                    else {
                        logger.error("Respuesta vacía de Gemini");
                        return [2 /*return*/, "Error: respuesta vacía"];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    logger.error("Error al generar respuesta con Gemini: %s", e_2);
                    return [2 /*return*/, "Error al generar respuesta."];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveChatDetails(chatMessages, chatGroupId, clienteNumero, vendedorNumero) {
    return __awaiter(this, void 0, void 0, function () {
        var chatDetails, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    chatDetails = chatMessages.map(function (message, index) {
                        var _a;
                        return ({
                            chat_group: chatGroupId,
                            sequence: index + 1,
                            from: message.from,
                            to: message.to || (message.from === clienteNumero ? vendedorNumero : clienteNumero),
                            timestamp: message.timestamp || DateTime.utc().toISO(),
                            type: message.type || "text",
                            body: ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || ""
                        });
                    });
                    if (!(chatDetails.length > 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, chatDetailsCollection.insertMany(chatDetails)];
                case 1:
                    _a.sent();
                    logger.info("Detalles del chat guardados exitosamente para el grupo ".concat(chatGroupId));
                    return [2 /*return*/, true];
                case 2: return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    logger.error("Error al guardar detalles del chat: ".concat(e_3));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/, false];
            }
        });
    });
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
    var filteredMessages = chatMessages
        .filter(function (message) { return (isVendedor ? message.from === "vendedor_numero" : message.from !== "vendedor_numero"); })
        .map(function (message) { var _a; return ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || ""; })
        .filter(function (text) { return text; });
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
app.post("/analyze", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var data, chatGroupId, countryClientPhoneNumber, clienteNumero, vendedorNumero, chatDetailsSaved, chatMessages, vendedorText, clienteText, prompts, greetingsResponse, goodbyeResponse, sentimentResponse, sentimentTagResponse, greetingsRulePass, goodbyeRulePass, sentimentalTag, chatSummary, result, e_4, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                logger.info("Iniciando análisis de chat.");
                data = req.body;
                if (!data || !data.chat) {
                    logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
                    return [2 /*return*/, res.status(400).json({ error: "Invalid input, 'chat' field is required." })];
                }
                chatGroupId = uuidv4();
                countryClientPhoneNumber = data.country_client_phone_number || "No especificado";
                clienteNumero = data.cliente_numero || "No especificado";
                vendedorNumero = data.vendedor_numero || "No especificado";
                return [4 /*yield*/, saveChatDetails(data.chat, chatGroupId, clienteNumero, vendedorNumero)];
            case 1:
                chatDetailsSaved = _a.sent();
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
            case 2:
                greetingsResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.goodbyes)];
            case 3:
                goodbyeResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.sentiment)];
            case 4:
                sentimentResponse = _a.sent();
                return [4 /*yield*/, generateResponseFromGemini(prompts.sentiment_tag)];
            case 5:
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
                _a.label = 6;
            case 6:
                _a.trys.push([6, 8, , 9]);
                return [4 /*yield*/, chatsCollection.insertOne(chatSummary)];
            case 7:
                result = _a.sent();
                chatSummary.chat["_id"] = result.insertedId.toString();
                return [3 /*break*/, 9];
            case 8:
                e_4 = _a.sent();
                logger.error("Error al guardar en MongoDB: ".concat(e_4));
                return [2 /*return*/, res.status(500).json({ error: "Database error", details: e_4.toString() })];
            case 9:
                logger.info("An\u00E1lisis exitoso para el grupo de chat ".concat(chatGroupId));
                return [2 /*return*/, res.json(chatSummary)];
            case 10:
                e_5 = _a.sent();
                logger.error("Error al analizar el chat: ".concat(e_5));
                return [2 /*return*/, res.status(500).json({ error: "Internal server error", details: e_5.toString() })];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.get("/chats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var page, perPage, skip, total, chats, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                perPage = parseInt(req.query.per_page) || 10;
                skip = (page - 1) * perPage;
                return [4 /*yield*/, chatsCollection.countDocuments({})];
            case 1:
                total = _a.sent();
                return [4 /*yield*/, chatsCollection.find({})
                        .sort({ '_id': -1 })
                        .skip(skip)
                        .limit(perPage)
                        .toArray()];
            case 2:
                chats = _a.sent();
                chats.forEach(function (chat) {
                    chat['_id'] = chat['_id'].toString();
                });
                return [2 /*return*/, res.json({
                        total: total,
                        page: page,
                        per_page: perPage,
                        total_pages: Math.ceil(total / perPage),
                        chats: chats
                    })];
            case 3:
                e_6 = _a.sent();
                logger.error("Error al obtener chats: ".concat(e_6));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener chats" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/chat_details/:chat_group", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var chatGroup, details, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                chatGroup = req.params.chat_group;
                return [4 /*yield*/, chatDetailsCollection.find({ chat_group: chatGroup }, { projection: { _id: 0 } }).sort({ sequence: 1 }).toArray()];
            case 1:
                details = _a.sent();
                if (details.length > 0) {
                    return [2 /*return*/, res.json({ chat_detail: details })];
                }
                return [2 /*return*/, res.status(404).json({ error: "Chat details no encontrados" })];
            case 2:
                e_7 = _a.sent();
                logger.error("Error al obtener detalles del chat ".concat(req.params.chat_group, ": ").concat(e_7));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener detalles del chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/chats_by_group/:chat_group", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var chatGroup, chat, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                chatGroup = req.params.chat_group;
                return [4 /*yield*/, chatsCollection.findOne({ 'chat.chat_group': chatGroup })];
            case 1:
                chat = _a.sent();
                if (chat) {
                    chat['_id'] = chat['_id'].toString();
                    return [2 /*return*/, res.json(chat)];
                }
                return [2 /*return*/, res.status(404).json({ error: "Chat no encontrado" })];
            case 2:
                e_8 = _a.sent();
                logger.error("Error al obtener chat ".concat(req.params.chat_group, ": ").concat(e_8));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/health", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Verificar conexión a MongoDB
                return [4 /*yield*/, client.db().admin().command({ ping: 1 })];
            case 1:
                // Verificar conexión a MongoDB
                _a.sent();
                // Verificar API key de Gemini
                if (!GEMINI_API_KEY) {
                    throw new Error("GEMINI_API_KEY no está configurada");
                }
                return [2 /*return*/, res.json({
                        status: "healthy",
                        mongodb: "connected",
                        gemini_api: "configured"
                    })];
            case 2:
                e_9 = _a.sent();
                return [2 /*return*/, res.status(500).json({
                        status: "unhealthy",
                        error: e_9.toString()
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/export/chats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var chats, headers, data, csvStream_1, e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, chatsCollection.find({}).toArray()];
            case 1:
                chats = _a.sent();
                headers = [
                    'chat_group',
                    'country_client_phone_number',
                    'cliente_numero',
                    'vendedor_numero',
                    'greetings_rule_pass',
                    'goodbye_rule_pass',
                    'sentimental_tags',
                    'rules'
                ];
                data = chats.map(function (chat) {
                    var chatData = chat.chat || {};
                    return [
                        chatData.chat_group || '',
                        chatData.country_client_phone_number || '',
                        chatData.cliente_numero || '',
                        chatData.vendedor_numero || '',
                        String(chatData.greetings_rule_pass || ''),
                        String(chatData.goodbye_rule_pass || ''),
                        chatData.sentimental_tags || '',
                        chatData.rules || ''
                    ];
                });
                csvStream_1 = new Readable();
                csvStream_1._read = function () { };
                csvStream_1.push(headers.join(',') + '\n');
                data.forEach(function (row) { return csvStream_1.push(row.join(',') + '\n'); });
                csvStream_1.push(null);
                res.setHeader("Content-Disposition", "attachment; filename=chats_export_".concat(DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
                res.setHeader("Content-type", "text/csv");
                csvStream_1.pipe(res);
                return [3 /*break*/, 3];
            case 2:
                e_10 = _a.sent();
                logger.error("Error al exportar chats: ".concat(e_10));
                return [2 /*return*/, res.status(500).json({ error: "Error al exportar chats" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/export/chat_details", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var chatDetails, headers, data, csvStream_2, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, chatDetailsCollection.find({}).sort({ chat_group: 1, sequence: 1 }).toArray()];
            case 1:
                chatDetails = _a.sent();
                headers = [
                    'chat_group',
                    'sequence',
                    'from',
                    'to',
                    'timestamp',
                    'type',
                    'body'
                ];
                data = chatDetails.map(function (detail) { return [
                    detail.chat_group || '',
                    String(detail.sequence || ''),
                    detail.from || '',
                    detail.to || '',
                    detail.timestamp || '',
                    detail.type || '',
                    detail.body || ''
                ]; });
                csvStream_2 = new Readable();
                csvStream_2._read = function () { };
                csvStream_2.push(headers.join(',') + '\n');
                data.forEach(function (row) { return csvStream_2.push(row.join(',') + '\n'); });
                csvStream_2.push(null);
                res.setHeader("Content-Disposition", "attachment; filename=chat_details_export_".concat(DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
                res.setHeader("Content-type", "text/csv");
                csvStream_2.pipe(res);
                return [3 /*break*/, 3];
            case 2:
                e_11 = _a.sent();
                logger.error("Error al exportar detalles de chat: ".concat(e_11));
                return [2 /*return*/, res.status(500).json({ error: "Error al exportar detalles de chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
var port = parseInt(process.env.FLASK_RUN_PORT || '5000');
var debug = ((_a = process.env.FLASK_DEBUG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true";
logger.info("Iniciando servidor Express en puerto ".concat(port, " con debug=").concat(debug));
app.listen(port, function () {
    logger.info("Servidor corriendo en puerto ".concat(port));
});
