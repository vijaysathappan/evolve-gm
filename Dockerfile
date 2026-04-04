# Base image for building the frontend
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Base image for the Node.js Backend
FROM node:20-alpine as backend-node
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server/ ./server/
# Copy the built frontend to be served by the Node server if needed
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "server/server.js"]

# Base image for the Python LLM Service
FROM python:3.10-slim as llm-service
WORKDIR /app
COPY llm_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY llm_service/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
