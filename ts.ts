import express, { Request, Response } from 'express';
import cors from 'cors';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger, format, transports } from 'winston';
import { DateTime } from 'luxon';
import { Readable } from 'stream';
import { encode } from 'gpt-tokenizer';
import { Configuration, OpenAIApi } from 'openai';

// Configuración de OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Asegúrate de tener esta variable en tu .env
});
const openai = new OpenAIApi(configuration);


// Configuración de variables de entorno
dotenv.config();

// Configuración de logs
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)
    ),
    transports: [new transports.Console()],
});

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de MongoDB
const MONGO_URI = "mongodb+srv://cordovacruzfloresmeralda:BHCdmAZGTDFcV04l@cluster0.v1vxy.mongodb.net/";
const MONGO_DB_NAME = "Qualychat"; // Nombre de la base de datos

// Conexión a MongoDB
let client: MongoClient;
let db: Db;
let chatsCollection: Collection;
let chatDetailsCollection: Collection;

(async () => {
    try {
        client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        await client.connect(); // Conectar al servidor de MongoDB
        db = client.db(MONGO_DB_NAME); // Seleccionar la base de datos
        chatsCollection = db.collection('chats'); // Seleccionar la colección de resúmenes
        chatDetailsCollection = db.collection('chat_details'); // Seleccionar la colección de detalles
        logger.info("Conexión a MongoDB exitosa.");
    } catch (e) {
        logger.error(`Error al conectar a MongoDB: ${e}`);
        throw e; // Relanzar la excepción para manejo externo
    }
})();

// Función para guardar un resumen de chat
async function saveChatSummary(chatSummary: any): Promise<string> {
    try {
        const result = await chatsCollection.insertOne(chatSummary); // Insertar el documento
        logger.info(`Resumen de chat guardado con ID: ${result.insertedId}`);
        return result.insertedId.toString(); // Retornar el ID del documento insertado
    } catch (e) {
        logger.error(`Error al guardar el resumen de chat: ${e}`);
        throw e; // Relanzar la excepción para manejo externo
    }
}

const generateResponseFromOpenAI = async (prompt: string): Promise<string> => {
    try {
        logger.info("Generando respuesta con OpenAI para el prompt");

        const response = await openai.createCompletion({
            model: "text-davinci-003", // Puedes cambiar el modelo según tus necesidades
            prompt: prompt,
            max_tokens: 150, // Ajusta según sea necesario
            temperature: 0.7, // Ajusta según sea necesario
        });

        const text = response.data.choices[0].text?.trim();

        if (text) {
            return text;
        } else {
            logger.error("Respuesta vacía de OpenAI");
            return "Error: respuesta vacía";
        }
    } catch (e) {
        logger.error(`Error al generar respuesta con OpenAI: ${e}`);
        return "Error al generar respuesta.";
    }
};



// Interfaz para los mensajes del chat
interface ChatMessage {
    from: string;
    to?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
}

// Función para guardar detalles del chat
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
            await chatDetailsCollection.insertMany(chatDetails); // Insertar los detalles del chat
            logger.info(`Detalles del chat guardados exitosamente para el grupo ${chatGroupId}`);
            return true;
        }
        return false;
    } catch (e) {
        logger.error(`Error al guardar detalles del chat: ${e}`);
        return false;
    }
};

const processBooleanResponse = (response: string): boolean => {
    response = response.toLowerCase().trim();
    return response.includes("sí") || response.includes("si");
};

const processSentimentResponse = (response: string): string => {
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
        .map((message) => message.text!.body)
        .join(" ");
};

// Función para contar tokens
const countTokens = (text: string): number => {
    return encode(text).length;
};
const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime); // Convertir a objeto Date
    const end = new Date(endTime); // Convertir a objeto Date

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Formato de fecha inválido.");
    }

    const differenceInMilliseconds = end.getTime() - start.getTime(); // Diferencia en milisegundos
    return differenceInMilliseconds.toString(); // Devolver la duración en milisegundos como cadena
};



const createAnalysisPrompts = (vendedorText: string, clienteText: string): Record<string, string> => {
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
        problemResolution: `
        Analiza el siguiente texto que contiene SOLO mensajes del VENDEDOR y responde SOLO con 'sí' o 'no' 
        si el VENDEDOR resolvió el problema del cliente de manera efectiva. Considera lo siguiente:
        1. ¿El vendedor proporcionó una solución clara y específica?
        2. ¿El cliente mostró satisfacción con la solución?
        3. ¿El vendedor siguió un proceso lógico para resolver el problema?

        Texto a analizar:
        ${vendedorText}
        `,
    };
};

app.post("/analyze", async (req: Request, res: Response) => {
    try {
        logger.info("Iniciando análisis de chat.");
        const data = req.body;

        if (!data || !data.chat) {
            logger.warning("Solicitud inválida, 'chat' es un campo requerido.");
            return res.status(400).json({ error: "Invalid input, 'chat' field is required." });
        }

        const chatGroupId = uuidv4();
        const analysisChatGroupId = uuidv4();

        const {
            country_client_phone_number = "No especificado",
            cliente_numero = "No especificado",
            vendedor_numero = "No especificado",
            client_name = "No especificado",
            assistance = "No especificado",
            start_time = new Date().toISOString(),
            end_time = new Date().toISOString(),
        } = data;

        let durationInMilliseconds = "0";
        try {
            durationInMilliseconds = calculateDuration(start_time, end_time);
        } catch (e) {
            logger.error(`Error al calcular la duración: ${e}`);
            return res.status(400).json({ error: "Invalid date format", details: e.toString() });
        }

        const durationInSeconds = (parseInt(durationInMilliseconds) / 1000).toFixed(2);

        const chatDetailsSaved = await saveChatDetails(
            data.chat,
            chatGroupId,
            cliente_numero,
            vendedor_numero
        );

        if (!chatDetailsSaved) {
            logger.error("Error al guardar los detalles del chat.");
            return res.status(500).json({ error: "Error saving chat details" });
        }

        const chatMessages = data.chat;
        const vendedorText = filterMessages(chatMessages, true);
        const clienteText = filterMessages(chatMessages, false);

        if (!vendedorText.trim()) {
            logger.warning("No se encontraron mensajes del vendedor.");
            return res.status(400).json({ error: "No vendor messages found" });
        }

        if (!clienteText.trim()) {
            logger.warning("No se encontraron mensajes del cliente.");
            return res.status(400).json({ error: "No client messages found" });
        }

        const prompts = createAnalysisPrompts(vendedorText, clienteText);

        // Reemplazar llamadas a Gemini con OpenAI
        const greetingsResponse = await generateResponseFromOpenAI(prompts.greetings);
        const goodbyeResponse = await generateResponseFromOpenAI(prompts.goodbyes);
        const sentimentResponse = await generateResponseFromOpenAI(prompts.sentiment);
        const sentimentTagResponse = await generateResponseFromOpenAI(prompts.sentimentTag);
        const problemResolutionResponse = await generateResponseFromOpenAI(prompts.problemResolution);

        const inputTokens = countTokens(vendedorText + clienteText);
        const outputTokens = countTokens(
            greetingsResponse + goodbyeResponse + sentimentResponse + sentimentTagResponse + problemResolutionResponse
        );
        const totalTokens = inputTokens + outputTokens;

        const greetingsRulePass = processBooleanResponse(greetingsResponse);
        const goodbyeRulePass = processBooleanResponse(goodbyeResponse);
        const sentimentalTag = processSentimentResponse(sentimentTagResponse);
        const problemResolved = processBooleanResponse(problemResolutionResponse);

        const formatTextResponse = (response: string): string => {
            return response.toLowerCase().includes("yes") || response.toLowerCase().includes("sí") ? "sí" : "no";
        };

        const greetingsText = formatTextResponse(greetingsResponse);
        const goodbyeText = formatTextResponse(goodbyeResponse);
        const problemResolutionText = formatTextResponse(problemResolutionResponse);

        const chatSummary = {
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
            chat_id: uuidv4(),
            document_id: uuidv4()
        };

        try {
            const result = await chatsCollection.insertOne(chatSummary);
            chatSummary.chat_id = result.insertedId.toString();
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

        // Validar parámetros de paginación
        if (isNaN(page) || isNaN(perPage) || page < 1 || perPage < 1) {
            return res.status(400).json({ error: "Parámetros de paginación inválidos" });
        }

        // Limitar perPage a un máximo de 100 para evitar cargas pesadas
        const maxPerPage = 100;
        const safePerPage = Math.min(perPage, maxPerPage);

        // Calcular el skip
        const skip = (page - 1) * safePerPage;

        // Obtener total de documentos
        const total = await chatsCollection.countDocuments({});

        // Obtener chats paginados
        const chats = await chatsCollection.find({})
            .sort({ _id: -1 }) // Ordenar por _id descendente
            .skip(skip)
            .limit(safePerPage)
            .toArray();

        // Convertir _id a string
        const formattedChats = chats.map(chat => ({
            ...chat,
            _id: chat._id.toString()
        }));

        // Calcular total_pages usando el enfoque de Python
        const totalPages = Math.ceil(total / safePerPage);

        return res.json({
            total,
            page,
            per_page: safePerPage,
            total_pages: totalPages,
            chats: formattedChats,
        });
    } catch (e) {
        logger.error(`Error al obtener chats: ${e}`);
        return res.status(500).json({ error: "Error al obtener chats" });
    }
});

// Endpoint GET /chat_details/:chat_group
app.get("/chat_details/:chat_group", async (req: Request, res: Response) => {
    try {
        const chatGroup = req.params.chat_group;

        // Validar que chat_group no esté vacío y tenga un formato válido (UUID)
        if (!chatGroup || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chatGroup)) {
            return res.status(400).json({ error: "chat_group es inválido o no tiene un formato UUID válido" });
        }

        // Obtener detalles del chat
        const details = await chatDetailsCollection.find(
            { chat_group: chatGroup },
            { projection: { _id: 0 } } // Excluir el campo _id
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

// Endpoint GET /chats_by_group/:chat_group
app.get("/chats_by_group/:chat_group", async (req: Request, res: Response) => {
    try {
        const chatGroup = req.params.chat_group;

        // Validar que chat_group no esté vacío y tenga un formato válido (UUID)
        if (!chatGroup || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(chatGroup)) {
            return res.status(400).json({ error: "chat_group es inválido o no tiene un formato UUID válido" });
        }

        // Obtener el chat por chat_group
        const chat = await chatsCollection.findOne({ 'chat.chat_group': chatGroup });

        if (chat) {
            // Convertir _id a string
            chat._id = chat._id.toString();
            return res.json(chat);
        }
        return res.status(404).json({ error: "Chat no encontrado" });
    } catch (e) {
        logger.error(`Error al obtener chat ${req.params.chat_group}: ${e}`);
        return res.status(500).json({ error: "Error al obtener chat" });
    }
});

// Endpoint GET /health
app.get("/health", async (req: Request, res: Response) => {
    try {
        // Verificar conexión a MongoDB
        await client.db().admin().command({ ping: 1 });

        // Verificar API key de OpenAI
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY no está configurada");
        }

        return res.json({
            status: "healthy",
            mongodb: "connected",
            openai_api: "configured", // Cambiado de "gemini_api" a "openai_api"
        });
    } catch (e) {
        return res.status(500).json({
            status: "unhealthy",
            error: e.toString(),
        });
    }
});

// Endpoint GET /export/chats
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

        const csvStream = new Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach((row) => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);

        res.setHeader("Content-Disposition", `attachment; filename=chats_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);
    } catch (e) {
        logger.error(`Error al exportar chats: ${e}`);
        return res.status(500).json({ error: "Error al exportar chats" });
    }
});

// Endpoint GET /export/chat_details
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

        const csvStream = new Readable();
        csvStream._read = () => { };
        csvStream.push(headers.join(',') + '\n');
        data.forEach((row) => csvStream.push(row.join(',') + '\n'));
        csvStream.push(null);

        res.setHeader("Content-Disposition", `attachment; filename=chat_details_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.csv`);
        res.setHeader("Content-type", "text/csv");
        csvStream.pipe(res);
    } catch (e) {
        logger.error(`Error al exportar detalles de chat: ${e}`);
        return res.status(500).json({ error: "Error al exportar detalles de chat" });
    }
});

// Iniciar el servidor
const port = parseInt(process.env.PORT || '5000');
const debug = process.env.DEBUG?.toLowerCase() === "true";

logger.info(`Iniciando servidor Express en puerto ${port} con debug=${debug}`);
app.listen(port, () => {
    logger.info(`Servidor corriendo en puerto ${port}`);
});