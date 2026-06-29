import type { FoodItem } from '@/types'

export const BRAZILIAN_FOODS: FoodItem[] = [
  // ========== CARBOIDRATOS ==========

  // Arroz
  { id: '1', name: 'Arroz branco cozido', category: 'carboidrato', portion: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, isBrazilian: true, isHealthy: false },
  { id: '2', name: 'Arroz integral cozido', category: 'carboidrato', portion: '100g', calories: 123, protein: 2.6, carbs: 26, fat: 1, fiber: 2.7, isBrazilian: true, isHealthy: true },
  { id: '201', name: 'Arroz parboilizado cozido', category: 'carboidrato', portion: '100g', calories: 125, protein: 2.5, carbs: 27, fat: 0.4, fiber: 1.2, isBrazilian: true, isHealthy: true },
  { id: '202', name: 'Arroz com feijão', category: 'carboidrato', portion: '100g', calories: 145, protein: 5, carbs: 25, fat: 1.5, fiber: 4, isBrazilian: true, isHealthy: true },

  // Pães
  { id: '7', name: 'Pão francês', category: 'carboidrato', portion: '50g', calories: 135, protein: 4, carbs: 28, fat: 1, fiber: 1.5, isBrazilian: true, isHealthy: false },
  { id: '203', name: 'Pão integral', category: 'carboidrato', portion: '50g', calories: 120, protein: 5, carbs: 22, fat: 2, fiber: 4, isBrazilian: false, isHealthy: true },
  { id: '204', name: 'Pão de forma branco', category: 'carboidrato', portion: '25g (1 fatia)', calories: 70, protein: 2, carbs: 13, fat: 0.5, fiber: 0.8, isBrazilian: false, isHealthy: false },
  { id: '205', name: 'Pão de forma integral', category: 'carboidrato', portion: '25g (1 fatia)', calories: 65, protein: 2.5, carbs: 11, fat: 1, fiber: 2, isBrazilian: false, isHealthy: true },
  { id: '206', name: 'Pão de queijo', category: 'carboidrato', portion: '50g (1 unidade)', calories: 165, protein: 4, carbs: 20, fat: 7, fiber: 0.5, isBrazilian: true, isHealthy: false },

  // Massas
  { id: '13', name: 'Macarrão integral cozido', category: 'carboidrato', portion: '100g', calories: 124, protein: 5, carbs: 26, fat: 0.6, fiber: 4.5, isBrazilian: false, isHealthy: true },
  { id: '207', name: 'Macarrão branco cozido', category: 'carboidrato', portion: '100g', calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, isBrazilian: false, isHealthy: false },
  { id: '208', name: 'Lasanha', category: 'carboidrato', portion: '100g', calories: 140, protein: 7, carbs: 18, fat: 4, fiber: 1.5, isBrazilian: false, isHealthy: false },

  // Tubérculos
  { id: '4', name: 'Batata doce cozida', category: 'carboidrato', portion: '100g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, isBrazilian: true, isHealthy: true },
  { id: '209', name: 'Batata doce assada', category: 'carboidrato', portion: '100g', calories: 90, protein: 2, carbs: 21, fat: 0.2, fiber: 3.3, isBrazilian: true, isHealthy: true },
  { id: '210', name: 'Batata inglesa cozida', category: 'carboidrato', portion: '100g', calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 1.8, isBrazilian: false, isHealthy: true },
  { id: '211', name: 'Batata frita', category: 'carboidrato', portion: '100g', calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, isBrazilian: false, isHealthy: false },
  { id: '101', name: 'Mandioca cozida', category: 'carboidrato', portion: '100g', calories: 125, protein: 1, carbs: 30, fat: 0.3, fiber: 1.8, isBrazilian: true, isHealthy: true },
  { id: '212', name: 'Mandioca frita', category: 'carboidrato', portion: '100g', calories: 360, protein: 1.5, carbs: 40, fat: 22, fiber: 2, isBrazilian: true, isHealthy: false },
  { id: '102', name: 'Inhame cozido', category: 'carboidrato', portion: '100g', calories: 116, protein: 1.5, carbs: 27, fat: 0.2, fiber: 4.1, isBrazilian: true, isHealthy: true },

  // Outros carboidratos
  { id: '8', name: 'Tapioca', category: 'carboidrato', portion: '70g (1 unidade)', calories: 140, protein: 0.2, carbs: 35, fat: 0.1, fiber: 0.5, isBrazilian: true, isHealthy: true },
  { id: '103', name: 'Polenta', category: 'carboidrato', portion: '100g', calories: 70, protein: 1.5, carbs: 15, fat: 0.5, fiber: 1, isBrazilian: true, isHealthy: true },
  { id: '213', name: 'Cuscuz paulista', category: 'carboidrato', portion: '100g', calories: 112, protein: 2.8, carbs: 24, fat: 0.4, fiber: 1.2, isBrazilian: true, isHealthy: true },
  { id: '214', name: 'Granola', category: 'carboidrato', portion: '30g', calories: 140, protein: 3, carbs: 22, fat: 4.5, fiber: 3, isBrazilian: false, isHealthy: true },
  { id: '215', name: 'Aveia em flocos', category: 'carboidrato', portion: '30g', calories: 117, protein: 4.5, carbs: 20, fat: 2.1, fiber: 3.1, isBrazilian: false, isHealthy: true },

  // ========== PROTEÍNAS ==========

  // Carnes bovinas
  { id: '12', name: 'Carne bovina - Patinho grelhado', category: 'proteina', portion: '100g', calories: 164, protein: 28, carbs: 0, fat: 5, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '301', name: 'Carne bovina - Alcatra grelhada', category: 'proteina', portion: '100g', calories: 189, protein: 27, carbs: 0, fat: 8, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '302', name: 'Carne bovina - Filé mignon grelhado', category: 'proteina', portion: '100g', calories: 172, protein: 28, carbs: 0, fat: 6, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '303', name: 'Carne bovina - Contrafilé grelhado', category: 'proteina', portion: '100g', calories: 234, protein: 25, carbs: 0, fat: 14, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '304', name: 'Carne bovina - Picanha grelhada', category: 'proteina', portion: '100g', calories: 292, protein: 22, carbs: 0, fat: 22, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '305', name: 'Carne bovina moída (magra)', category: 'proteina', portion: '100g', calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '306', name: 'Hambúrguer bovino caseiro', category: 'proteina', portion: '100g', calories: 250, protein: 19, carbs: 0, fat: 19, fiber: 0, isBrazilian: false, isHealthy: false },

  // Frango
  { id: '3', name: 'Frango - Peito grelhado', category: 'proteina', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '307', name: 'Frango - Peito cozido', category: 'proteina', portion: '100g', calories: 163, protein: 30.5, carbs: 0, fat: 3.5, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '308', name: 'Frango - Coxa grelhada sem pele', category: 'proteina', portion: '100g', calories: 184, protein: 26, carbs: 0, fat: 8, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '309', name: 'Frango - Coxa com pele', category: 'proteina', portion: '100g', calories: 247, protein: 20, carbs: 0, fat: 18, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '310', name: 'Frango - Sobrecoxa grelhada sem pele', category: 'proteina', portion: '100g', calories: 195, protein: 25, carbs: 0, fat: 10, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '311', name: 'Frango desfiado', category: 'proteina', portion: '100g', calories: 170, protein: 30, carbs: 0, fat: 5, fiber: 0, isBrazilian: false, isHealthy: true },

  // Peixes
  { id: '104', name: 'Tilápia grelhada', category: 'proteina', portion: '100g', calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '312', name: 'Salmão grelhado', category: 'proteina', portion: '100g', calories: 206, protein: 22, carbs: 0, fat: 13, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '313', name: 'Atum fresco grelhado', category: 'proteina', portion: '100g', calories: 144, protein: 30, carbs: 0, fat: 1.3, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '105', name: 'Atum em lata (água)', category: 'proteina', portion: '100g', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '107', name: 'Sardinha em lata (óleo)', category: 'proteina', portion: '100g', calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '314', name: 'Bacalhau cozido', category: 'proteina', portion: '100g', calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '315', name: 'Camarão cozido', category: 'proteina', portion: '100g', calories: 99, protein: 24, carbs: 0, fat: 0.3, fiber: 0, isBrazilian: false, isHealthy: true },

  // Ovos
  { id: '5', name: 'Ovo cozido', category: 'proteina', portion: '50g (1 unidade)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '316', name: 'Ovo frito', category: 'proteina', portion: '50g (1 unidade)', calories: 92, protein: 6.2, carbs: 0.4, fat: 7, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '317', name: 'Ovo mexido', category: 'proteina', portion: '100g (2 ovos)', calories: 155, protein: 11, carbs: 2, fat: 12, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '318', name: 'Omelete simples', category: 'proteina', portion: '100g (2 ovos)', calories: 154, protein: 10.6, carbs: 1.6, fat: 11.7, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '319', name: 'Clara de ovo cozida', category: 'proteina', portion: '33g (1 clara)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0, isBrazilian: false, isHealthy: true },

  // Leguminosas
  { id: '320', name: 'Feijão preto cozido', category: 'proteina', portion: '100g', calories: 77, protein: 4.5, carbs: 14, fat: 0.5, fiber: 4.9, isBrazilian: true, isHealthy: true },
  { id: '321', name: 'Feijão carioca cozido', category: 'proteina', portion: '100g', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, isBrazilian: true, isHealthy: true },
  { id: '322', name: 'Feijão branco cozido', category: 'proteina', portion: '100g', calories: 139, protein: 9.7, carbs: 25, fat: 0.4, fiber: 6.3, isBrazilian: false, isHealthy: true },
  { id: '323', name: 'Lentilha cozida', category: 'proteina', portion: '100g', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, isBrazilian: false, isHealthy: true },
  { id: '324', name: 'Grão de bico cozido', category: 'proteina', portion: '100g', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, isBrazilian: false, isHealthy: true },
  { id: '325', name: 'Ervilha cozida', category: 'proteina', portion: '100g', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.7, isBrazilian: false, isHealthy: true },

  // Queijos e laticínios
  { id: '9', name: 'Queijo minas frescal', category: 'proteina', portion: '30g (1 fatia)', calories: 70, protein: 5, carbs: 1, fat: 5, fiber: 0, isBrazilian: true, isHealthy: true },
  { id: '326', name: 'Queijo muçarela', category: 'proteina', portion: '30g (1 fatia)', calories: 85, protein: 6.3, carbs: 0.6, fat: 6.4, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '327', name: 'Queijo prato', category: 'proteina', portion: '30g (1 fatia)', calories: 107, protein: 6.5, carbs: 0.6, fat: 8.9, fiber: 0, isBrazilian: true, isHealthy: false },
  { id: '328', name: 'Queijo cottage', category: 'proteina', portion: '100g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '329', name: 'Requeijão light', category: 'proteina', portion: '30g (1 colher)', calories: 50, protein: 2.5, carbs: 2, fat: 3.5, fiber: 0, isBrazilian: true, isHealthy: true },
  { id: '330', name: 'Iogurte grego natural', category: 'proteina', portion: '100g', calories: 97, protein: 9, carbs: 4, fat: 5, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '331', name: 'Iogurte natural desnatado', category: 'proteina', portion: '100g', calories: 43, protein: 4.3, carbs: 5.1, fat: 0.9, fiber: 0, isBrazilian: false, isHealthy: true },

  // Embutidos
  { id: '106', name: 'Peito de peru fatiado', category: 'proteina', portion: '45g (3 fatias)', calories: 55, protein: 10, carbs: 1, fat: 1, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '332', name: 'Presunto magro', category: 'proteina', portion: '45g (3 fatias)', calories: 65, protein: 9, carbs: 1, fat: 2.5, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '333', name: 'Salsicha', category: 'proteina', portion: '50g (1 unidade)', calories: 151, protein: 6, carbs: 2, fat: 13, fiber: 0, isBrazilian: false, isHealthy: false },

  // ========== FRUTAS ==========

  { id: '6', name: 'Banana prata', category: 'fruta', portion: '86g (1 média)', calories: 98, protein: 1.3, carbs: 26, fat: 0.1, fiber: 2.6, isBrazilian: true, isHealthy: true },
  { id: '401', name: 'Banana nanica', category: 'fruta', portion: '118g (1 média)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, isBrazilian: true, isHealthy: true },
  { id: '402', name: 'Banana maçã', category: 'fruta', portion: '75g (1 pequena)', calories: 68, protein: 0.8, carbs: 17, fat: 0.1, fiber: 2.2, isBrazilian: true, isHealthy: true },
  { id: '10', name: 'Mamão papaia', category: 'fruta', portion: '145g (1 fatia)', calories: 55, protein: 0.9, carbs: 14, fat: 0.2, fiber: 2.5, isBrazilian: true, isHealthy: true },
  { id: '403', name: 'Mamão formosa', category: 'fruta', portion: '145g (1 fatia)', calories: 50, protein: 0.8, carbs: 13, fat: 0.1, fiber: 2.3, isBrazilian: true, isHealthy: true },
  { id: '108', name: 'Maçã', category: 'fruta', portion: '182g (1 média)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, isBrazilian: false, isHealthy: true },
  { id: '109', name: 'Laranja', category: 'fruta', portion: '131g (1 média)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, isBrazilian: true, isHealthy: true },
  { id: '404', name: 'Tangerina', category: 'fruta', portion: '88g (1 média)', calories: 47, protein: 0.7, carbs: 12, fat: 0.3, fiber: 1.8, isBrazilian: false, isHealthy: true },
  { id: '110', name: 'Manga', category: 'fruta', portion: '200g (1 média)', calories: 120, protein: 1.6, carbs: 30, fat: 0.8, fiber: 3.2, isBrazilian: true, isHealthy: true },
  { id: '111', name: 'Abacaxi', category: 'fruta', portion: '165g (1 fatia)', calories: 82, protein: 0.9, carbs: 22, fat: 0.2, fiber: 2.3, isBrazilian: true, isHealthy: true },
  { id: '112', name: 'Melancia', category: 'fruta', portion: '280g (1 fatia)', calories: 84, protein: 1.7, carbs: 21, fat: 0.4, fiber: 1.1, isBrazilian: false, isHealthy: true },
  { id: '113', name: 'Morango', category: 'fruta', portion: '152g (1 xícara)', calories: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3, isBrazilian: false, isHealthy: true },
  { id: '405', name: 'Uva', category: 'fruta', portion: '92g (1 xícara)', calories: 62, protein: 0.6, carbs: 16, fat: 0.2, fiber: 0.8, isBrazilian: false, isHealthy: true },
  { id: '406', name: 'Pera', category: 'fruta', portion: '178g (1 média)', calories: 102, protein: 0.6, carbs: 27, fat: 0.2, fiber: 5.5, isBrazilian: false, isHealthy: true },
  { id: '407', name: 'Abacate', category: 'fruta', portion: '100g', calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, isBrazilian: true, isHealthy: true },
  { id: '11', name: 'Açaí puro', category: 'fruta', portion: '100g', calories: 58, protein: 3, carbs: 6, fat: 3.5, fiber: 2.6, isBrazilian: true, isHealthy: true },
  { id: '408', name: 'Goiaba', category: 'fruta', portion: '90g (1 unidade)', calories: 51, protein: 1.8, carbs: 12, fat: 0.5, fiber: 5, isBrazilian: true, isHealthy: true },
  { id: '409', name: 'Kiwi', category: 'fruta', portion: '69g (1 médio)', calories: 42, protein: 0.8, carbs: 10, fat: 0.4, fiber: 2.1, isBrazilian: false, isHealthy: true },
  { id: '410', name: 'Caqui', category: 'fruta', portion: '168g (1 unidade)', calories: 118, protein: 0.9, carbs: 31, fat: 0.3, fiber: 6, isBrazilian: false, isHealthy: true },

  // ========== VEGETAIS ==========

  { id: '14', name: 'Salada verde mista', category: 'vegetal', portion: '100g (1 prato)', calories: 25, protein: 2, carbs: 5, fat: 0.3, fiber: 2, isBrazilian: false, isHealthy: true },
  { id: '114', name: 'Brócolis cozido', category: 'vegetal', portion: '100g', calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, isBrazilian: false, isHealthy: true },
  { id: '501', name: 'Brócolis cru', category: 'vegetal', portion: '100g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, isBrazilian: false, isHealthy: true },
  { id: '115', name: 'Tomate', category: 'vegetal', portion: '123g (1 médio)', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, isBrazilian: false, isHealthy: true },
  { id: '502', name: 'Tomate cereja', category: 'vegetal', portion: '100g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, isBrazilian: false, isHealthy: true },
  { id: '116', name: 'Cenoura crua', category: 'vegetal', portion: '61g (1 média)', calories: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7, isBrazilian: false, isHealthy: true },
  { id: '503', name: 'Cenoura cozida', category: 'vegetal', portion: '100g', calories: 35, protein: 0.8, carbs: 8, fat: 0.2, fiber: 3, isBrazilian: false, isHealthy: true },
  { id: '117', name: 'Couve refogada', category: 'vegetal', portion: '100g', calories: 45, protein: 3, carbs: 8, fat: 0.5, fiber: 2.5, isBrazilian: true, isHealthy: true },
  { id: '504', name: 'Couve crua', category: 'vegetal', portion: '100g', calories: 49, protein: 4.3, carbs: 10, fat: 0.9, fiber: 3.6, isBrazilian: true, isHealthy: true },
  { id: '118', name: 'Abobrinha', category: 'vegetal', portion: '100g', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, isBrazilian: false, isHealthy: true },
  { id: '505', name: 'Berinjela', category: 'vegetal', portion: '100g', calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, isBrazilian: false, isHealthy: true },
  { id: '506', name: 'Chuchu cozido', category: 'vegetal', portion: '100g', calories: 19, protein: 0.8, carbs: 4.5, fat: 0.1, fiber: 1.7, isBrazilian: true, isHealthy: true },
  { id: '507', name: 'Vagem cozida', category: 'vegetal', portion: '100g', calories: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7, isBrazilian: false, isHealthy: true },
  { id: '508', name: 'Espinafre cozido', category: 'vegetal', portion: '100g', calories: 23, protein: 2.9, carbs: 3.8, fat: 0.3, fiber: 2.4, isBrazilian: false, isHealthy: true },
  { id: '509', name: 'Alface', category: 'vegetal', portion: '100g', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, isBrazilian: false, isHealthy: true },
  { id: '510', name: 'Rúcula', category: 'vegetal', portion: '100g', calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, isBrazilian: false, isHealthy: true },
  { id: '511', name: 'Pepino', category: 'vegetal', portion: '100g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, isBrazilian: false, isHealthy: true },
  { id: '512', name: 'Pimentão', category: 'vegetal', portion: '100g', calories: 26, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, isBrazilian: false, isHealthy: true },
  { id: '513', name: 'Beterraba cozida', category: 'vegetal', portion: '100g', calories: 44, protein: 1.7, carbs: 10, fat: 0.2, fiber: 2, isBrazilian: false, isHealthy: true },
  { id: '514', name: 'Repolho cozido', category: 'vegetal', portion: '100g', calories: 23, protein: 1.3, carbs: 5.5, fat: 0.1, fiber: 2.5, isBrazilian: false, isHealthy: true },

  // ========== GORDURAS SAUDÁVEIS ==========

  { id: '119', name: 'Castanha do Pará', category: 'gordura', portion: '5g (1 unidade)', calories: 33, protein: 0.7, carbs: 0.6, fat: 3.3, fiber: 0.4, isBrazilian: true, isHealthy: true },
  { id: '120', name: 'Amendoim', category: 'gordura', portion: '15g (1 colher sopa)', calories: 84, protein: 3.6, carbs: 2.4, fat: 7.2, fiber: 1.2, isBrazilian: true, isHealthy: true },
  { id: '601', name: 'Pasta de amendoim', category: 'gordura', portion: '16g (1 colher sopa)', calories: 94, protein: 4, carbs: 3.5, fat: 8, fiber: 1, isBrazilian: false, isHealthy: true },
  { id: '602', name: 'Castanha de caju', category: 'gordura', portion: '15g (5 unidades)', calories: 83, protein: 2.6, carbs: 4.5, fat: 6.6, fiber: 0.5, isBrazilian: true, isHealthy: true },
  { id: '603', name: 'Amêndoas', category: 'gordura', portion: '15g (10 unidades)', calories: 87, protein: 3.2, carbs: 3.3, fat: 7.5, fiber: 1.8, isBrazilian: false, isHealthy: true },
  { id: '604', name: 'Nozes', category: 'gordura', portion: '15g (5 metades)', calories: 98, protein: 2.3, carbs: 2, fat: 9.8, fiber: 1, isBrazilian: false, isHealthy: true },
  { id: '121', name: 'Azeite de oliva', category: 'gordura', portion: '13g (1 colher sopa)', calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '605', name: 'Óleo de coco', category: 'gordura', portion: '13g (1 colher sopa)', calories: 117, protein: 0, carbs: 0, fat: 13.5, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '606', name: 'Manteiga', category: 'gordura', portion: '10g (1 colher sopa)', calories: 72, protein: 0.1, carbs: 0.1, fat: 8.1, fiber: 0, isBrazilian: false, isHealthy: false },

  // ========== BEBIDAS ==========

  { id: '122', name: 'Leite desnatado', category: 'bebida', portion: '240ml (1 copo)', calories: 83, protein: 8.3, carbs: 12, fat: 0.2, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '701', name: 'Leite integral', category: 'bebida', portion: '240ml (1 copo)', calories: 149, protein: 7.7, carbs: 11.7, fat: 8, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '702', name: 'Leite semidesnatado', category: 'bebida', portion: '240ml (1 copo)', calories: 122, protein: 8, carbs: 12, fat: 4.8, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '123', name: 'Suco de laranja natural', category: 'bebida', portion: '240ml (1 copo)', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, fiber: 0.5, isBrazilian: true, isHealthy: true },
  { id: '124', name: 'Água de coco', category: 'bebida', portion: '240ml (1 copo)', calories: 46, protein: 1.7, carbs: 9, fat: 0.5, fiber: 2.6, isBrazilian: true, isHealthy: true },
  { id: '125', name: 'Café sem açúcar', category: 'bebida', portion: '240ml (1 xícara)', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, isBrazilian: true, isHealthy: true },
  { id: '703', name: 'Chá verde', category: 'bebida', portion: '240ml (1 xícara)', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, isBrazilian: false, isHealthy: true },
  { id: '704', name: 'Refrigerante', category: 'bebida', portion: '240ml (1 copo)', calories: 100, protein: 0, carbs: 27, fat: 0, fiber: 0, isBrazilian: false, isHealthy: false },
  { id: '705', name: 'Suco de uva integral', category: 'bebida', portion: '240ml (1 copo)', calories: 154, protein: 1.4, carbs: 38, fat: 0.3, fiber: 0.5, isBrazilian: false, isHealthy: false }
]
