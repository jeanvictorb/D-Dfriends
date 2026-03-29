import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de Estilo -> Voz do ElevenLabs (IDs Universais/Predefined)
// IDs sugeridos para D&D (Antoni para Épico, Bella para Sombrio, Josh para Cômico)
const VOICE_MAPPING: Record<string, string> = {
  'Épico': 'ErXw9S1brP2cc7sK0EwT',   // Antoni
  'Sombrio': 'EXAVITQu4vr4xnSDxMaL', // Bella
  'Cômico': 'TxGEqnHW47dbu7pS8r2J',  // Josh
  'default': 'ErXw9S1brP2cc7sK0EwT'
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    let text = ''
    let style = 'default'
    
    if (req.method === 'POST') {
      const body = await req.json()
      text = body.text
      style = body.style || 'default'
    } else {
      const url = new URL(req.url)
      text = url.searchParams.get('text') || ''
      style = url.searchParams.get('style') || 'default'
    }

    if (!text) {
      return new Response(JSON.stringify({ error: 'Faltando o parâmetro text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    let audioBuffer: ArrayBuffer | null = null

    // 1. Tentar ElevenLabs
    if (API_KEY) {
      let voiceId = VOICE_MAPPING[style] || VOICE_MAPPING['default']
      console.log(`[tts] ElevenLabs: Tentando voz ${voiceId}...`)

      const callElevenLabs = async (id: string) => {
        return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'xi-api-key': API_KEY 
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        })
      }

      let response = await callElevenLabs(voiceId)

      // Se der 404 ou 401, tenta descobrir uma voz válida na conta
      if (!response.ok) {
        console.warn(`[tts] ElevenLabs falhou (Status: ${response.status}). Buscando vozes disponíveis...`)
        try {
          const voicesRes = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': API_KEY }
          })
          
          if (voicesRes.ok) {
            const { voices } = await voicesRes.json()
            if (voices && voices.length > 0) {
              voiceId = voices[0].voice_id
              console.log(`[tts] Usando voz alternativa da conta: ${voiceId}`)
              response = await callElevenLabs(voiceId)
            }
          }
        } catch (e) {
          console.error('[tts] Erro ao buscar vozes alternativas:', e.message)
        }
      }

      if (response.status === 200) {
        audioBuffer = await response.arrayBuffer()
        console.log(`[tts] ElevenLabs: Sucesso! (${audioBuffer.byteLength} bytes)`)
      } else {
        const errText = await response.text()
        console.error(`[tts] ElevenLabs desistiu: ${response.status} - ${errText}`)
      }
    }

    // 2. Fallback: Google Translate (Suporte a textos longos e falhas de cota/vozes)
    if (!audioBuffer) {
      console.log('[tts] Google Translate: Fallback ativado.')
      
      const chunks = text.match(/[^.!?\n]+[.!?\n]?/g) || [text]
      const processedChunks: string[] = []
      
      for (const piece of chunks) {
        let current = piece.trim()
        while (current.length > 0) {
          // Limite de 200 caracteres para o Google Translate
          processedChunks.push(current.substring(0, 180))
          current = current.substring(180)
        }
      }

      const buffers: Uint8Array[] = []
      for (const phrase of processedChunks) {
        if (!phrase.trim()) continue
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(phrase)}&tl=pt-BR&client=tw-ob`
        
        try {
          const res = await fetch(ttsUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
          })
          
          if (res.ok) {
            buffers.push(new Uint8Array(await res.arrayBuffer()))
          } else {
            console.warn(`[tts] Google fragmento falhou: ${res.status} para "${phrase.substring(0, 20)}"`)
          }
        } catch (e) {
          console.error(`[tts] Erro no fragmento Google: ${e.message}`)
        }
      }

      if (buffers.length > 0) {
        const total = buffers.reduce((acc, b) => acc + b.length, 0)
        const combined = new Uint8Array(total)
        let offset = 0
        for (const b of buffers) {
          combined.set(b, offset)
          offset += b.length
        }
        audioBuffer = combined.buffer
        console.log(`[tts] Google Translate: Sucesso! (${audioBuffer.byteLength} bytes)`)
      }
    }

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Nenhum serviço de voz conseguiu gerar o áudio')
    }

    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    })

  } catch (error: any) {
    console.error('[tts] Erro Crítico:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


