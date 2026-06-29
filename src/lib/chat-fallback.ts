// Sistema de respostas inteligentes offline (fallback quando API falha)

interface UserProfile {
  name: string
  goal: string
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
  dietaryPreferences: string[]
  medication?: string
}

// Contador de respostas para evitar repetições
const responseCount = new Map<string, number>()

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getResponseVariant(category: string, variants: string[]): string {
  const count = responseCount.get(category) || 0
  responseCount.set(category, count + 1)

  // Rotacionar entre variantes baseado no contador
  return variants[count % variants.length]
}

export function getFallbackResponse(message: string, user: UserProfile | null): string {
  const lowerMessage = message.toLowerCase()

  // SAUDAÇÕES (10 variantes)
  if (lowerMessage.match(/^(oi|olá|ola|hey|ei|bom dia|boa tarde|boa noite|hello)/)) {
    const greetings = [
      `Olá${user ? `, ${user.name}` : ''}! 👋 Como vai você hoje? Estou aqui para ajudar com dicas de nutrição, receitas ou motivação!`,
      `Oi${user ? `, ${user.name}` : ''}! 😊 Que bom te ver por aqui! Como posso te ajudar hoje?`,
      `Hey${user ? `, ${user.name}` : ''}! 🌟 Pronto para conquistar seus objetivos? Me diga como posso ajudar!`,
      `E aí${user ? `, ${user.name}` : ''}! 💪 Bora conversar sobre saúde? Estou aqui pra te apoiar!`,
      `Olá! 👋 ${user?.goal === 'perder_peso' ? 'Vamos focar na perda de peso hoje?' : user?.goal === 'ganhar_massa' ? 'Pronto para ganhar massa?' : 'Como posso ajudar?'}`,
      `Oi! 🎯 Que legal te ver! Podemos falar sobre treinos, nutrição ou qualquer dúvida que você tiver!`,
      `Hey! ✨ ${user ? `${user.name}, ` : ''}me conta, o que você precisa hoje? Receitas, motivação, treinos?`,
      `Olá${user ? `, ${user.name}` : ''}! 🌈 Seu assistente de saúde está aqui! Me pergunte o que quiser!`,
      `E aí! 🚀 Bora conversar? Posso te ajudar com alimentação, exercícios ou dicas de bem-estar!`,
      `Oi${user ? `, ${user.name}` : ''}! 💚 Feliz em te ver! Como anda sua jornada de saúde?`
    ]
    return getResponseVariant('greeting', greetings)
  }

  // RECEITAS - 30+ variações!
  if (lowerMessage.includes('receita') || lowerMessage.includes('cozinhar') || lowerMessage.includes('preparar') ||
      lowerMessage.includes('café da manhã') || lowerMessage.includes('almoço') || lowerMessage.includes('jantar') ||
      lowerMessage.includes('lanche') || lowerMessage.includes('comida')) {

    const isVegetarian = user?.dietaryPreferences.includes('vegetariano')
    const isVegan = user?.dietaryPreferences.includes('vegano')
    const isLowCarb = user?.dietaryPreferences.includes('low_carb')
    const isDiabetic = user?.dietaryPreferences.includes('diabetes')

    // Banco de receitas vegetarianas/veganas
    const vegetarianRecipes = [
      `🥗 **Bowl de Quinoa com Legumes Assados**\n\n- 1 xícara de quinoa cozida\n- Abobrinha, berinjela, pimentão assados\n- Grão de bico temperado\n- Molho tahine com limão\n\nAssar os vegetais com azeite e ervas. Servir sobre a quinoa com o molho. Delicioso e completo! (~${user?.targetCalories ? Math.round(user.targetCalories * 0.2) : 400} kcal)`,

      `🍝 **Macarrão Integral com Pesto de Manjericão**\n\n- 100g macarrão integral\n- Manjericão, alho, castanha, azeite (pesto)\n- Tomates cereja\n- Parmesão ralado${isVegan ? ' vegano' : ''}\n\nBata o pesto no processador, cozinhe a massa al dente e misture. Rico em fibras! (~${user?.targetProtein || 20}g proteína)`,

      `🥙 **Wrap de Falafel Caseiro**\n\n- Grão de bico, coentro, cominho (falafel)\n- Tortilla integral\n- Salada verde, tomate, pepino\n- Molho de iogurte${isVegan ? ' de coco' : ''}\n\nModele os falafels e asse no forno. Monte o wrap com salada fresca. Proteína vegetal completa!`,

      `🍲 **Curry de Grão de Bico com Espinafre**\n\n- 2 xícaras de grão de bico\n- Espinafre fresco\n- Leite de coco light\n- Curry, gengibre, alho\n\nRefogue as especiarias, adicione grão de bico e espinafre. Cozinhe com leite de coco. Sirva com arroz integral! 🔥`,

      `🥗 **Salada Completa de Lentilhas**\n\n- Lentilhas cozidas\n- Rúcula, tomate seco, nozes\n- Queijo feta${isVegan ? ' vegano' : ''}\n- Vinagrete balsâmico\n\nMisture tudo e tempere. Refeição completa e refrescante! Alto em proteína e fibras.`
    ]

    // Banco de receitas low carb
    const lowCarbRecipes = [
      `🥩 **Filé de Frango com Crosta de Castanhas**\n\n- 150g filé de frango\n- Castanhas trituradas\n- Aspargos grelhados\n- Manteiga de ervas\n\nEmpane o frango na castanha, asse e sirva com aspargos. Apenas 3g de carboidrato! Alta proteína: ~${user?.targetProtein || 35}g!`,

      `🥑 **Omelete Recheado Low Carb**\n\n- 3 ovos inteiros\n- Queijo, presunto, tomate\n- Abacate em fatias\n- Azeite e temperos\n\nBata os ovos, faça a omelete, recheie e dobre. Sirva com abacate. Zero carboidrato processado! 🥚`,

      `🍤 **Camarão no Alho e Óleo com Zoodles**\n\n- 200g camarão limpo\n- Abobrinha em espiral (zoodles)\n- Muito alho e azeite\n- Pimenta calabresa\n\nRefogue o camarão com alho, pule os zoodles rapidamente. Substituto perfeito do macarrão! (<5g carbs)`,

      `🥩 **Bife na Manteiga com Brócolis**\n\n- 180g contrafilé\n- Brócolis no vapor\n- Manteiga ghee\n- Sal grosso e pimenta\n\nGrelhe o bife em fogo alto, finalize com manteiga. Sirva com brócolis. Keto-friendly! 💪`,

      `🐟 **Salmão Grelhado com Couve-Flor**\n\n- 150g salmão fresco\n- Purê de couve-flor\n- Limão e endro\n- Azeite extra-virgem\n\nGrelhe o salmão, faça purê com a couve-flor. Ômega 3 + baixo carb! (~2g carbs, ${user?.targetProtein || 30}g proteína)`
    ]

    // Receitas para diabéticos
    const diabeticRecipes = [
      `🥘 **Strogonoff Fit de Frango**\n\n- Frango em cubos\n- Cogumelos frescos\n- Iogurte grego natural\n- Arroz integral (1/2 xícara)\n\nRefogue tudo com pouco óleo. Use iogurte ao invés de creme de leite. Baixo índice glicêmico! IG ~40`,

      `🥗 **Bowl Mediterrâneo Completo**\n\n- Arroz integral ou quinoa\n- Grão de bico assado\n- Vegetais grelhados\n- Molho de iogurte\n\nPorções controladas de carboidrato complexo. Proteína e fibras equilibradas. Perfeito para diabetes! 📊`,

      `🍗 **Frango Teriyaki com Vegetais**\n\n- Peito de frango\n- Shoyu light, gengibre\n- Brócolis, cenoura, pimentão\n- Sem açúcar (use adoçante)\n\nMolho sem açúcar refinado! Vegetais com baixo IG. Saboroso e seguro! 🎯`
    ]

    // Receitas gerais saudáveis
    const generalRecipes = [
      `🍳 **Shakshuka Brasileira**\n\n- 4 ovos\n- Molho de tomate caseiro\n- Pimentão, cebola, alho\n- Coentro fresco\n\nCozinhe os ovos no molho de tomate picante. Sirva com pão integral. Rico em proteína! (~${user?.targetProtein || 24}g)`,

      `🥙 **Tacos de Peixe Grelhado**\n\n- Tilápia ou pescada temperada\n- Tortillas de milho\n- Repolho roxo, abacate\n- Molho de limão\n\nGrelhe o peixe, monte os tacos. Leve, saboroso e saudável! 🐟`,

      `🍲 **Risoto de Abóbora Light**\n\n- Arroz arbóreo (80g)\n- Abóbora em cubos\n- Caldo de legumes\n- Parmesão light\n\nCozinhe devagar adicionando caldo. Cremoso e nutritivo! 🎃`,

      `🥗 **Poke Bowl Tropical**\n\n- Atum ou salmão fresco\n- Arroz japonês\n- Manga, abacate, edamame\n- Molho shoyu gengibre\n\nMonte em camadas no bowl. Explosão de sabores! 🌺`,

      `🍝 **Espaguete de Abobrinha ao Pesto**\n\n- Abobrinha em espiral\n- Pesto de manjericão\n- Tomates cereja\n- Frango desfiado\n\nPule a abobrinha rapidamente, misture com pesto e frango. Baixo carboidrato e delicioso! 🍃`
    ]

    // Selecionar banco apropriado
    let recipeBank = generalRecipes
    if (isVegetarian || isVegan) recipeBank = vegetarianRecipes
    else if (isLowCarb) recipeBank = lowCarbRecipes
    else if (isDiabetic) recipeBank = diabeticRecipes

    return getRandomItem(recipeBank)
  }

  // MOTIVAÇÃO (20 variantes)
  if (lowerMessage.includes('motivação') || lowerMessage.includes('desistir') || lowerMessage.includes('sem vontade') ||
      lowerMessage.includes('cansad') || lowerMessage.includes('desanima') || lowerMessage.includes('difícil')) {

    const motivations = [
      `💪 ${user?.name || 'Você'}, lembra quando você começou? Você queria mudar, e ESTÁ mudando! Cada dia é uma vitória, cada treino é um passo. Você é capaz de muito mais do que imagina! 🔥`,

      `🌟 ${user?.name || 'Ei'}, dias difíceis fazem parte da jornada! O importante é que você está aqui, tentando. Isso já te coloca à frente de 90% das pessoas. Bora lá, você consegue! 💚`,

      `🚀 Sabe qual a diferença entre quem consegue e quem não consegue? **Consistência**. E você está sendo consistente! ${user?.goal === 'perder_peso' ? 'Cada quilo perdido' : 'Cada treino feito'} te aproxima do seu objetivo! 🎯`,

      `💡 ${user?.name || 'Você'}, seu corpo é uma máquina incrível! Ele está se adaptando, ficando mais forte. Confie no processo. Os resultados vêm para quem não desiste! 💪`,

      `🔥 Lembra que você escolheu isso? Não por obrigação, mas porque você QUER ser melhor! Esse é o espírito que vai te levar longe. Vamos com tudo! ⚡`,

      `🌈 Dias ruins acontecem com todo mundo, ${user?.name}. O segredo? Começar de novo amanhã. Você já provou que consegue, agora é só continuar! 🏆`,

      `💎 Cada gota de suor, cada escolha saudável, está construindo a melhor versão de você! E eu estou aqui torcendo por você! Bora! 🙌`,

      `⭐ ${user?.name || 'Você'} é mais forte que qualquer desculpa! Já pensou como vai se sentir quando alcançar sua meta? INCRÍVEL! Continue, vale a pena! 🎉`,

      `🏃 A jornada de ${user?.goal === 'perder_peso' ? 'emagrecimento' : 'ganho de massa'} não é linear. Tem altos e baixos. O importante é não parar! Você está indo bem! 💚`,

      `🎯 Progresso é progresso, não importa quão pequeno! Você está ${user?.goal === 'perder_peso' ? 'perdendo peso' : 'ganhando força'}, e isso é ENORME! Orgulhe-se! 🏅`
    ]

    return getResponseVariant('motivation', motivations)
  }

  // TREINOS (15 variantes com diferentes focos)
  if (lowerMessage.includes('treino') || lowerMessage.includes('exercício') || lowerMessage.includes('malhar') ||
      lowerMessage.includes('gym') || lowerMessage.includes('academia')) {

    const isGainMuscle = user?.goal === 'ganhar_massa'

    const muscleWorkouts = [
      `🏋️ **Treino de Peito e Tríceps (Casa)**\n\n1. Flexões: 4x12-15\n2. Flexões diamante: 3x10\n3. Mergulho em cadeira: 4x12\n4. Flexões inclinadas: 3x15\n\nDescanso: 60-90seg. Foco na contração muscular! 💪`,

      `🦵 **Treino de Pernas Intenso**\n\n1. Agachamento: 5x15\n2. Afundo alternado: 4x12 cada\n3. Agachamento búlgaro: 3x10 cada\n4. Stiff com garrafa: 4x12\n\nPernas são 50% do corpo! Treine pesado! 🔥`,

      `💪 **Treino de Costas e Bíceps**\n\n1. Remada com mochila: 4x12\n2. Pull-ups (ou australiana): 3x8\n3. Rosca com peso: 4x12\n4. Rosca martelo: 3x10\n\nCostas largas = visual incrível! 🦅`,

      `🏋️ **Full Body em Casa**\n\n1. Burpees: 4x10\n2. Agachamento com salto: 3x12\n3. Flexão + remada: 3x10\n4. Prancha lateral: 3x30seg cada\n\nTreino completo em 30 minutos! ⚡`
    ]

    const cardioWorkouts = [
      `🏃 **HIIT para Queimar Gordura (20min)**\n\n1. Sprint no lugar: 30seg ON / 30seg OFF\n2. Burpees: 40seg ON / 20seg OFF\n3. Mountain Climbers: 30seg ON / 30seg OFF\n4. Polichinelo: 40seg ON / 20seg OFF\n\n5 rodadas! Máxima intensidade! 🔥`,

      `🚴 **Treino Aeróbico Moderado**\n\n1. Caminhada rápida: 10min aquecimento\n2. Corrida leve: 20-30min\n3. Pular corda: 5min\n4. Alongamento: 10min\n\nQueima calorias e preserva músculos! 💚`,

      `⚡ **Circuito Metabólico**\n\n1. Jumping Jacks: 1min\n2. Agachamento: 40seg\n3. Flexão: 30seg\n4. Prancha: 40seg\n\n4 rodadas sem pausa! Cardio + força! 💪`
    ]

    const workoutBank = isGainMuscle ? muscleWorkouts : cardioWorkouts
    return getRandomItem(workoutBank)
  }

  // ÁGUA/HIDRATAÇÃO (8 variantes)
  if (lowerMessage.includes('água') || lowerMessage.includes('hidrat') || lowerMessage.includes('beber') || lowerMessage.includes('sede')) {
    const waterGoal = user?.targetCalories ? (user.targetCalories * 0.035).toFixed(1) : '2.5'

    const waterTips = [
      `💧 Hidratação é vida! Sua meta: **${waterGoal}L por dia**\n\n✅ Benefícios:\n- Acelera metabolismo\n- Reduz inchaço\n- Melhora pele\n- Aumenta energia\n\nDica: Beba 1 copo a cada hora! Use o app para registrar! 💦`,

      `💦 Você sabia? **Desidratação pode parecer fome!** 🤯\n\nMeta: ${waterGoal}L/dia\n\nDicas:\n1. Garrafa sempre à mão\n2. Alarmes no celular\n3. Água antes das refeições\n4. Chás sem açúcar contam!\n\nRegistre seu consumo! 📊`,

      `🥤 Água é o melhor suplemento! 💎\n\nBeba ${waterGoal}L hoje:\n- Melhora treinos em 20%\n- Aumenta saciedade\n- Desintoxica o corpo\n- Zero calorias!\n\nJá bebeu hoje? Vai lá registrar no app! 💚`
    ]

    return getResponseVariant('water', waterTips)
  }

  // JEJUM (10 variantes)
  if (lowerMessage.includes('jejum') || lowerMessage.includes('janela') || lowerMessage.includes('fasting')) {
    const fastingTips = [
      `⏰ **Jejum Intermitente Explicado:**\n\n🟢 Iniciante: 12:12 (ex: jejum 20h-8h)\n🟡 Intermediário: 16:8 (jejum 20h-12h)\n🔴 Avançado: 18:6 ou 20:4\n\n**Durante o jejum**: Água, chá, café sem açúcar\n**Quebre com**: Refeição leve e nutritiva\n\nConfigure na aba Jejum! 🕐`,

      `🍽️ **Como Fazer Jejum Corretamente:**\n\n1. Comece devagar (12h)\n2. Aumente gradualmente\n3. Hidrate-se muito!\n4. Quebre com proteína\n5. Ouça seu corpo\n\n${user?.goal === 'perder_peso' ? 'Ótimo para perda de peso!' : 'Ajuda na definição muscular!'} ⚡`,

      `⏱️ **Protocolos de Jejum:**\n\n• 16:8 → Mais popular\n• 18:6 → Mais resultados\n• 20:4 → Dieta do Guerreiro\n• 24h → OMAD (1 refeição)\n\n**Dica**: Comece no fim de semana para adaptar! O app te ajuda a controlar! 📱`
    ]

    return getResponseVariant('fasting', fastingTips)
  }

  // CALORIAS/DIETA (12 variantes)
  if (lowerMessage.includes('caloria') || lowerMessage.includes('comer') || lowerMessage.includes('dieta') || lowerMessage.includes('macros')) {
    const cals = user?.targetCalories || 2000
    const protein = user?.targetProtein || 120
    const carbs = user?.targetCarbs || 200
    const fat = user?.targetFat || 60

    const nutritionTips = [
      `🍽️ **Seu Plano Nutricional:**\n\n📊 Macros Diárias:\n- Calorias: ${cals} kcal\n- Proteína: ${protein}g\n- Carboidratos: ${carbs}g\n- Gorduras: ${fat}g\n\nDivida em 4-5 refeições! Registre tudo no app! 📱`,

      `🥗 **Distribuição Ideal das Refeições:**\n\n🌅 Café (25%): ${Math.round(cals * 0.25)} kcal\n☀️ Almoço (35%): ${Math.round(cals * 0.35)} kcal\n🍎 Lanche (15%): ${Math.round(cals * 0.15)} kcal\n🌙 Jantar (25%): ${Math.round(cals * 0.25)} kcal\n\nEquilíbrio é tudo! 🎯`,

      `💡 **Dica de Ouro sobre Proteína:**\n\nMeta: ${protein}g/dia\n\n✅ Fontes:\n- Frango: 30g/100g\n- Ovo: 6g/unidade\n- Atum: 25g/lata\n- Feijão: 9g/concha\n\nProteína = Saciedade + Músculos! 💪`
    ]

    return getResponseVariant('nutrition', nutritionTips)
  }

  // SONO (8 variantes)
  if (lowerMessage.includes('sono') || lowerMessage.includes('dormir') || lowerMessage.includes('insônia') || lowerMessage.includes('cansaço')) {
    const sleepTips = [
      `😴 **Guia para Sono de Qualidade:**\n\n🌙 Durma 7-9h por noite\n📵 Sem telas 1h antes\n🌡️ Quarto fresco e escuro\n☕ Zero cafeína pós 16h\n🧘 Medite antes (use o app!)\n\nSono = Recuperação muscular! 💤`,

      `💤 **Rotina Noturna Perfeita:**\n\n21h: Jantar leve\n22h: Banho morno\n22:30h: Meditação 10min\n23h: Luzes apagadas\n\nSeu corpo precisa de ritmo! O sono afeta ${user?.goal === 'perder_peso' ? 'a perda de peso' : 'o ganho de massa'}! 🌙`,

      `🛌 **Por que o sono é crucial:**\n\n✅ Regula hormônios\n✅ Recupera músculos\n✅ Controla apetite\n✅ Aumenta metabolismo\n\n7-9h é a meta! Use a meditação guiada do app! 😴`
    ]

    return getResponseVariant('sleep', sleepTips)
  }

  // PESO/GORDURA (10 variantes)
  if (lowerMessage.includes('emagrec') || lowerMessage.includes('perder peso') || lowerMessage.includes('gordura') || lowerMessage.includes('barriga')) {
    const weightLossTips = [
      `📉 **Perda de Peso Saudável e Sustentável:**\n\n1. Déficit de 300-500 kcal\n2. Proteína alta (${user?.targetProtein || 120}g)\n3. Treino 4x/semana\n4. Sono 8h/noite\n5. Água ${user?.targetCalories ? (user.targetCalories * 0.035).toFixed(1) : 2.5}L/dia\n\nMeta: 0,5-1kg por semana 🎯`,

      `🔥 **Verdades sobre Emagrecimento:**\n\n❌ Não existe perda localizada\n✅ Déficit calórico é essencial\n✅ Exercício acelera o processo\n✅ Consistência > Perfeição\n\nVocê está no caminho certo! 💚`,

      `💪 **Estratégias Comprovadas:**\n\n• Proteína em todas refeições\n• Cardio 3-4x/semana\n• Treino de força (mantém músculos)\n• ${user?.targetCalories || 1800} kcal/dia\n• Paciência e constância\n\nResultados levam tempo! 🏆`
    ]

    return getResponseVariant('weightloss', weightLossTips)
  }

  // MASSA MUSCULAR (8 variantes)
  if (lowerMessage.includes('ganhar massa') || lowerMessage.includes('músculo') || lowerMessage.includes('hipertrofia') || lowerMessage.includes('crescer')) {
    const muscleTips = [
      `💪 **Fórmula do Ganho de Massa:**\n\n1. Superávit: +300-500 kcal\n2. Proteína: ${user?.targetProtein || 150}g/dia\n3. Treino pesado: 4-5x/semana\n4. Descanso: 48h entre grupos\n5. Sono: 8-9h obrigatório\n\nMúsculo cresce no descanso! 🏋️`,

      `🥩 **Nutrição para Hipertrofia:**\n\n📊 ${user?.targetCalories || 2500} kcal/dia\n🥚 ${user?.targetProtein || 150}g proteína\n🍚 ${user?.targetCarbs || 300}g carboidratos\n🥑 ${user?.targetFat || 70}g gorduras\n\nComa a cada 3-4h! Volume é rei! 👑`,

      `🏆 **Regras de Ouro:**\n\n1. Progressão de carga\n2. Técnica perfeita\n3. Coma mais do que gasta\n4. Durma muito\n5. Seja paciente\n\nGanho saudável: 0,5-1kg/mês 💎`
    ]

    return getResponseVariant('muscle', muscleTips)
  }

  // SUPLEMENTOS (10 variantes)
  if (lowerMessage.includes('suplemento') || lowerMessage.includes('whey') || lowerMessage.includes('creatina') || lowerMessage.includes('vitamina')) {
    const supplementTips = [
      `💊 **Suplementos Essenciais:**\n\n🥇 Prioridade:\n- Whey Protein (se não atingir ${user?.targetProtein || 120}g)\n- Creatina 5g/dia\n- Multivitamínico\n- Ômega 3\n\n⚠️ Comida > Suplemento! Base sólida primeiro! 🥗`,

      `🔬 **O que Realmente Funciona:**\n\n✅ Creatina: +5-10% força\n✅ Whey: Conveniência proteica\n✅ Cafeína: Pré-treino natural\n❌ Termogênicos: Desnecessários\n\nFoco na alimentação! 🎯`,

      `💡 **Quando Suplementar:**\n\n1. Se não come proteína suficiente → Whey\n2. Para performance → Creatina\n3. Vegetariano/Vegano → B12, Ferro\n4. Pouco sol → Vitamina D\n\nNão é obrigatório! 🌟`
    ]

    return getResponseVariant('supplements', supplementTips)
  }

  // ANSIEDADE/ESTRESSE (8 variantes)
  if (lowerMessage.includes('ansied') || lowerMessage.includes('stress') || lowerMessage.includes('ansiosa') || lowerMessage.includes('nervos')) {
    const mentalHealthTips = [
      `🧘 **Controle da Ansiedade:**\n\n✨ Estratégias:\n1. Meditação 10min/dia (use o app!)\n2. Exercício regular\n3. Sono adequado\n4. Alimentação equilibrada\n5. Evite cafeína em excesso\n\n⚠️ Procure ajuda profissional se persistir! 💚`,

      `🌈 **Saúde Mental = Saúde Física:**\n\n${user?.name || 'Você'}, cuidar da mente é tão importante quanto do corpo!\n\n📱 Use a meditação guiada\n🏃 Exercício libera endorfina\n😴 Sono regula humor\n🥗 Nutrição afeta cérebro\n\nVocê não está sozinho! 🤗`,

      `💚 **Respiração Anti-Ansiedade:**\n\n1. Inspire 4 segundos\n2. Segure 4 segundos\n3. Expire 6 segundos\n4. Repita 5x\n\nFaça agora! Funciona! Use a meditação no app também! 🧘‍♀️`
    ]

    return getResponseVariant('mental', mentalHealthTips)
  }

  // MEDICAÇÃO GLP-1 (específico)
  if (user?.medication && user.medication !== 'nenhum' &&
      (lowerMessage.includes('medicação') || lowerMessage.includes('ozempic') || lowerMessage.includes('saxenda') ||
       lowerMessage.includes('mounjaro') || lowerMessage.includes('wegovy'))) {
    return `💊 **Sobre ${user.medication}:**\n\n✅ Seu plano já está ajustado!\n\n⚠️ Importante:\n- Siga orientação médica\n- Mantenha alimentação balanceada\n- Hidrate-se muito (${user?.targetCalories ? (user.targetCalories * 0.035).toFixed(1) : 2.5}L/dia)\n- Monitore efeitos colaterais\n- Não pule refeições\n\n🏥 Sempre consulte seu médico sobre dúvidas da medicação!`
  }

  // RESPOSTA GENÉRICA (10 variantes)
  const genericResponses = [
    `Entendi, ${user?.name || 'você'}! 🤔 Posso te ajudar com:\n\n🍽️ Receitas personalizadas\n💪 Treinos para ${user?.goal === 'ganhar_massa' ? 'ganho de massa' : 'perder peso'}\n⏰ Jejum intermitente\n💧 Hidratação\n😴 Dicas de sono\n📊 Macros e calorias\n\nO que mais te interessa agora?`,

    `Legal! ${user?.name ? `${user.name}, ` : ''}vou listar o que posso fazer:\n\n✨ Criar receitas adaptadas a você\n🏋️ Sugerir treinos\n🧘 Dicas de meditação e bem-estar\n⚡ Motivação personalizada\n📈 Orientações sobre sua meta\n\nSobre o que quer conversar?`,

    `Certo! Estou aqui para:\n\n🎯 Ajudar com sua meta: ${user?.goal === 'perder_peso' ? 'perder peso' : user?.goal === 'ganhar_massa' ? 'ganhar massa' : 'manter peso'}\n🍴 Planejar refeições\n💪 Montar treinos\n😊 Te motivar\n📚 Tirar dúvidas\n\nMe pergunte qualquer coisa!`
  ]

  return getResponseVariant('generic', genericResponses)
}
