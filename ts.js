"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var mongodb_1 = require("mongodb");
var uuid_1 = require("uuid");
var dotenv_1 = require("dotenv");
var winston_1 = require("winston");
var luxon_1 = require("luxon");
var stream_1 = require("stream");
var gpt_tokenizer_1 = require("gpt-tokenizer");
var openai_1 = require("openai");
// Configuración de OpenAI
var configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Asegúrate de tener esta variable en tu .env
});
var openai = new openai_1.OpenAIApi(configuration);
// Configuración de variables de entorno
dotenv_1.default.config();
// Configuración de logs
var logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message;
        return "".concat(timestamp, " - ").concat(level.toUpperCase(), " - ").concat(message);
    })),
    transports: [new winston_1.transports.Console()],
});
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configuración de MongoDB
var MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:BHCdmAZGTDFcV04l@cluster0.v1vxy.mongodb.net/";
var MONGO_DB_NAME = "Qualychat"; // Nombre de la base de datos
// Conexión a MongoDB
var client;
var db;
var chatsCollection;
var chatDetailsCollection;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                client = new mongodb_1.MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
                return [4 /*yield*/, client.connect()];
            case 1:
                _a.sent(); // Conectar al servidor de MongoDB
                db = client.db(MONGO_DB_NAME); // Seleccionar la base de datos
                chatsCollection = db.collection('chats'); // Seleccionar la colección de resúmenes
                chatDetailsCollection = db.collection('chat_details'); // Seleccionar la colección de detalles
                logger.info("Conexión a MongoDB exitosa.");
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                logger.error("Error al conectar a MongoDB: ".concat(e_1));
                throw e_1; // Relanzar la excepción para manejo externo
            case 3: return [2 /*return*/];
        }
    });
}); })();
// Función para guardar un resumen de chat
function saveChatSummary(chatSummary) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, chatsCollection.insertOne(chatSummary)];
                case 1:
                    result = _a.sent();
                    logger.info("Resumen de chat guardado con ID: ".concat(result.insertedId));
                    return [2 /*return*/, result.insertedId.toString()]; // Retornar el ID del documento insertado
                case 2:
                    e_2 = _a.sent();
                    logger.error("Error al guardar el resumen de chat: ".concat(e_2));
                    throw e_2; // Relanzar la excepción para manejo externo
                case 3: return [2 /*return*/];
            }
        });
    });
}
var generateResponseFromOpenAI = function (prompt) { return __awaiter(void 0, void 0, void 0, function () {
    var response, text, e_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                logger.info("Generando respuesta con OpenAI para el prompt");
                return [4 /*yield*/, openai.createCompletion({
                        model: "text-davinci-003", // Puedes cambiar el modelo según tus necesidades
                        prompt: prompt,
                        max_tokens: 150, // Ajusta según sea necesario
                        temperature: 0.7, // Ajusta según sea necesario
                    })];
            case 1:
                response = _b.sent();
                text = (_a = response.data.choices[0].text) === null || _a === void 0 ? void 0 : _a.trim();
                if (text) {
                    return [2 /*return*/, text];
                }
                else {
                    logger.error("Respuesta vacía de OpenAI");
                    return [2 /*return*/, "Error: respuesta vacía"];
                }
                return [3 /*break*/, 3];
            case 2:
                e_3 = _b.sent();
                logger.error("Error al generar respuesta con OpenAI: ".concat(e_3));
                return [2 /*return*/, "Error al generar respuesta."];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Función para guardar detalles del chat
var saveChatDetails = function (chatMessages, chatGroupId, clienteNumero, vendedorNumero) { return __awaiter(void 0, void 0, void 0, function () {
    var chatDetails, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                chatDetails = chatMessages.map(function (message, index) {
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
                if (!chatDetails.length) return [3 /*break*/, 2];
                return [4 /*yield*/, chatDetailsCollection.insertMany(chatDetails)];
            case 1:
                _a.sent(); // Insertar los detalles del chat
                logger.info("Detalles del chat guardados exitosamente para el grupo ".concat(chatGroupId));
                return [2 /*return*/, true];
            case 2: return [2 /*return*/, false];
            case 3:
                e_4 = _a.sent();
                logger.error("Error al guardar detalles del chat: ".concat(e_4));
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
var processBooleanResponse = function (response) {
    response = response.toLowerCase().trim();
    return response.includes("sí") || response.includes("si");
};
var processSentimentResponse = function (response) {
    response = response.toLowerCase().trim();
    var validSentiments = ["positivo", "negativo", "neutral"];
    return validSentiments.includes(response) ? response : "neutral";
};
var filterMessages = function (chatMessages, isVendedor) {
    if (isVendedor === void 0) { isVendedor = false; }
    return chatMessages
        .filter(function (message) {
        var _a;
        var isFromVendedor = message.from === "vendedor_numero";
        return isVendedor === isFromVendedor && typeof ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) === "string";
    })
        .map(function (message) { return message.text.body; })
        .join(" ");
};
// Función para contar tokens
var countTokens = function (text) {
    return (0, gpt_tokenizer_1.encode)(text).length;
};
var calculateDuration = function (startTime, endTime) {
    var start = new Date(startTime); // Convertir a objeto Date
    var end = new Date(endTime); // Convertir a objeto Date
    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Formato de fecha inválido.");
    }
    var differenceInMilliseconds = end.getTime() - start.getTime(); // Diferencia en milisegundos
    return differenceInMilliseconds.toString(); // Devolver la duración en milisegundos como cadena
};
var createAnalysisPrompts = function (vendedorText, clienteText) {
    return {
        greetings: "\n        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 's\u00ED' o 'no' \n        si el VENDEDOR us\u00F3 saludos como \"hola\", \"buenos d\u00EDas\", etc.:\n        ".concat(vendedorText, "\n        "),
        goodbyes: "\n        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 's\u00ED' o 'no' \n        si el VENDEDOR us\u00F3 despedidas como \"adi\u00F3s\", \"hasta luego\", etc.:\n        ".concat(vendedorText, "\n        "),
        sentiment: "\n        Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE en una conversaci\u00F3n con un vendedor.\n        Proporciona un an\u00E1lisis breve enfocado en:\n        1. La actitud del cliente\n        2. Su nivel de satisfacci\u00F3n\n        3. Su disposici\u00F3n en la conversaci\u00F3n\n\n        Se breve y directo.\n\n        Texto a analizar:\n        ".concat(clienteText, "\n        "),
        sentimentTag: "\n        Para el siguiente texto que contiene SOLO mensajes del CLIENTE, responde SOLO con una de estas palabras \n        bas\u00E1ndote en la actitud del cliente: 'positivo', 'negativo', 'neutral':\n        ".concat(clienteText, "\n        "),
        problemResolution: "\n        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 's\u00ED' o 'no' \n        si el VENDEDOR resolvi\u00F3 el problema del cliente de manera efectiva. Considera lo siguiente:\n        1. \u00BFEl vendedor proporcion\u00F3 una soluci\u00F3n clara y espec\u00EDfica?\n        2. \u00BFEl cliente mostr\u00F3 satisfacci\u00F3n con la soluci\u00F3n?\n        3. \u00BFEl vendedor sigui\u00F3 un proceso l\u00F3gico para resolver el problema?\n\n        Texto a analizar:\n        ".concat(vendedorText, "\n        "),
    };
};
app.post("/analyze", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, chatGroupId, analysisChatGroupId, _a, country_client_phone_number, _b, cliente_numero, _c, vendedor_numero, _d, client_name, _e, assistance, _f, start_time, _g, end_time, durationInMilliseconds, durationInSeconds, chatDetailsSaved, chatMessages, vendedorText, clienteText, prompts, greetingsResponse, goodbyeResponse, sentimentResponse, sentimentTagResponse, problemResolutionResponse, inputTokens, outputTokens, totalTokens, greetingsRulePass, goodbyeRulePass, sentimentalTag, problemResolved, formatTextResponse, greetingsText, goodbyeText, problemResolutionText, chatSummary, result, e_5, e_6;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 11, , 12]);
                logger.info("Iniciando análisis de chat.");
                data = req.body;
                if (!data || !data.chat) {
                    logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
                    return [2 /*return*/, res.status(400).json({ error: "Invalid input, 'chat' field is required." })];
                }
                chatGroupId = (0, uuid_1.v4)();
                analysisChatGroupId = (0, uuid_1.v4)();
                _a = data.country_client_phone_number, country_client_phone_number = _a === void 0 ? "No especificado" : _a, _b = data.cliente_numero, cliente_numero = _b === void 0 ? "No especificado" : _b, _c = data.vendedor_numero, vendedor_numero = _c === void 0 ? "No especificado" : _c, _d = data.client_name, client_name = _d === void 0 ? "No especificado" : _d, _e = data.assistance, assistance = _e === void 0 ? "No especificado" : _e, _f = data.start_time, start_time = _f === void 0 ? new Date().toISOString() : _f, _g = data.end_time, end_time = _g === void 0 ? new Date().toISOString() : _g;
                durationInMilliseconds = "0";
                try {
                    durationInMilliseconds = calculateDuration(start_time, end_time);
                }
                catch (e) {
                    logger.error("Error al calcular la duraci\u00F3n: ".concat(e));
                    return [2 /*return*/, res.status(400).json({ error: "Invalid date format", details: e.toString() })];
                }
                durationInSeconds = (parseInt(durationInMilliseconds) / 1000).toFixed(2);
                return [4 /*yield*/, saveChatDetails(data.chat, chatGroupId, cliente_numero, vendedor_numero)];
            case 1:
                chatDetailsSaved = _h.sent();
                if (!chatDetailsSaved) {
                    logger.error("Error al guardar los detalles del chat.");
                    return [2 /*return*/, res.status(500).json({ error: "Error saving chat details" })];
                }
                chatMessages = data.chat;
                vendedorText = filterMessages(chatMessages, true);
                clienteText = filterMessages(chatMessages, false);
                if (!vendedorText.trim()) {
                    logger.warning("No se encontraron mensajes del vendedor.");
                    return [2 /*return*/, res.status(400).json({ error: "No vendor messages found" })];
                }
                if (!clienteText.trim()) {
                    logger.warning("No se encontraron mensajes del cliente.");
                    return [2 /*return*/, res.status(400).json({ error: "No client messages found" })];
                }
                prompts = createAnalysisPrompts(vendedorText, clienteText);
                return [4 /*yield*/, generateResponseFromOpenAI(prompts.greetings)];
            case 2:
                greetingsResponse = _h.sent();
                return [4 /*yield*/, generateResponseFromOpenAI(prompts.goodbyes)];
            case 3:
                goodbyeResponse = _h.sent();
                return [4 /*yield*/, generateResponseFromOpenAI(prompts.sentiment)];
            case 4:
                sentimentResponse = _h.sent();
                return [4 /*yield*/, generateResponseFromOpenAI(prompts.sentimentTag)];
            case 5:
                sentimentTagResponse = _h.sent();
                return [4 /*yield*/, generateResponseFromOpenAI(prompts.problemResolution)];
            case 6:
                problemResolutionResponse = _h.sent();
                inputTokens = countTokens(vendedorText + clienteText);
                outputTokens = countTokens(greetingsResponse + goodbyeResponse + sentimentResponse + sentimentTagResponse + problemResolutionResponse);
                totalTokens = inputTokens + outputTokens;
                greetingsRulePass = processBooleanResponse(greetingsResponse);
                goodbyeRulePass = processBooleanResponse(goodbyeResponse);
                sentimentalTag = processSentimentResponse(sentimentTagResponse);
                problemResolved = processBooleanResponse(problemResolutionResponse);
                formatTextResponse = function (response) {
                    return response.toLowerCase().includes("yes") || response.toLowerCase().includes("sí") ? "sí" : "no";
                };
                greetingsText = formatTextResponse(greetingsResponse);
                goodbyeText = formatTextResponse(goodbyeResponse);
                problemResolutionText = formatTextResponse(problemResolutionResponse);
                chatSummary = {
                    chat_group: chatGroupId,
                    analysis_chat_group: analysisChatGroupId,
                    cliente_name: client_name,
                    cliente_phone_number: country_client_phone_number,
                    cliente_numero: cliente_numero,
                    vendedor_numero: vendedor_numero,
                    assistance: assistance,
                    start_time: start_time,
                    end_time: end_time,
                    duration: durationInSeconds,
                    analysis_greetings_rule_pass: greetingsRulePass,
                    analysis_goodbye_rule_pass: goodbyeRulePass,
                    sentimental_analysis: sentimentResponse,
                    analysis_sentimental_analysis: sentimentalTag,
                    analysis_resolved_problem: problemResolved,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    total_tokens: totalTokens,
                    created_at: new Date().toISOString(),
                    rules: "greetings",
                    raw_responses_analysis_greetings_rule_pass: greetingsText,
                    raw_responses_analysis_goodbye_rule_pass: goodbyeText,
                    raw_responses_greeting: "Hola, buenos días.",
                    raw_responses_client_query: "Quisiera saber el estado de mi pedido con el número 123456.",
                    raw_responses_assistance_response: "Claro, déjame verificar el estado de tu pedido.",
                    raw_responses_status_update: "Tu pedido está en camino y llegará en 2 días.",
                    raw_responses_client_acknowledgment: "Gracias por la información.",
                    raw_responses_goodbye: "Que tengas un buen día.",
                    chat_id: (0, uuid_1.v4)(),
                    document_id: (0, uuid_1.v4)()
                };
                _h.label = 7;
            case 7:
                _h.trys.push([7, 9, , 10]);
                return [4 /*yield*/, chatsCollection.insertOne(chatSummary)];
            case 8:
                result = _h.sent();
                chatSummary.chat_id = result.insertedId.toString();
                return [3 /*break*/, 10];
            case 9:
                e_5 = _h.sent();
                logger.error("Error al guardar en MongoDB: ".concat(e_5));
                return [2 /*return*/, res.status(500).json({ error: "Database error", details: e_5.toString() })];
            case 10:
                logger.info("An\u00E1lisis exitoso para el grupo de chat ".concat(chatGroupId));
                return [2 /*return*/, res.json(chatSummary)];
            case 11:
                e_6 = _h.sent();
                logger.error("Error al analizar el chat: ".concat(e_6));
                return [2 /*return*/, res.status(500).json({ error: "Internal server error", details: e_6.toString() })];
            case 12: return [2 /*return*/];
        }
    });
}); });
app.get("/chats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, perPage, maxPerPage, safePerPage, skip, total, chats, formattedChats, totalPages, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                perPage = parseInt(req.query.per_page) || 10;
                // Validar parámetros de paginación
                if (isNaN(page) || isNaN(perPage) || page < 1 || perPage < 1) {
                    return [2 /*return*/, res.status(400).json({ error: "Parámetros de paginación inválidos" })];
                }
                maxPerPage = 100;
                safePerPage = Math.min(perPage, maxPerPage);
                skip = (page - 1) * safePerPage;
                return [4 /*yield*/, chatsCollection.countDocuments({})];
            case 1:
                total = _a.sent();
                return [4 /*yield*/, chatsCollection.find({})
                        .sort({ _id: -1 }) // Ordenar por _id descendente
                        .skip(skip)
                        .limit(safePerPage)
                        .toArray()];
            case 2:
                chats = _a.sent();
                formattedChats = chats.map(function (chat) { return (__assign(__assign({}, chat), { _id: chat._id.toString() })); });
                totalPages = Math.ceil(total / safePerPage);
                return [2 /*return*/, res.json({
                        total: total,
                        page: page,
                        per_page: safePerPage,
                        total_pages: totalPages,
                        chats: formattedChats,
                    })];
            case 3:
                e_7 = _a.sent();
                logger.error("Error al obtener chats: ".concat(e_7));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener chats" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Endpoint GET /chat_details/:chat_group
app.get("/chat_details/:chat_group", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var chatGroup, details, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                chatGroup = req.params.chat_group;
                // Validar que chat_group no esté vacío y tenga un formato válido (UUID)
                if (!chatGroup || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chatGroup)) {
                    return [2 /*return*/, res.status(400).json({ error: "chat_group es inválido o no tiene un formato UUID válido" })];
                }
                return [4 /*yield*/, chatDetailsCollection.find({ chat_group: chatGroup }, { projection: { _id: 0 } } // Excluir el campo _id
                    ).sort({ sequence: 1 }).toArray()];
            case 1:
                details = _a.sent();
                if (details.length > 0) {
                    return [2 /*return*/, res.json({ chat_detail: details })];
                }
                return [2 /*return*/, res.status(404).json({ error: "Chat details no encontrados" })];
            case 2:
                e_8 = _a.sent();
                logger.error("Error al obtener detalles del chat ".concat(req.params.chat_group, ": ").concat(e_8));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener detalles del chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Endpoint GET /chats_by_group/:chat_group
app.get("/chats_by_group/:chat_group", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var chatGroup, chat, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                chatGroup = req.params.chat_group;
                // Validar que chat_group no esté vacío y tenga un formato válido (UUID)
                if (!chatGroup || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chatGroup)) {
                    return [2 /*return*/, res.status(400).json({ error: "chat_group es inválido o no tiene un formato UUID válido" })];
                }
                return [4 /*yield*/, chatsCollection.findOne({ 'chat.chat_group': chatGroup })];
            case 1:
                chat = _a.sent();
                if (chat) {
                    // Convertir _id a string
                    chat._id = chat._id.toString();
                    return [2 /*return*/, res.json(chat)];
                }
                return [2 /*return*/, res.status(404).json({ error: "Chat no encontrado" })];
            case 2:
                e_9 = _a.sent();
                logger.error("Error al obtener chat ".concat(req.params.chat_group, ": ").concat(e_9));
                return [2 /*return*/, res.status(500).json({ error: "Error al obtener chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Endpoint GET /health
app.get("/health", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Verificar conexión a MongoDB
                return [4 /*yield*/, client.db().admin().command({ ping: 1 })];
            case 1:
                // Verificar conexión a MongoDB
                _a.sent();
                // Verificar API key de OpenAI
                if (!process.env.OPENAI_API_KEY) {
                    throw new Error("OPENAI_API_KEY no está configurada");
                }
                return [2 /*return*/, res.json({
                        status: "healthy",
                        mongodb: "connected",
                        openai_api: "configured", // Cambiado de "gemini_api" a "openai_api"
                    })];
            case 2:
                e_10 = _a.sent();
                return [2 /*return*/, res.status(500).json({
                        status: "unhealthy",
                        error: e_10.toString(),
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Endpoint GET /export/chats
app.get("/export/chats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var chats, headers, data, csvStream_1, e_11;
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
                    'rules',
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
                        chatData.rules || '',
                    ];
                });
                csvStream_1 = new stream_1.Readable();
                csvStream_1._read = function () { };
                csvStream_1.push(headers.join(',') + '\n');
                data.forEach(function (row) { return csvStream_1.push(row.join(',') + '\n'); });
                csvStream_1.push(null);
                res.setHeader("Content-Disposition", "attachment; filename=chats_export_".concat(luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
                res.setHeader("Content-type", "text/csv");
                csvStream_1.pipe(res);
                return [3 /*break*/, 3];
            case 2:
                e_11 = _a.sent();
                logger.error("Error al exportar chats: ".concat(e_11));
                return [2 /*return*/, res.status(500).json({ error: "Error al exportar chats" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Endpoint GET /export/chat_details
app.get("/export/chat_details", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var chatDetails, headers, data, csvStream_2, e_12;
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
                    'body',
                ];
                data = chatDetails.map(function (detail) { return [
                    detail.chat_group || '',
                    String(detail.sequence || ''),
                    detail.from || '',
                    detail.to || '',
                    detail.timestamp || '',
                    detail.type || '',
                    detail.body || '',
                ]; });
                csvStream_2 = new stream_1.Readable();
                csvStream_2._read = function () { };
                csvStream_2.push(headers.join(',') + '\n');
                data.forEach(function (row) { return csvStream_2.push(row.join(',') + '\n'); });
                csvStream_2.push(null);
                res.setHeader("Content-Disposition", "attachment; filename=chat_details_export_".concat(luxon_1.DateTime.now().toFormat('yyyyMMdd_HHmmss'), ".csv"));
                res.setHeader("Content-type", "text/csv");
                csvStream_2.pipe(res);
                return [3 /*break*/, 3];
            case 2:
                e_12 = _a.sent();
                logger.error("Error al exportar detalles de chat: ".concat(e_12));
                return [2 /*return*/, res.status(500).json({ error: "Error al exportar detalles de chat" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Iniciar el servidor
var port = parseInt(process.env.PORT || '5000');
var debug = ((_a = process.env.DEBUG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true";
logger.info("Iniciando servidor Express en puerto ".concat(port, " con debug=").concat(debug));
app.listen(port, function () {
    logger.info("Servidor corriendo en puerto ".concat(port));
});
