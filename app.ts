import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import logging from 'logging';
import { DateTime } from 'luxon';
import csv from 'csv-stringify';
import { StringDecoder } from 'string_decoder';

// Configuración de logs
const logger = logging.getLogger(__filename);
logger.setLevel(logging.INFO);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de MongoDB
const MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:SMhBfmnbphn8M7EW@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "qualichat";

// Conexión a MongoDB
let client: MongoClient;
let db: any;
let chatsCollection: any;
let chatDetailsCollection: any;

try {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    db = client.db(MONGO_DB_NAME);
    chatsCollection = db.collection('chats');
    chatDetailsCollection = db.collection('chat_details');
    logger.info("Conexión a MongoDB exitosa.");
} catch (e) {
    logger.error(`Error al conectar a MongoDB: ${e}`);
    throw e;
}

// Configuración de Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";

// Configurar Gemini API
// Note: Assuming a similar configuration function exists in the TypeScript library
// genai.configure({ apiKey: GEMINI_API_KEY });

function generateResponseFromGemini(prompt: string): string {
    try {
        logger.info("Generando respuesta con Gemini para el prompt");

        // Assuming a similar GenerativeModel class exists in the TypeScript library
        const model = new GenerativeModel(GEMINI_MODEL);
        const response = model.generateContent(prompt);
        if (response.parts) {
            return response.text.trim();
        } else {
            logger.error("Respuesta vacía de Gemini");
            return "Error: respuesta vacía";
        }
    } catch (e) {
        logger.error("Error al generar respuesta con Gemini: %s", e);
        return "Error al generar respuesta.";
    }
}

function saveChatDetails(chatMessages: any[], chatGroupId: string, clienteNumero: string, vendedorNumero: string): boolean {
    try {
        const chatDetails = chatMessages.map((message, index) => ({
            chat_group: chatGroupId,
            sequence: index + 1,
            from: message.from,
            to: message.to || (message.from === clienteNumero ? vendedorNumero : clienteNumero),
            timestamp: message.timestamp || DateTime.utc().toISO(),
            type: message.type || "text",
            body: message.text?.body || ""
        }));

        if (chatDetails.length > 0) {
            chatDetailsCollection.insertMany(chatDetails);
            logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
            return true;
        }
    } catch (e) {
        logger.error(`Error al guardar detalles del chat: ${e}`);
        return false;
    }
    return false;
}

function processBooleanResponse(response: string): boolean {
    response = response.toLowerCase().trim();
    return response.includes('sí') || response.includes('si');
}

function processSentimentResponse(response: string): string {
    response = response.toLowerCase().trim();
    const validSentiments = ['positivo', 'negativo', 'neutral'];
    return validSentiments.includes(response) ? response : 'neutral';
}

function filterMessages(chatMessages: any[], isVendedor: boolean = false): string {
    const filteredMessages = chatMessages.filter(message => {
        const isFromVendedor = message.from === "vendedor_numero";
        return isVendedor === isFromVendedor && message.text?.body;
    }).map(message => message.text.body);

    return filteredMessages.join(" ");
}

function createAnalysisPrompts(vendedorText: string, clienteText: string): any {
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
        
        sentiment_tag: `
        Para el siguiente texto que contiene SOLO mensajes del CLIENTE, responde SOLO con una de estas palabras 
        basándote en la actitud del cliente: 'positivo', 'negativo', 'neutral':
        ${clienteText}
        `
    };
}

app.post("/analyze", (req: Request, res: Response) => {
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
        const chatDetailsSaved = saveChatDetails(
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

        const greetingsResponse = generateResponseFromGemini(prompts.greetings);
        const goodbyeResponse = generateResponseFromGemini(prompts.goodbyes);
        const sentimentResponse = generateResponseFromGemini(prompts.sentiment);
        const sentimentTagResponse = generateResponseFromGemini(prompts.sentiment_tag);

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
            const insertedId = chatsCollection.insertOne(chatSummary).insertedId;
            chatSummary["_id"] = insertedId.toString();
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

app.get("/chats", (req: Request, res: Response) => {
    try {
        // Obtener parámetros de paginación
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.per_page as string) || 10;
        
        // Calcular el skip
        const skip = (page - 1) * perPage;
        
        // Obtener total de documentos
        const total = chatsCollection.countDocuments({});
        
        const chats = chatsCollection.find({})
            .sort({ _id: -1 })
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

app.get("/chat_details/:chat_group", (req: Request, res: Response) => {
    const chatGroup = req.params.chat_group;
    try {
        const details = chatDetailsCollection.find(
            { chat_group: chatGroup },
            { projection: { _id: 0 } }
        ).sort({ sequence: 1 }).toArray();
        
        if (details.length > 0) {
            return res.json({ chat_detail: details });
        }
        return res.status(404).json({ error: "Chat details no encontrados" });
        
    } catch (e) {
        logger.error(`Error al obtener detalles del chat ${chatGroup}: ${e}`);
        return res.status(500).json({ error: "Error al obtener detalles del chat" });
    }
});

app.get("/chats_by_group/:chat_group", (req: Request, res: Response) => {
    const chatGroup = req.params.chat_group;
    try {
        const chat = chatsCollection.findOne({ 'chat.chat_group': chatGroup });
        if (chat) {
            chat['_id'] = chat['_id'].toString();
            return res.json(chat);
        }
        return res.status(404).json({ error: "Chat no encontrado" });
        
    } catch (e) {
        logger.error(`Error al obtener chat ${chatGroup}: ${e}`);
        return res.status(500).json({ error: "Error al obtener chat" });
    }
});

// Ruta de health check
app.get("/health", (req: Request, res: Response) => {
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
    } catch (e) {
        return res.status(500).json({
            status: "unhealthy",
            error: e.toString()
        });
    }
});

app.get("/export/chats", (req: Request, res: Response) => {
    try {
        // Crear un buffer en memoria para el CSV
        const si = new StringDecoder('utf8');
        const writer = csv();
        
        // Escribir encabezados
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
        writer.write(headers);
        
        // Obtener todos los chats
        const chats = chatsCollection.find({}).toArray();
        
        // Escribir datos
        chats.forEach(chat => {
            const chatData = chat.chat || {};
            const row = [
                chatData.chat_group || '',
                chatData.country_client_phone_number || '',
                chatData.cliente_numero || '',
                chatData.vendedor_numero || '',
                String(chatData.greetings_rule_pass || ''),
                String(chatData.goodbye_rule_pass || ''),
                chatData.sentimental_tags || '',
                chatData.rules || ''
            ];
            writer.write(row);
        });
        
        // Crear la respuesta
        const output = res;
        output.setHeader("Content-Disposition", `attachment; filename=chats_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        output.setHeader("Content-type", "text/csv");
        writer.pipe(output);
        
    } catch (e) {
        logger.error(`Error al exportar chats: ${e}`);
        return res.status(500).json({ error: "Error al exportar chats" });
    }
});

app.get("/export/chat_details", (req: Request, res: Response) => {
    try {
        // Crear un buffer en memoria para el CSV
        const si = new StringDecoder('utf8');
        const writer = csv();
        
        // Escribir encabezados
        const headers = [
            'chat_group',
            'sequence',
            'from',
            'to',
            'timestamp',
            'type',
            'body'
        ];
        writer.write(headers);
        
        // Obtener todos los detalles de chat
        const chatDetails = chatDetailsCollection.find({}).sort([
            ['chat_group', 1],
            ['sequence', 1]
        ]).toArray();
        
        // Escribir datos
        chatDetails.forEach(detail => {
            const row = [
                detail.chat_group || '',
                String(detail.sequence || ''),
                detail.from || '',
                detail.to || '',
                detail.timestamp || '',
                detail.type || '',
                detail.body || ''
            ];
            writer.write(row);
        });
        
        // Crear la respuesta
        const output = res;
        output.setHeader("Content-Disposition", `attachment; filename=chat_details_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        output.setHeader("Content-type", "text/csv");
        writer.pipe(output);
        
    } catch (e) {
        logger.error(`Error al exportar detalles de chat: ${e}`);
        return res.status(500).json({ error: "Error al exportar detalles de chat" });
    }
});

const port = parseInt(process.env.FLASK_RUN_PORT || "5000");
const debug = process.env.FLASK_DEBUG?.toLowerCase() === "true";

logger.info(`Iniciando servidor Express en puerto ${port} con debug=${debug}`);
app.listen(port, () => {
    logger.info(`Servidor corriendo en puerto ${port}`);
});
