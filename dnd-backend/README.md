# D&D Friends - Backend 🛡️

Servidor Node.js com WebSocket para comunicação em tempo real da mesa de RPG.

## 🚀 Funcionalidades

- **WebSocket (Socket.io):** Sincronização de rolagens de dados, vida dos personagens e eventos de voz.
- **REST API:** Endpoints para gerenciamento de personagens e integração com Supabase.
- **Proxy TTS:** Sistema integrado para buscar áudio do Google Translate TTS de forma segura e performante.

## 🛠️ Tecnologias

- Node.js
- Express
- Socket.io
- TypeScript
- Supabase Node Client

## 📦 Instalação

1. Acesse o diretório:
   ```bash
   cd dnd-backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente em um arquivo `.env`:
   ```env
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   PORT=3001
   ```

## 🏃 Execução

Para iniciar o servidor em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3001`.

## 📡 Eventos WebSocket

- `play_tts`: Dispara uma narração de voz para todos na sala.
- `roll_dice`: Transmite o resultado de um dado para a mesa.
- `update_hp`: Sincroniza a mudança de vida de um personagem.
- `join_mesa`: Conecta o socket a uma sala específica.
