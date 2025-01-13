
# Joyit CNM AI QualyChat TS

Este proyecto es una aplicación de chat utilizando la inteligencia artificial para la mejora de la calidad en las interacciones. Desarrollado en TypeScript, Express y MongoDB, este proyecto tiene como objetivo proporcionar una plataforma de análisis de chats mediante AI, con funciones de exportación y paginación.

## Requisitos previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas en tu máquina:

- **Node.js**: [Descargar Node.js](https://nodejs.org/)
- **MongoDB**: [Descargar MongoDB](https://www.mongodb.com/try/download/community) o usar una instancia en la nube.
- **Git**: [Descargar Git](https://git-scm.com/)

## Instalación

Sigue estos pasos para instalar y ejecutar el proyecto:

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/joyit-cnm-ai-qualychat-ts.git
cd joyit-cnm-ai-qualychat-ts
```

## 2. Instalar dependencias
Asegúrate de tener todas las dependencias necesarias instaladas:

```bash
npm install
```

## 3. Configuración
Crea un archivo `.env` en la raíz del proyecto y configura las siguientes variables:

```bash
MONGO_URI=<tu_conexion_mongo>
GEMINI_API_KEY=<tu_api_key_de_gemini>
```
## 4. Ejecutar el proyecto
Inicia el servidor con:

```bash
npm start
```
El servidor debería estar corriendo en http://localhost:5000.

## Endpoints

### 1. Obtener chats
```bash
GET /chats?page=1&per_page=10
```

## 2. Obtener detalles de un chat

**GET /chat_details/:chat_group**  
Devuelve los detalles de un chat específico basado en el `chat_group`.

---

## 3. Obtener chat por grupo

**GET /chats_by_group/:chat_group**  
Devuelve un chat específico basado en el `chat_group`.

---

## 4. Verificar estado de la API

**GET /health**  
Verifica que el servidor y la API de Gemini están funcionando correctamente.

---

## 5. Exportar chats a CSV

**GET /export/chats**  
Genera un archivo CSV con todos los chats.

---

## 6. Exportar detalles de chats a CSV

**GET /export/chat_details**  
Genera un archivo CSV con todos los detalles de los chats.

---

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una rama con tus cambios (`git checkout -b feature-nueva-funcionalidad`).
3. Haz commit de tus cambios (`git commit -am 'Añadir nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature-nueva-funcionalidad`).
5. Crea un Pull Request.




