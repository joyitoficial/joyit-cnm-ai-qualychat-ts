# Joyit CNM AI QualyChat TS


## 1. Configuración
Crea un archivo `.env` en la raíz del proyecto y configura las siguientes variables:

```bash
MONGO_URI=mongodb+srv://cordovacruzfloresmeralda:BHCdmAZGTDFcV04l@cluster0.v1vxy.mongodb.net/
MONGO_DB_NAME=Qualychat
MONGO_URI=mongodb+srv://cordovacruzfloresmeralda:BHCdmAZGTDFcV04l@practice.l2otd.mongodb.net/?retryWrites=true&w=majority&appName=Practice

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# Configuración de Gemini API
GEMINI_API_KEY=AIzaSyA3SWoN1HiujDeOiOyWotmEQcN1FfkTelo
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key


# Configuración de OPENAI_API_KEY
OPENAI_API_KEY=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
```
## 2. Ejecutar el proyecto
Inicia el servidor con:

```bash
node dist/ts.js
```
## 3. Ejecutar connectBI

```bash
venv\Scripts\activate
uvicorn main:app --reload
```
