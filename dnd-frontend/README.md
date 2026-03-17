# D&D Friends - Frontend 🎭

Aplicação React moderna para jogadores e mestres de Dungeons & Dragons.

## 🚀 Funcionalidades

- **Criação de Personagem:** Passo a passo com escolha de classes e subclasses oficiais.
- **Painel do Jogador:** Ficha interativa com gerenciamento de HP, inventário e dados.
- **Painel do Mestre:** Dashboard exclusivo para aprovação de jogadores e controle total da mesa.
- **Voz Narrativa:** Recebe narrações em tempo real enviadas pelo Mestre.
- **Visual Dice:** Animação 3D de rolagens de dados (D20).

## 🛠️ Tecnologias

- React 18
- Vite
- Tailwind CSS
- Lucide React (Ícones)
- Supabase (Backend as a Service)
- Socket.io Client

## 📦 Instalação

1. Acesse o diretório:
   ```bash
   cd dnd-frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente em um arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   ```

## 🏃 Execução

Para iniciar o app em modo de desenvolvimento:

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`.

## 🎨 Design

O projeto utiliza um sistema de design baseado em **Glassmorphism**, com tons profundos de azul e roxo, proporcionando uma experiência imersiva de RPG.
