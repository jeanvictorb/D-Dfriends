import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseAnonKey = 'sb_publishable_KLqZaN3KHNqZDVEcz2siTg_74oQJ3qx'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function iniciaAventura() {
  const channel = supabase.channel('mesa')
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      console.log('--- INICIANDO AVENTURA ---')
      
      // 1. Definir o Cenário: Taverna Aconchegante
      await channel.send({
        type: 'broadcast',
        event: 'background_update',
        payload: { url: '/images/scenes/taverna.png' }
      })
      console.log('Cenário: Taverna definido.')

      // 2. Primeira Narração (IA)
      const narracao = "O som de canecas de madeira batendo e risadas abafadas preenche o ar pesado com o cheiro de ensopado de cordeiro e fumaça de cachimbo. Vocês estão na 'Estalagem do Descanso do Viajante', em uma mesa de canto, quando um homem de manto cinzento se aproxima com um mapa gasto em mãos..."
      
      await channel.send({
        type: 'broadcast',
        event: 'dice_log',
        payload: {
          player: 'IA',
          dieType: narracao,
          naturalRoll: 0,
          modifier: 0,
          total: 0,
          timestamp: new Date().toISOString()
        }
      })
      console.log('Narração enviada ao chat.')
      
      process.exit(0)
    }
  })
}

iniciaAventura()
