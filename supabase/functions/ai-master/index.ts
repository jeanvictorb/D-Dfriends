import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      return jsonResponse({ error: 'CONFIG_MISSING (SUPABASE_URL/KEY or GEMINI_API_KEY)' }, 500)
    }

    const body = await req.json()
    const { message, roomId, characterContext, isChronicle } = body
    if (!roomId) return jsonResponse({ error: 'roomId is required' }, 400)

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // 1. Discovery Phase: See what models actually exist for this key
    console.log("[AI-MASTER] Iniciando descoberta dinâmica de modelos...")
    let availableModels: string[] = []
    try {
      const listResp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`)
      if (listResp.ok) {
        const listData = await listResp.json()
        availableModels = listData.models
          ?.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', '')) // We just want the ID
        console.log(`[AI-MASTER] Modelos descobertos: ${availableModels.join(', ')}`)
      } else {
        console.error(`[AI-MASTER] Erro ao listar modelos: ${listResp.status}`)
      }
    } catch (e) {
      console.error(`[AI-MASTER] Exceção na descoberta: ${e}`)
    }

    // 2. Selection Phase: Pick the best available model
    const PREFERRED = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-pro']
    let selectedModel = ''

    for (const p of PREFERRED) {
      if (availableModels.includes(p)) {
        selectedModel = p
        break
      }
    }

    // If discovery failed or none of preferred found, use a fallback
    if (!selectedModel) {
      selectedModel = availableModels[0] || 'gemini-1.5-flash'
      console.log(`[AI-MASTER] Usando fallback: ${selectedModel}`)
    } else {
      console.log(`[AI-MASTER] Modelo selecionado: ${selectedModel}`)
    }

    // 5. Fetch context (Room and Party)
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      console.error(`[AI-MASTER] Erro ao buscar sala: ${roomError?.message}`)
      return jsonResponse({ error: 'Sala não encontrada.' }, 404)
    }

    // LISTA DE PERSONAGENS DA MESA
    const { data: party } = await supabaseClient
      .from('characters')
      .select('name, class, race')
      .eq('room_id', roomId)

    const partyList = party?.map(p => `${p.name} (${p.race} ${p.class})`).join(', ') || 'Apenas você'

    const { data: messages } = await supabaseClient.from('room_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(10)
    const history = messages?.reverse().map((m: any) => `${m.player_name}: ${m.content}`).join('\n') || ''

    const charName = characterContext?.name || 'Aventureiro'
    const systemPrompt = `Você é o Mestre de RPG de "${room?.name || 'D&D Friends'}". Estilo: ${room?.style || 'Épico'}. 
    Personagens presentes: ${partyList}.
    Regras de narração:
    1. Narre em português brasileiro de forma imersiva e curta (2-3 parágrafos).
    2. Use o histórico para manter a continuidade.
    3. SEMPRE encerre sua resposta com um gancho de interação, provocação ou convite para que o personagem ${charName} ou um de seus companheiros (${partyList}) falem ou ajam. Peça a reação de alguém específico ocasionalmente para dinamizar a mesa.
    Transforme o fim da narração em algo que exija uma resposta ou reação dos jogadores.`
    
    let userMessage = isChronicle 
      ? `Gere uma crônica épica resumida:\n\n${history}`
      : `Histórico:\n${history}\n\nJogador ${charName} faz: ${message}`

    // 4. Generate Content
    console.log(`[AI-MASTER] Chamando generateContent para ${selectedModel}...`)
    const genResp = await fetch(`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\n" + userMessage }] }]
      })
    })

    if (!genResp.ok) {
      const errText = await genResp.text()
      console.error(`[AI-MASTER] Erro na geração (${selectedModel}): ${errText}`)
      return jsonResponse({ error: `IA falhou (${selectedModel}): ${errText.slice(0, 100)}` }, 500)
    }

    const genData = await genResp.json()
    const aiText = genData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiText) return jsonResponse({ error: 'Resposta da IA vazia.' }, 500)

    // 5. Save and Finish
    await supabaseClient.from('room_messages').insert({
      room_id: roomId,
      player_name: 'Narrador IA',
      content: aiText,
      type: isChronicle ? 'chronicle' : 'narration',
    })

    return jsonResponse({ text: aiText })

  } catch (err) {
    console.error(`[AI-MASTER] Erro fatal: ${err}`)
    return jsonResponse({ error: `Erro inesperado: ${String(err)}` }, 500)
  }
})
