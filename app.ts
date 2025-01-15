<<<<<<< HEAD
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import winston from 'winston';  // Usamos winston para logging
import { DateTime } from 'luxon';
import csv from 'csv-stringify';
import { StringDecoder } from 'string_decoder';
import * as express from 'express';  // Usar import * as para express
import * as cors from 'cors';        // Usar import * as para cors
import * as dotenv from 'dotenv';    // Usar import * as para dotenv
import * as logging from 'logging';  // Usar import * as para logging
import * as csv from 'csv-stringify';  // Usar import * as para csv-stringify


// Configuración de logs con winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

dotenv.config();
=======
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
>>>>>>> e08085a (Actualizaciones en app.ts, app.js, package.json, package-lock.json y tsconfig.json)

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de MongoDB
<<<<<<< HEAD
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
// Asegúrate de configurar correctamente la API si se requiere

function generateResponseFromGemini(prompt: string): string {
    try {
        logger.info("Generando respuesta con Gemini para el prompt");

        // Asumimos que existe un modelo similar en la librería TypeScript
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
            const insertedId = await chatsCollection.insertOne(chatSummary);
            chatSummary["_id"] = insertedId.insertedId.toString();
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

// Rutas de exportación y demás código sin cambios significativos

const port = parseInt(process.env.FLASK_RUN_PORT || "5000");
logger.info(`Iniciando servidor Express en puerto ${port}`);
app.listen(port, () => {
    logger.info(`Servidor corriendo en puerto ${port}`);
=======
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
>>>>>>> e08085a (Actualizaciones en app.ts, app.js, package.json, package-lock.json y tsconfig.json)
});
