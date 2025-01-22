const express = require('express');
const { Request, Response } = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // Cargar las variables de entorno
const axios = require('axios'); // Reemplaza google-generativeai con axios
const { createLogger, format, transports } = require('winston');
const { DateTime } = require('luxon');
const csv = require('csv-stringify');
const { Readable } = require('stream');

// Logger configuration
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)
    ),
    transports: [new transports.Console()]
});

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB configuration
const MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualichat";

// MongoDB connection
let client: MongoClient;
let chatsCollection: any;
let chatDetailsCollection: any;

(async () => {
    try {
        client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        chatsCollection = db.collection('chats');
        chatDetailsCollection = db.collection('chat_details');
        logger.info("Conexión a MongoDB exitosa.");
    } catch (e) {
        logger.error(`Error al conectar a MongoDB: ${e}`);
        throw e;
    }
})();

// Gemini API configuration from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"; // Default to gemini-2.0-flash-exp
const GEMINI_URL = process.env.GEMINI_URL || "https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText";
const GEMINI_URL_API_KEY = `${GEMINI_URL}=${GEMINI_API_KEY}`
console.log("GEMINI_API_KEY", GEMINI_URL_API_KEY)



const generateResponseFromGemini = async (prompt: string): Promise<string> => {
    const requestData = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    try {
        logger.info("Generando respuesta con Gemini para el prompt");

        const response = await fetch(GEMINI_URL_API_KEY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            logger.error(`Error en la API de Gemini: ${response.statusText}`);
            return "Error al generar respuesta.";
        }

        const data = await response.json();

        if (data && data.candidates && data.candidates.length > 0) {
            console.log("datagemini", data)
            return data.candidates[0].output;
        } else {
            logger.error("Respuesta vacía de Gemini");
            return "Error: respuesta vacía";
        }
    } catch (e) {
        logger.error(`Error al generar respuesta con Gemini: ${e}`);
        return "Error al generar respuesta.";
    }
};

interface ChatMessage {
    from: string;
    to?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
}



const saveChatDetails = async (
    chatMessages: ChatMessage[],
    chatGroupId: string,
    clienteNumero: string,
    vendedorNumero: string
): Promise<boolean> => {
    try {
        const chatDetails = chatMessages.map((message, index) => {
            return {
                chat_group: chatGroupId,
                sequence: index + 1,
                from: message.from,
                to: message.to || (message.from === clienteNumero ? vendedorNumero : clienteNumero),
                timestamp: message.timestamp || DateTime.utc().toISO(),
                type: message.type || "text",
                body: message.text?.body || "",
            };
        });

        if (chatDetails.length) {
            await chatDetailsCollection.insertMany(chatDetails);
            logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
            return true;
        }
        return false;
    } catch (e) {
        logger.error(`Error al guardar detalles del chat: ${e}`);
        return false;
    }
};

const processBooleanResponse = (response: unknown): boolean => {
    if (typeof response !== "string") {
        return false; // O define un valor por defecto según tus necesidades
    }
    response = response.toLowerCase().trim();
    return response.includes("sí") || response.includes("si");
};


const processSentimentResponse = (response: unknown): string => {
    if (typeof response !== "string") {
        return "neutral"; // Valor predeterminado
    }
    response = response.toLowerCase().trim();
    const validSentiments = ["positivo", "negativo", "neutral"];
    return validSentiments.includes(response) ? response : "neutral";
};


const filterMessages = (chatMessages: ChatMessage[], isVendedor = false): string => {
    return chatMessages
        .filter((message) => {
            const isFromVendedor = message.from === "vendedor_numero";
            return isVendedor === isFromVendedor && typeof message.text?.body === "string";
        })
        .map((message) => message.text!.body) // ¡Aquí se garantiza que body es un string!
        .join(" ");
};


function createAnalysisPrompts(vendedorText: string, clienteText: string): Record<string, string> {
    if (!vendedorText || !clienteText) {
        throw new Error("Los textos de 'vendedorText' y 'clienteText' no pueden estar vacíos.");
    }

    return {
        greetings: `
Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR. Responde con 'sí' o 'no' 
si el VENDEDOR usó saludos como "hola", "buenos días", "buenas tardes", etc.:
${vendedorText}
`,

        goodbyes: `
Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR. Responde con 'sí' o 'no' 
si el VENDEDOR usó despedidas como "adiós", "hasta luego", "buenas noches", etc.:
${vendedorText}
`,

        sentiment: `
Analiza el siguiente texto que contiene SOLO mensajes del CLIENTE en una conversación con un vendedor.
Proporciona un análisis breve enfocado en:
1. La actitud del cliente.
2. Su nivel de satisfacción.
3. Su disposición en la conversación.

Texto a analizar:
${clienteText}
`,

        sentimentTag: `
Para el siguiente texto que contiene SOLO mensajes del CLIENTE, responde SOLO con una de estas palabras 
según la actitud del cliente: 'positivo', 'negativo', 'neutral'.
Texto a analizar:
${clienteText}
`
    };
}



app.post("/analyze", async (req: Request, res: Response) => {
    try {
        logger.info("Iniciando análisis de chat.");
        const data = req.body;
        if (!data || !data.chat) {
            logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
            return res.status(400).json({ error: "Invalid input, 'chat' field is required." });
        }

        const chatGroupId = uuidv4();
        const countryClientPhoneNumber = data.country_client_phone_number || "No especificado";
        const clienteNumero = data.cliente_numero || "No especificado";
        const vendedorNumero = data.vendedor_numero || "No especificado";

        // Guardar detalles del chat
        const chatDetailsSaved = await saveChatDetails(
            data.chat,
            chatGroupId,
            clienteNumero,
            vendedorNumero
        );

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

        const greetingsResponse = await generateResponseFromGemini(prompts.greetings);
        const goodbyeResponse = await generateResponseFromGemini(prompts.goodbyes);
        const sentimentResponse = await generateResponseFromGemini(prompts.sentiment);
        const sentimentTagResponse = await generateResponseFromGemini(prompts.sentiment_tag);

        const greetingsRulePass = processBooleanResponse(greetingsResponse);
        const goodbyeRulePass = processBooleanResponse(goodbyeResponse);
        const sentimentalTag = processSentimentResponse(sentimentTagResponse);

        // Crear y guardar el resumen del chat como antes
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
                    sentiment_tag: sentimentTagResponse
                }
            }
        };

        try {
            const result = await chatsCollection.insertOne(chatSummary);
            chatSummary.chat["_id"] = result.insertedId.toString();
        } catch (e) {
            logger.error(`Error al guardar en MongoDB: ${e}`);
            return res.status(500).json({ error: "Database error", details: e.toString() });
        }

        logger.info(`Análisis exitoso para el grupo de chat ${chatGroupId}`);
        return res.json(chatSummary);

    } catch (e) {
        logger.error(`Error al analizar el chat: ${e}`);
        return res.status(500).json({ error: "Internal server error", details: e.toString() });
    }
});

app.get("/chats", async (req: Request, res: Response) => {
    try {
        // Obtener parámetros de paginación
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.per_page as string) || 10;

        // Calcular el skip
        const skip = (page - 1) * perPage;

        // Obtener total de documentos
        const total = await chatsCollection.countDocuments({});

        const chats = await chatsCollection.find({})
            .sort({ '_id': -1 })
            .skip(skip)
            .limit(perPage)
            .toArray();

        chats.forEach(chat => {
            chat['_id'] = chat['_id'].toString();
        });

        return res.json({
            total,
            page,
            per_page: perPage,
            total_pages: Math.ceil(total / perPage),
            chats
        });

    } catch (e) {
        logger.error(`Error al obtener chats: ${e}`);
        return res.status(500).json({ error: "Error al obtener chats" });
    }
});

app.get("/chat_details/:chat_group", async (req: Request, res: Response) => {
    try {
        const chatGroup = req.params.chat_group;
        const details = await chatDetailsCollection.find(
            { chat_group: chatGroup },
            { projection: { _id: 0 } }
        ).sort({ sequence: 1 }).toArray();

        if (details.length > 0) {
            return res.json({ chat_detail: details });
        }
        return res.status(404).json({ error: "Chat details no encontrados" });

    } catch (e) {
        logger.error(`Error al obtener detalles del chat ${req.params.chat_group}: ${e}`);
        return res.status(500).json({ error: "Error al obtener detalles del chat" });
    }
});

app.get("/chats_by_group/:chat_group", async (req: Request, res: Response) => {
    try {
        const chatGroup = req.params.chat_group;
        const chat = await chatsCollection.findOne({ 'chat.chat_group': chatGroup });
        if (chat) {
            chat['_id'] = chat['_id'].toString();
            return res.json(chat);
        }
        return res.status(404).json({ error: "Chat no encontrado" });

    } catch (e) {
        logger.error(`Error al obtener chat ${req.params.chat_group}: ${e}`);
        return res.status(500).json({ error: "Error al obtener chat" });
    }
});

app.get("/health", async (req: Request, res: Response) => {
    try {
        // Verificar conexión a MongoDB
        await client.db().admin().command({ ping: 1 });
        // Verificar API key de Gemini
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no está configurada");
        }

        return res.json({
            status: "healthy",
            mongodb: "connected",
            gemini_api: "configured"
        });
    } catch (e) {
        return res.status(500).json({
            status: "unhealthy",
            error: e.toString()
        });
    }
});

app.get("/export/chats", async (req: Request, res: Response) => {
    try {
        const chats = await chatsCollection.find({}).toArray();
        const headers = [
            'chat_group',
            'country_client_phone_number',
            'cliente_numero',
            'vendedor_numero',
            'greetings_rule_pass',
            'goodbye_rule_pass',
            'sentimental_tags',
            'rules'
        ];

        const data = chats.map(chat => {
            const chatData = chat.chat || {};
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

        const csvStream = new Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach(row => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);

        res.setHeader("Content-Disposition", `attachment; filename=chats_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);

    } catch (e) {
        logger.error(`Error al exportar chats: ${e}`);
        return res.status(500).json({ error: "Error al exportar chats" });
    }
});

app.get("/export/chat_details", async (req: Request, res: Response) => {
    try {
        const chatDetails = await chatDetailsCollection.find({}).sort({ chat_group: 1, sequence: 1 }).toArray();
        const headers = [
            'chat_group',
            'sequence',
            'from',
            'to',
            'timestamp',
            'type',
            'body'
        ];

        const data = chatDetails.map(detail => [
            detail.chat_group || '',
            String(detail.sequence || ''),
            detail.from || '',
            detail.to || '',
            detail.timestamp || '',
            detail.type || '',
            detail.body || ''
        ]);

        const csvStream = new Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach(row => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);

        res.setHeader("Content-Disposition", `attachment; filename=chat_details_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);

    } catch (e) {
        logger.error(`Error al exportar detalles de chat: ${e}`);
        return res.status(500).json({ error: "Error al exportar detalles de chat" });
    }
});

const port = parseInt(process.env.FLASK_RUN_PORT || '5000');
const debug = process.env.FLASK_DEBUG?.toLowerCase() === "true";

logger.info(`Iniciando servidor Express en puerto ${port} con debug=${debug}`);
app.listen(port, () => {
    logger.info(`Servidor corriendo en puerto ${port}`);
});
