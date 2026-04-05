# D&D Friends - Gerenciador de Aventuras ⚔️

Sistema completo para mestres e jogadores de D&D 5e, com atualizações em tempo real, IA de voz e rolagens de dados 3D. **Arquitetura 100% Serverless.**

## 🚀 Funcionalidades

- **Painel do Mestre (DM):** Gerenciamento completo de iniciativa, HP dos jogadores e pedidos de aprovação em tempo real via **Supabase Realtime**.
- **Ficha de Personagem:** Interface moderna e interativa com cálculo automático de modificadores e proficiência.
- **IA de Voz do Mestre:** Sistema de Text-to-Speech (TTS) integrado via **Supabase Edge Functions**, 100% gratuito.
- **Dados 3D:** Animação de rolagens de dados integrada com log de resultados global via Broadcast.
- **Integração com Supabase:** Banco de dados, autenticação e comunicação em tempo real.
- **Design Premium:** Interface em Dark Mode com efeitos de glassmorphism e animações fluidas.

## 🛠️ Tecnologias

- **Frontend:** React, Vite, Lucide React, Tailwind CSS.
- **Backend (Serverless):** Supabase Edge Functions (Deno).
- **Comunicação:** Supabase Realtime (Broadcast).
- **Hospedagem:** Netlify (Frontend), Supabase (Backend/DB).

## 🔧 Como Iniciar

### 1. Supabase (Backend)
1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Faça o deploy da Edge Function de voz:
   ```bash
   supabase functions deploy tts
   ```

### 2. Netlify (Frontend)
1. Conecte seu repositório ao Netlify.
2. O arquivo `netlify.toml` já está configurado para detectar a pasta `dnd-frontend`.
3. Adicione as variáveis de ambiente necessárias:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---
*Criado com ❤️ para amantes de RPG.*
