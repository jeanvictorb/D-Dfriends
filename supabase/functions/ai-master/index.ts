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
    // 0. Environment checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: 'CONFIG: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.' }, 500)
    }
    if (!geminiKey) {
      return jsonResponse({ error: 'CONFIG: GEMINI_API_KEY não configurada. Adicione nos Secrets do Supabase.' }, 500)
    }

    // 1. Parse body
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'JSON inválido no corpo da requisição.' }, 400)
    }

    const { message, roomId, characterContext, isChronicle } = body

    if (!roomId) {
      return jsonResponse({ error: 'roomId é obrigatório.' }, 400)
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch Room Data
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      return jsonResponse({ error: `Sala não encontrada: ${roomError.message}` }, 404)
    }

    // 3. Fetch history (last 20 messages)
    const { data: messages } = await supabaseClient
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20)

    const history = messages?.reverse()
      .map((m: any) => `${m.player_name}: ${m.content}`)
      .join('\n') || ''

    // 4. Build prompt
    const campaignName = room.campaign_name || room.name || 'Aventura'
    const campaignDesc = room.campaign_description || ''
    const charName = characterContext?.name || 'Aventureiro'
    const charClass = characterContext?.class || ''
    const charRace = characterContext?.race || ''

    let systemPrompt = `Você é o Mestre Narrador de uma campanha de RPG chamada "${campaignName}".`
    if (campaignDesc) systemPrompt += ` Contexto: ${campaignDesc}.`
    systemPrompt += ` O jogador controla ${charName}, um(a) ${charRace} ${charClass}.`
    systemPrompt += ` Narre de forma épica e envolvente em português brasileiro, com descrições vívidas.`
    systemPrompt += ` Mantenha continuidade com o histórico. Responda em 2-4 parágrafos.`

    let userPrompt: string
    if (isChronicle) {
      userPrompt = `Com base no histórico abaixo, gere uma crônica épica resumindo os eventos:\n\n${history}`
    } else {
      userPrompt = `Histórico recente:\n${history}\n\nAção do jogador: ${message}`
    }

    // 5. Call Gemini API
    const MODELS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-001',
    ]

    // Try both API versions
    const API_VERSIONS = ['v1beta', 'v1']

    let lastError = ''

    for (const model of MODELS) {
      for (const apiVersion of API_VERSIONS) {
      try {
        console.log(`[AI-MASTER] Tentando modelo: ${model} (${apiVersion})`)
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${geminiKey}`

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
            ],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
          }),
        })

        if (!geminiRes.ok) {
          const errBody = await geminiRes.text()
          lastError = `${model}: HTTP ${geminiRes.status} - ${errBody.slice(0, 200)}`
          console.error(`[AI-MASTER] Falha ${lastError}`)
          continue
        }

        const geminiData = await geminiRes.json()
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
          lastError = `${model}: Resposta vazia do Gemini. Possível bloqueio de segurança.`
          console.error(`[AI-MASTER] ${lastError}`)
          continue
        }

        // 6. Save narration to DB
        await supabaseClient.from('room_messages').insert({
          room_id: roomId,
          player_name: 'Narrador IA',
          content: text,
          type: isChronicle ? 'chronicle' : 'narration',
        })

        console.log(`[AI-MASTER] Sucesso com ${model}! (${text.length} chars)`)
        return jsonResponse({ text })

      } catch (err) {
        lastError = `${model}/${apiVersion}: ${String(err)}`
        console.error(`[AI-MASTER] Exceção: ${lastError}`)
        continue
      }
      }
    }

    // All models failed
    return jsonResponse({ error: `Falha na IA após tentar todos os modelos. Último erro: ${lastError}` }, 500)

  } catch (err) {
    console.error('[AI-MASTER] Erro fatal:', err)
    return jsonResponse({ error: `Erro interno: ${String(err)}` }, 500)
  }
})
