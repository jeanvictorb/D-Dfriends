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
    const { message, roomId, characterContext } = await req.json()

    if (!message || !roomId || !characterContext) {
      throw new Error('Campos obrigatórios ausentes (message, roomId, characterContext)')
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
    const isCampaignStart = message.startsWith('INÍCIO DE CAMPANHA:')
    const style = room.style || 'Épico/Fantasia'
    
    let fullPrompt: string
    if (isCampaignStart) {
      fullPrompt = `Você é um DM (Dungeon Master) experiente narrando uma campanha de D&D no estilo "${style}".
A aventura está começando agora! Gere uma abertura épica e imersiva.

REGRAS:
- Responda SEMPRE em Português do Brasil.
- NÃO há limite de caracteres ou palavras. Sinta-se à vontade para escrever 500, 1000 ou mais palavras se a cena for rica.
- Use descrições sensoriais profundas (cheiros, sons, clima, sensações táteis).
- Descreva o cenário e a atmosfera com riqueza literária.
- Apresente um NPC ou um evento imediato de forma dramática.
- Gere múltiplos parágrafos bem desenvolvidos.
- Termine perguntando: "O que você faz?" ou algo similar.

PERSONAGEM: ${characterContext.name} (${characterContext.class_subclass}, Nível ${characterContext.level})
TEMA DA CAMPANHA: ${message.replace('INÍCIO DE CAMPANHA:', '').trim()}

NARRAÇÃO INICIAL:`
    } else {
      fullPrompt = `Você é um Mestre de RPG (Dungeon Master) narrando uma aventura no estilo "${style}".

REGRAS:
- Interprete o resultado (1 = Falha Crítica, 20 = Sucesso Crítico).
- Responda em Português do Brasil, seja extremamente imersivo, detalhista, épico e EXTENSO.
- NÃO se limite a poucos parágrafos; descreva as consequências da ação com profundidade literária total.
- Sinta-se livre para desenvolver a cena sem medo de ser longo.
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
      { name: 'gemini-1.5-flash-latest', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
      { name: 'gemini-2.5-flash', version: 'v1beta' },
      { name: 'gemini-1.5-flash-lite', version: 'v1beta' },
      { name: 'gemini-2.0-flash-lite', version: 'v1beta' },
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
            generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
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
      player_name: 'Narrador IA',
      content: finalNarration,
      type: 'narration'
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
