import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, roomId, characterContext, isChronicle } = await req.json()

    if (!roomId || !characterContext || (!message && !isChronicle)) {
      throw new Error('Campos obrigatórios ausentes (message/isChronicle, roomId, characterContext)')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch Room Data
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) throw new Error(`Sala não encontrada: ${roomError.message}`)

    // 2. Fetch history (last 10 messages)
    const { data: messages } = await supabaseClient
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20)

    const history = messages?.reverse()
      .map((m: any) => `${m.player_name}: ${m.content}`)
      .join('\n') || ''

    // 3. Prompt Construction
    const isCampaignStart = message?.startsWith('INÍCIO DE CAMPANHA:') || false
    const style = room.style || 'Épico/Fantasia'
    
    let fullPrompt: string
    if (isCampaignStart) {
      fullPrompt = `Você é um DM (Dungeon Master) experiente narrando uma campanha de D&D no estilo "${style}".
A aventura está começando agora! Gere uma abertura épica e imersiva.

REGRAS:
- Responda SEMPRE em Português do Brasil.
- Seja DIRETO: Comece a narração imediatamente, sem frases introdutórias (ex: NÃO diga "Certamente!", "Aqui está sua aventura").
- Extensão: Sinta-se à vontade para escrever 800, 1500 ou mais palavras. Explore cada detalhe.
- Use descrições sensoriais profundas (cheiros, sons, clima, sensações táteis).
- Descreva o cenário e a atmosfera com grande riqueza literária.
- Apresente NPCs ou eventos imediatos de forma dramática.
- Gere múltiplos parágrafos longos e bem desenvolvidos.
- Termine instigando a ação (ex: "O que você faz?").

PERSONAGEM: ${characterContext.name} (${characterContext.class_subclass}, Nível ${characterContext.level})
TEMA DA CAMPANHA: ${message.replace('INÍCIO DE CAMPANHA:', '').trim()}

NARRAÇÃO INICIAL:`
    } else if (isChronicle) {
      fullPrompt = `Você é um bardo real e historiador épico de uma terra de fantasia.
Sua tarefa é ler o histórico de mensagens abaixo e transformá-lo em uma CRÔNICA ÉPICA, heróica e envolvente.
REGRAS:
- Responda SEMPRE em Português do Brasil.
- Use um tom de lenda, citando feitos heróicos, perigos enfrentados e decisões cruciais.
- Mencione os personagens pelo nome (ex: ${characterContext.name}).
- Seja extenso e descritivo; não economize nas palavras (800-1500 tokens ou mais).
- Use uma linguagem arcaica ou formal, típica de grandes épicos.
- Estruture o texto em parágrafos que contem uma história contínua.
HISTÓRICO DA SESSÃO:
${history}
A CRÔNICA DAS ERAS:`
    } else {
      fullPrompt = `Você é um Mestre de RPG (Dungeon Master) narrando uma aventura no estilo "${style}".
 
REGRAS:
- Responda SEMPRE em Português do Brasil.
- Seja DIRETO: Comece narrando o resultado da ação imediatamente.
- NÃO use frases de confirmação como "Entendido", "Ação recebida", etc. Vá direto para a história.
- Interprete o resultado (1 = Falha Crítica, 20 = Sucesso Crítico).
- Seja extremamente imersivo, detalhista, épico e EXTENSO.
- NÃO se limite; descreva as consequências da ação com profundidade literária total.
- Mantenha a coerência com o histórico abaixo.
 
HISTÓRICO:
${history}
 
PERSONAGEM: ${characterContext.name} (${characterContext.class_subclass})
AÇÃO ATUAL: ${message}
 
NARRE O RESULTADO:`
    }

    // 4. API Call with Model & Version Fallback
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada')

    // Diagnostic LOG (safe prefix)
    console.log(`[ai-master] Key Prefix: ${GEMINI_API_KEY.substring(0, 4)}... | Length: ${GEMINI_API_KEY.length}`)

    const MODELS = [
      { name: 'gemini-1.5-pro-latest', version: 'v1beta' },
      { name: 'gemini-2.0-flash-exp', version: 'v1beta' },
      { name: 'gemini-1.5-flash-latest', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
    ]

    let finalNarration = ''
    let lastError = ''

    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${GEMINI_API_KEY}`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 30000 }
          })
        })

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            finalNarration = text
            console.log(`[ai-master] SUCESSO com ${model.name} (${model.version})`)
            break
          }
        } else {
          const errData = await response.json()
          lastError = `${model.name} (${model.version}): ${response.status} - ${JSON.stringify(errData)}`
          console.warn(`[ai-master] Falha em ${model.name}:`, lastError)
          
          // Debug: List available models if 404
          if (response.status === 404) {
            const listUrl = `https://generativelanguage.googleapis.com/${model.version}/models?key=${GEMINI_API_KEY}`
            const listRes = await fetch(listUrl)
            if (listRes.ok) {
              const listData = await listRes.json()
              const modelNames = listData.models?.map((m: any) => m.name).join(', ')
              console.log(`[ai-master] Modelos disponíveis para esta chave: ${modelNames}`)
            }
          }
        }
      } catch (e: any) {
        lastError = `${model.name}: Erro de rede: ${e.message}`
        console.error(`[ai-master] Erro de rede em ${model.name}:`, e.message)
      }
    }

    if (!finalNarration) {
      throw new Error(`Todos os modelos Gemini falharam. Último erro: ${lastError}`)
    }

    // 5. Save AI response to DB
    await supabaseClient.from('room_messages').insert({
      room_id: roomId,
      player_name: isChronicle ? 'O Cronista Real' : 'Narrador IA',
      content: finalNarration,
      type: isChronicle ? 'chronicle' : 'narration'
    })

    return new Response(JSON.stringify({ text: finalNarration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[ai-master] FATAL ERROR:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
