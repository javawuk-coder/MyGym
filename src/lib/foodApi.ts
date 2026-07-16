import type { FoodItem } from '../types'

// ── 로컬 한국 식품 DB ─────────────────────────────────────────────────────────
// calories100g / macros 는 100g 기준, servingSize(g) + servingLabel 로 인분 표시

export interface LocalFood extends FoodItem {
  servingSize?: number
  servingLabel?: string
  aliases?: string[]   // 영어/다른 검색어
}

const KO_DB: LocalFood[] = [
  // ── 달걀류 ──────────────────────────────────────────────────────────────────
  { id: 'local-egg', name: '달걀 (계란)', aliases: ['egg', 'eggs', '계란', '달걀'], source: 'custom', calories100g: 155, carbs100g: 1.1, protein100g: 12.6, fat100g: 10.6, servingSize: 60, servingLabel: '1개 (60g)' },
  { id: 'local-egg-white', name: '달걀 흰자', aliases: ['egg white', 'egg whites'], source: 'custom', calories100g: 52, carbs100g: 0.7, protein100g: 10.9, fat100g: 0.2, servingSize: 33, servingLabel: '1개분 (33g)' },
  { id: 'local-egg-yolk', name: '달걀 노른자', aliases: ['egg yolk', 'yolk'], source: 'custom', calories100g: 322, carbs100g: 3.6, protein100g: 15.9, fat100g: 26.5, servingSize: 17, servingLabel: '1개분 (17g)' },
  // ── 쌀/곡류 ─────────────────────────────────────────────────────────────────
  { id: 'local-rice', name: '흰쌀밥', aliases: ['rice', 'white rice', 'cooked rice'], source: 'custom', calories100g: 143, carbs100g: 31.5, protein100g: 2.6, fat100g: 0.3, servingSize: 210, servingLabel: '1공기 (210g)' },
  { id: 'local-rice-brown', name: '현미밥', aliases: ['brown rice'], source: 'custom', calories100g: 141, carbs100g: 29.2, protein100g: 3.1, fat100g: 0.8, servingSize: 210, servingLabel: '1공기 (210g)' },
  { id: 'local-rice-mixed', name: '잡곡밥', aliases: ['multigrain rice', 'mixed grain rice'], source: 'custom', calories100g: 150, carbs100g: 31.0, protein100g: 3.2, fat100g: 0.6, servingSize: 210, servingLabel: '1공기 (210g)' },
  { id: 'local-oat', name: '오트밀', aliases: ['oatmeal', 'oats', 'oat'], source: 'custom', calories100g: 389, carbs100g: 66.3, protein100g: 16.9, fat100g: 6.9, servingSize: 40, servingLabel: '1회분 (40g)' },
  { id: 'local-bread-white', name: '식빵 (흰빵)', aliases: ['bread', 'white bread', 'toast'], source: 'custom', calories100g: 267, carbs100g: 49.2, protein100g: 8.9, fat100g: 3.6, servingSize: 30, servingLabel: '1장 (30g)' },
  { id: 'local-sweet-potato', name: '고구마', aliases: ['sweet potato', 'yam'], source: 'custom', calories100g: 108, carbs100g: 25.1, protein100g: 1.6, fat100g: 0.1, servingSize: 150, servingLabel: '중간 1개 (150g)' },
  { id: 'local-potato', name: '감자', aliases: ['potato', 'potatoes'], source: 'custom', calories100g: 70, carbs100g: 16.3, protein100g: 1.9, fat100g: 0.1, servingSize: 150, servingLabel: '중간 1개 (150g)' },
  { id: 'local-corn', name: '옥수수', aliases: ['corn', 'sweet corn'], source: 'custom', calories100g: 99, carbs100g: 21.3, protein100g: 3.3, fat100g: 1.4, servingSize: 140, servingLabel: '1개 (140g)' },
  { id: 'local-nurungji', name: '누룽지', aliases: ['nurungji', 'scorched rice'], source: 'custom', calories100g: 378, carbs100g: 80.0, protein100g: 8.5, fat100g: 1.5, servingSize: 40, servingLabel: '1회분 (40g)' },
  // ── 닭고기 ──────────────────────────────────────────────────────────────────
  { id: 'local-chicken-breast', name: '닭가슴살', aliases: ['chicken breast', 'chicken'], source: 'custom', calories100g: 109, carbs100g: 0, protein100g: 23.1, fat100g: 1.2, servingSize: 150, servingLabel: '1조각 (150g)' },
  { id: 'local-chicken-breast-smoked', name: '훈제 닭가슴살', aliases: ['smoked chicken breast', 'smoked chicken'], source: 'custom', calories100g: 110, carbs100g: 2.0, protein100g: 22.0, fat100g: 1.5, servingSize: 100, servingLabel: '1팩 (100g)' },
  { id: 'local-chicken-thigh', name: '닭다리살', aliases: ['chicken thigh'], source: 'custom', calories100g: 175, carbs100g: 0, protein100g: 18.3, fat100g: 11.1, servingSize: 100, servingLabel: '1조각 (100g)' },
  { id: 'local-chicken-wing', name: '닭날개', aliases: ['chicken wing'], source: 'custom', calories100g: 203, carbs100g: 0, protein100g: 18.3, fat100g: 14.1, servingSize: 50, servingLabel: '1개 (50g)' },
  { id: 'local-fried-chicken', name: '후라이드 치킨', aliases: ['fried chicken'], source: 'custom', calories100g: 248, carbs100g: 9.0, protein100g: 20.0, fat100g: 15.0, servingSize: 100, servingLabel: '1조각 (100g)' },
  { id: 'local-yangnyum-chicken', name: '양념치킨', aliases: ['yangnyum chicken', 'seasoned fried chicken'], source: 'custom', calories100g: 228, carbs100g: 14.0, protein100g: 18.0, fat100g: 11.0, servingSize: 100, servingLabel: '1조각 (100g)' },
  { id: 'local-dakgalbi', name: '닭갈비', aliases: ['dakgalbi', 'spicy chicken stir fry'], source: 'custom', calories100g: 130, carbs100g: 8.0, protein100g: 16.0, fat100g: 3.5, servingSize: 250, servingLabel: '1인분 (250g)' },
  // ── 소고기 ──────────────────────────────────────────────────────────────────
  { id: 'local-beef-sirloin', name: '소고기 등심', aliases: ['beef', 'sirloin', 'beef sirloin'], source: 'custom', calories100g: 271, carbs100g: 0, protein100g: 18.5, fat100g: 22.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-beef-tenderloin', name: '소고기 안심', aliases: ['beef tenderloin', 'tenderloin'], source: 'custom', calories100g: 189, carbs100g: 0, protein100g: 20.2, fat100g: 12.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-bulgogi', name: '불고기', aliases: ['bulgogi', 'beef bulgogi'], source: 'custom', calories100g: 162, carbs100g: 6.0, protein100g: 16.0, fat100g: 8.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-galbi-beef', name: '소갈비', aliases: ['beef galbi', 'beef ribs', 'galbi'], source: 'custom', calories100g: 308, carbs100g: 3.0, protein100g: 16.5, fat100g: 26.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  // ── 돼지고기 ─────────────────────────────────────────────────────────────────
  { id: 'local-pork-belly', name: '돼지 삼겹살', aliases: ['pork belly', 'pork'], source: 'custom', calories100g: 391, carbs100g: 0, protein100g: 14.3, fat100g: 36.5, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-pork-neck', name: '돼지 목살', aliases: ['pork neck', 'pork shoulder'], source: 'custom', calories100g: 271, carbs100g: 0, protein100g: 18.0, fat100g: 22.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-jeyuk', name: '제육볶음', aliases: ['jeyuk bokkeum', 'spicy pork stir fry'], source: 'custom', calories100g: 180, carbs100g: 7.0, protein100g: 16.0, fat100g: 10.0, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-pork-galbi', name: '돼지갈비', aliases: ['pork galbi', 'pork ribs'], source: 'custom', calories100g: 282, carbs100g: 5.0, protein100g: 15.0, fat100g: 23.0, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-donkatsu', name: '돈까스', aliases: ['donkatsu', 'pork cutlet', 'tonkatsu'], source: 'custom', calories100g: 256, carbs100g: 16.0, protein100g: 16.0, fat100g: 14.0, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-항정살', name: '항정살', aliases: ['hangjeong', 'pork jowl'], source: 'custom', calories100g: 340, carbs100g: 0, protein100g: 16.0, fat100g: 30.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  // ── 생선/해산물 ──────────────────────────────────────────────────────────────
  { id: 'local-tuna-can', name: '참치캔 (물참치)', aliases: ['tuna', 'canned tuna', 'tuna can'], source: 'custom', calories100g: 103, carbs100g: 0, protein100g: 23.4, fat100g: 0.9, servingSize: 100, servingLabel: '1캔 (100g)' },
  { id: 'local-salmon', name: '연어', aliases: ['salmon'], source: 'custom', calories100g: 208, carbs100g: 0, protein100g: 20.4, fat100g: 13.4, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-mackerel', name: '고등어', aliases: ['mackerel'], source: 'custom', calories100g: 205, carbs100g: 0.1, protein100g: 18.8, fat100g: 13.9, servingSize: 150, servingLabel: '1토막 (150g)' },
  { id: 'local-shrimp', name: '새우', aliases: ['shrimp', 'prawn'], source: 'custom', calories100g: 90, carbs100g: 0.9, protein100g: 19.0, fat100g: 1.0, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-squid', name: '오징어', aliases: ['squid', 'calamari'], source: 'custom', calories100g: 92, carbs100g: 3.1, protein100g: 17.6, fat100g: 1.2, servingSize: 150, servingLabel: '1마리 (150g)' },
  { id: 'local-flatfish', name: '광어 (넙치)', aliases: ['flatfish', 'halibut', 'flounder'], source: 'custom', calories100g: 102, carbs100g: 0, protein100g: 20.8, fat100g: 1.8, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-croaker', name: '조기', aliases: ['croaker', 'yellow croaker'], source: 'custom', calories100g: 126, carbs100g: 0, protein100g: 18.5, fat100g: 5.5, servingSize: 120, servingLabel: '1마리 (120g)' },
  { id: 'local-pollack', name: '명태 (동태)', aliases: ['pollack', 'walleye pollack', '명태'], source: 'custom', calories100g: 82, carbs100g: 0, protein100g: 17.4, fat100g: 0.8, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-crab', name: '꽃게', aliases: ['crab', 'blue crab'], source: 'custom', calories100g: 83, carbs100g: 0, protein100g: 17.5, fat100g: 1.0, servingSize: 150, servingLabel: '1마리 (150g)' },
  // ── 두부/콩류 ────────────────────────────────────────────────────────────────
  { id: 'local-tofu-firm', name: '두부 (단단한)', aliases: ['tofu', 'firm tofu'], source: 'custom', calories100g: 76, carbs100g: 1.9, protein100g: 8.1, fat100g: 4.2, servingSize: 150, servingLabel: '1/3모 (150g)' },
  { id: 'local-tofu-soft', name: '순두부', aliases: ['soft tofu', 'silken tofu'], source: 'custom', calories100g: 47, carbs100g: 1.4, protein100g: 4.6, fat100g: 2.4, servingSize: 200, servingLabel: '1팩 (200g)' },
  { id: 'local-edamame', name: '에다마메 (풋콩)', aliases: ['edamame', 'soybean'], source: 'custom', calories100g: 122, carbs100g: 8.9, protein100g: 11.9, fat100g: 5.2, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-soy-milk', name: '두유', aliases: ['soy milk', 'soymilk', '두유'], source: 'custom', calories100g: 43, carbs100g: 3.5, protein100g: 3.5, fat100g: 1.6, servingSize: 190, servingLabel: '1팩 (190ml)' },
  { id: 'local-black-bean', name: '검은콩 (삶은)', aliases: ['black bean', 'black soybean'], source: 'custom', calories100g: 148, carbs100g: 20.5, protein100g: 11.2, fat100g: 3.8, servingSize: 100, servingLabel: '1회분 (100g)' },
  // ── 유제품 ──────────────────────────────────────────────────────────────────
  { id: 'local-milk', name: '우유', aliases: ['milk', 'whole milk'], source: 'custom', calories100g: 61, carbs100g: 4.6, protein100g: 3.2, fat100g: 3.4, servingSize: 200, servingLabel: '1컵 (200ml)' },
  { id: 'local-milk-low', name: '저지방 우유', aliases: ['low fat milk', 'skim milk'], source: 'custom', calories100g: 46, carbs100g: 4.8, protein100g: 3.4, fat100g: 1.0, servingSize: 200, servingLabel: '1컵 (200ml)' },
  { id: 'local-greek-yogurt', name: '그릭 요거트', aliases: ['greek yogurt', 'yogurt'], source: 'custom', calories100g: 59, carbs100g: 3.6, protein100g: 10.0, fat100g: 0.4, servingSize: 150, servingLabel: '1팩 (150g)' },
  { id: 'local-cottage-cheese', name: '코티지 치즈', aliases: ['cottage cheese'], source: 'custom', calories100g: 98, carbs100g: 3.4, protein100g: 11.1, fat100g: 4.3, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-cheese-slice', name: '슬라이스 치즈', aliases: ['cheese', 'slice cheese', 'cheddar'], source: 'custom', calories100g: 330, carbs100g: 4.1, protein100g: 23.3, fat100g: 24.6, servingSize: 20, servingLabel: '1장 (20g)' },
  // ── 채소 ────────────────────────────────────────────────────────────────────
  { id: 'local-broccoli', name: '브로콜리', aliases: ['broccoli'], source: 'custom', calories100g: 34, carbs100g: 7.2, protein100g: 2.8, fat100g: 0.4, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-spinach', name: '시금치', aliases: ['spinach'], source: 'custom', calories100g: 23, carbs100g: 3.6, protein100g: 2.9, fat100g: 0.4, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-kimchi', name: '김치', aliases: ['kimchi'], source: 'custom', calories100g: 19, carbs100g: 4.0, protein100g: 1.6, fat100g: 0.1, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-cabbage', name: '양배추', aliases: ['cabbage', 'green cabbage'], source: 'custom', calories100g: 25, carbs100g: 5.8, protein100g: 1.3, fat100g: 0.1, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-carrot', name: '당근', aliases: ['carrot', 'carrots'], source: 'custom', calories100g: 41, carbs100g: 9.6, protein100g: 0.9, fat100g: 0.2, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-cucumber', name: '오이', aliases: ['cucumber'], source: 'custom', calories100g: 16, carbs100g: 3.6, protein100g: 0.7, fat100g: 0.1, servingSize: 100, servingLabel: '1개 (100g)' },
  { id: 'local-onion', name: '양파', aliases: ['onion', 'onions'], source: 'custom', calories100g: 40, carbs100g: 9.3, protein100g: 1.1, fat100g: 0.1, servingSize: 150, servingLabel: '중간 1개 (150g)' },
  { id: 'local-paprika', name: '파프리카', aliases: ['bell pepper', 'paprika', 'red pepper'], source: 'custom', calories100g: 31, carbs100g: 6.0, protein100g: 1.0, fat100g: 0.3, servingSize: 150, servingLabel: '1개 (150g)' },
  { id: 'local-shiitake', name: '표고버섯', aliases: ['shiitake', 'shiitake mushroom', '버섯'], source: 'custom', calories100g: 38, carbs100g: 8.0, protein100g: 2.5, fat100g: 0.4, servingSize: 80, servingLabel: '3~4개 (80g)' },
  { id: 'local-oyster-mushroom', name: '느타리버섯', aliases: ['oyster mushroom'], source: 'custom', calories100g: 22, carbs100g: 4.0, protein100g: 2.0, fat100g: 0.2, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-beansprout', name: '콩나물', aliases: ['bean sprout', 'beansprout'], source: 'custom', calories100g: 34, carbs100g: 5.4, protein100g: 3.5, fat100g: 0.3, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-mungbean-sprout', name: '숙주나물', aliases: ['mung bean sprout', 'mungbean sprout'], source: 'custom', calories100g: 21, carbs100g: 3.8, protein100g: 1.8, fat100g: 0.1, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-sesame-leaf', name: '깻잎', aliases: ['perilla leaf', 'sesame leaf'], source: 'custom', calories100g: 30, carbs100g: 5.3, protein100g: 3.5, fat100g: 0.5, servingSize: 30, servingLabel: '10장 (30g)' },
  { id: 'local-lettuce', name: '상추', aliases: ['lettuce', 'green lettuce'], source: 'custom', calories100g: 15, carbs100g: 2.8, protein100g: 1.4, fat100g: 0.2, servingSize: 50, servingLabel: '1회분 (50g)' },
  { id: 'local-avocado', name: '아보카도', aliases: ['avocado'], source: 'custom', calories100g: 160, carbs100g: 8.5, protein100g: 2.0, fat100g: 14.7, servingSize: 150, servingLabel: '1개 (150g)' },
  { id: 'local-pumpkin', name: '단호박', aliases: ['kabocha', 'pumpkin', 'butternut squash', '호박'], source: 'custom', calories100g: 80, carbs100g: 18.0, protein100g: 1.5, fat100g: 0.1, servingSize: 150, servingLabel: '1회분 (150g)' },
  { id: 'local-tomato', name: '토마토', aliases: ['tomato', 'tomatoes'], source: 'custom', calories100g: 18, carbs100g: 3.9, protein100g: 0.9, fat100g: 0.2, servingSize: 150, servingLabel: '중간 1개 (150g)' },
  { id: 'local-cherry-tomato', name: '방울토마토', aliases: ['cherry tomato', 'grape tomato'], source: 'custom', calories100g: 18, carbs100g: 3.9, protein100g: 0.9, fat100g: 0.2, servingSize: 100, servingLabel: '10개 (100g)' },
  // ── 과일 ────────────────────────────────────────────────────────────────────
  { id: 'local-banana', name: '바나나', aliases: ['banana'], source: 'custom', calories100g: 89, carbs100g: 23.0, protein100g: 1.1, fat100g: 0.3, servingSize: 120, servingLabel: '1개 (120g)' },
  { id: 'local-apple', name: '사과', aliases: ['apple'], source: 'custom', calories100g: 52, carbs100g: 14.0, protein100g: 0.3, fat100g: 0.2, servingSize: 200, servingLabel: '중간 1개 (200g)' },
  { id: 'local-strawberry', name: '딸기', aliases: ['strawberry', 'strawberries'], source: 'custom', calories100g: 32, carbs100g: 7.7, protein100g: 0.7, fat100g: 0.3, servingSize: 150, servingLabel: '1회분 (150g)' },
  { id: 'local-grape', name: '포도', aliases: ['grape', 'grapes'], source: 'custom', calories100g: 67, carbs100g: 17.2, protein100g: 0.6, fat100g: 0.4, servingSize: 150, servingLabel: '1회분 (150g)' },
  { id: 'local-orange', name: '오렌지', aliases: ['orange'], source: 'custom', calories100g: 47, carbs100g: 11.7, protein100g: 0.9, fat100g: 0.1, servingSize: 180, servingLabel: '1개 (180g)' },
  { id: 'local-blueberry', name: '블루베리', aliases: ['blueberry', 'blueberries'], source: 'custom', calories100g: 57, carbs100g: 14.5, protein100g: 0.7, fat100g: 0.3, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-watermelon', name: '수박', aliases: ['watermelon'], source: 'custom', calories100g: 30, carbs100g: 7.5, protein100g: 0.6, fat100g: 0.2, servingSize: 300, servingLabel: '1조각 (300g)' },
  { id: 'local-tangerine', name: '귤', aliases: ['tangerine', 'mandarin', 'clementine'], source: 'custom', calories100g: 42, carbs100g: 10.6, protein100g: 0.8, fat100g: 0.3, servingSize: 80, servingLabel: '1개 (80g)' },
  { id: 'local-peach', name: '복숭아', aliases: ['peach'], source: 'custom', calories100g: 39, carbs100g: 9.5, protein100g: 0.9, fat100g: 0.3, servingSize: 170, servingLabel: '1개 (170g)' },
  { id: 'local-kiwi', name: '키위', aliases: ['kiwi', 'kiwifruit'], source: 'custom', calories100g: 61, carbs100g: 14.7, protein100g: 1.1, fat100g: 0.5, servingSize: 80, servingLabel: '1개 (80g)' },
  { id: 'local-mango', name: '망고', aliases: ['mango'], source: 'custom', calories100g: 60, carbs100g: 15.0, protein100g: 0.8, fat100g: 0.4, servingSize: 200, servingLabel: '1개 (200g)' },
  { id: 'local-pear', name: '배', aliases: ['pear', 'korean pear'], source: 'custom', calories100g: 57, carbs100g: 15.2, protein100g: 0.4, fat100g: 0.1, servingSize: 300, servingLabel: '중간 1개 (300g)' },
  // ── 한식 찌개/국 ─────────────────────────────────────────────────────────────
  { id: 'local-kimchi-jjigae', name: '김치찌개', aliases: ['kimchi jjigae', 'kimchi stew'], source: 'custom', calories100g: 82, carbs100g: 5.0, protein100g: 5.5, fat100g: 4.0, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-doenjang-jjigae', name: '된장찌개', aliases: ['doenjang jjigae', 'miso stew', 'miso soup'], source: 'custom', calories100g: 65, carbs100g: 4.5, protein100g: 5.0, fat100g: 2.0, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-sundubu-jjigae', name: '순두부찌개', aliases: ['sundubu jjigae', 'soft tofu stew'], source: 'custom', calories100g: 70, carbs100g: 4.0, protein100g: 6.0, fat100g: 3.0, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-budae-jjigae', name: '부대찌개', aliases: ['budae jjigae', 'army stew', 'korean army stew'], source: 'custom', calories100g: 120, carbs100g: 9.0, protein100g: 7.0, fat100g: 5.5, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-galbitang', name: '갈비탕', aliases: ['galbitang', 'beef short rib soup'], source: 'custom', calories100g: 88, carbs100g: 2.0, protein100g: 8.5, fat100g: 5.0, servingSize: 600, servingLabel: '1인분 (600g)' },
  { id: 'local-seolleongtang', name: '설렁탕', aliases: ['seolleongtang', 'ox bone soup'], source: 'custom', calories100g: 72, carbs100g: 1.5, protein100g: 7.5, fat100g: 4.0, servingSize: 600, servingLabel: '1인분 (600g)' },
  { id: 'local-samgyetang', name: '삼계탕', aliases: ['samgyetang', 'ginseng chicken soup'], source: 'custom', calories100g: 90, carbs100g: 4.0, protein100g: 9.0, fat100g: 4.0, servingSize: 800, servingLabel: '1마리분 (800g)' },
  { id: 'local-miyeokguk', name: '미역국', aliases: ['miyeokguk', 'seaweed soup'], source: 'custom', calories100g: 35, carbs100g: 2.0, protein100g: 3.5, fat100g: 1.0, servingSize: 400, servingLabel: '1인분 (400g)' },
  { id: 'local-kongnamulguk', name: '콩나물국', aliases: ['kongnamulguk', 'beansprout soup'], source: 'custom', calories100g: 20, carbs100g: 2.5, protein100g: 2.0, fat100g: 0.3, servingSize: 400, servingLabel: '1인분 (400g)' },
  { id: 'local-manduguk', name: '만두국', aliases: ['manduguk', 'dumpling soup'], source: 'custom', calories100g: 120, carbs100g: 14.0, protein100g: 6.0, fat100g: 4.0, servingSize: 500, servingLabel: '1인분 (500g)' },
  // ── 한식 볶음/구이/기타 ───────────────────────────────────────────────────────
  { id: 'local-japchae', name: '잡채', aliases: ['japchae', 'glass noodle stir fry'], source: 'custom', calories100g: 145, carbs100g: 22.0, protein100g: 4.5, fat100g: 4.5, servingSize: 250, servingLabel: '1인분 (250g)' },
  { id: 'local-gimbap', name: '김밥 (1줄)', aliases: ['gimbap', 'kimbap'], source: 'custom', calories100g: 164, carbs100g: 30.0, protein100g: 5.5, fat100g: 3.0, servingSize: 250, servingLabel: '1줄 (250g)' },
  { id: 'local-bibimbap', name: '비빔밥', aliases: ['bibimbap'], source: 'custom', calories100g: 110, carbs100g: 20.0, protein100g: 4.5, fat100g: 2.0, servingSize: 400, servingLabel: '1인분 (400g)' },
  { id: 'local-dosirak', name: '도시락 (편의점)', aliases: ['dosirak', 'bento', 'lunch box'], source: 'custom', calories100g: 150, carbs100g: 28.0, protein100g: 6.0, fat100g: 2.5, servingSize: 350, servingLabel: '1개 (350g)' },
  // ── 분식 ────────────────────────────────────────────────────────────────────
  { id: 'local-tteokbokki', name: '떡볶이', aliases: ['tteokbokki', 'spicy rice cake', 'tteok'], source: 'custom', calories100g: 135, carbs100g: 27.5, protein100g: 3.0, fat100g: 1.5, servingSize: 300, servingLabel: '1인분 (300g)' },
  { id: 'local-sundae', name: '순대', aliases: ['sundae', 'blood sausage', '순대'], source: 'custom', calories100g: 195, carbs100g: 18.0, protein100g: 10.0, fat100g: 8.5, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-eomuk', name: '어묵 (오뎅)', aliases: ['eomuk', 'odeng', 'fishcake', 'fish cake'], source: 'custom', calories100g: 80, carbs100g: 10.0, protein100g: 7.0, fat100g: 1.5, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-twigim', name: '튀김', aliases: ['twigim', 'korean fritter', 'deep fried'], source: 'custom', calories100g: 255, carbs100g: 25.0, protein100g: 6.0, fat100g: 14.0, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-hotdog', name: '핫도그 (분식)', aliases: ['hotdog', 'corn dog', 'korean hot dog'], source: 'custom', calories100g: 258, carbs100g: 28.0, protein100g: 7.5, fat100g: 12.5, servingSize: 100, servingLabel: '1개 (100g)' },
  { id: 'local-mandu-steamed', name: '만두 (찐)', aliases: ['mandu', 'dumpling', 'steamed dumpling', '만두'], source: 'custom', calories100g: 188, carbs100g: 24.0, protein100g: 9.0, fat100g: 6.0, servingSize: 200, servingLabel: '5~6개 (200g)' },
  { id: 'local-mandu-fried', name: '군만두 (튀긴)', aliases: ['fried dumpling', 'fried mandu', '군만두'], source: 'custom', calories100g: 252, carbs100g: 28.0, protein100g: 8.5, fat100g: 11.0, servingSize: 200, servingLabel: '5~6개 (200g)' },
  { id: 'local-pajeon', name: '파전 (해물파전)', aliases: ['pajeon', 'green onion pancake', 'korean pancake'], source: 'custom', calories100g: 195, carbs100g: 22.0, protein100g: 7.0, fat100g: 9.0, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-injeolmi', name: '인절미', aliases: ['injeolmi', 'rice cake', 'mochi'], source: 'custom', calories100g: 225, carbs100g: 50.0, protein100g: 3.5, fat100g: 1.0, servingSize: 100, servingLabel: '3~4개 (100g)' },
  { id: 'local-gyeran-toast', name: '계란 토스트', aliases: ['egg toast', 'korean egg toast'], source: 'custom', calories100g: 230, carbs100g: 25.0, protein100g: 10.0, fat100g: 10.0, servingSize: 150, servingLabel: '1개 (150g)' },
  // ── 면류 ────────────────────────────────────────────────────────────────────
  { id: 'local-ramyeon', name: '라면 (봉지)', aliases: ['ramen', 'ramyeon', 'instant noodle'], source: 'custom', calories100g: 447, carbs100g: 62.0, protein100g: 10.0, fat100g: 17.0, servingSize: 120, servingLabel: '1봉지 (120g)' },
  { id: 'local-ramyeon-cup', name: '컵라면 (신라면)', aliases: ['cup ramen', 'cup noodle'], source: 'custom', calories100g: 399, carbs100g: 54.0, protein100g: 9.5, fat100g: 14.5, servingSize: 95, servingLabel: '1개 (95g)' },
  { id: 'local-jjajangmyeon', name: '짜장면', aliases: ['jjajangmyeon', 'black bean noodle', 'jajangmyeon'], source: 'custom', calories100g: 165, carbs100g: 29.0, protein100g: 5.5, fat100g: 3.5, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-jjambbong', name: '짬뽕', aliases: ['jjambbong', 'spicy seafood noodle', 'jjampong'], source: 'custom', calories100g: 75, carbs100g: 11.0, protein100g: 5.0, fat100g: 1.5, servingSize: 600, servingLabel: '1인분 (600g)' },
  { id: 'local-naengmyeon', name: '물냉면', aliases: ['naengmyeon', 'cold noodle', 'mul naengmyeon'], source: 'custom', calories100g: 65, carbs100g: 13.0, protein100g: 2.5, fat100g: 0.5, servingSize: 550, servingLabel: '1인분 (550g)' },
  { id: 'local-bibim-naengmyeon', name: '비빔냉면', aliases: ['bibim naengmyeon', 'spicy cold noodle'], source: 'custom', calories100g: 115, carbs100g: 22.0, protein100g: 3.5, fat100g: 2.0, servingSize: 450, servingLabel: '1인분 (450g)' },
  { id: 'local-kalguksu', name: '칼국수', aliases: ['kalguksu', 'knife noodle', 'handmade noodle'], source: 'custom', calories100g: 100, carbs100g: 19.0, protein100g: 3.5, fat100g: 1.0, servingSize: 600, servingLabel: '1인분 (600g)' },
  { id: 'local-udon', name: '우동', aliases: ['udon'], source: 'custom', calories100g: 90, carbs100g: 18.5, protein100g: 3.0, fat100g: 0.5, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-pho', name: '쌀국수 (포)', aliases: ['pho', 'rice noodle soup', 'vietnamese noodle', '쌀국수'], source: 'custom', calories100g: 80, carbs100g: 15.0, protein100g: 5.0, fat100g: 1.0, servingSize: 500, servingLabel: '1인분 (500g)' },
  { id: 'local-pasta-tomato', name: '파스타 (토마토)', aliases: ['pasta', 'spaghetti', 'tomato pasta'], source: 'custom', calories100g: 155, carbs100g: 24.0, protein100g: 6.0, fat100g: 4.0, servingSize: 350, servingLabel: '1인분 (350g)' },
  // ── 편의점/간편식 ─────────────────────────────────────────────────────────────
  { id: 'local-samgak-tuna', name: '삼각김밥 (참치마요)', aliases: ['triangle kimbap tuna', 'tuna mayo triangle'], source: 'custom', calories100g: 200, carbs100g: 32.0, protein100g: 6.5, fat100g: 5.0, servingSize: 105, servingLabel: '1개 (105g)' },
  { id: 'local-samgak-bulgogi', name: '삼각김밥 (불고기)', aliases: ['triangle kimbap bulgogi', 'bulgogi triangle'], source: 'custom', calories100g: 192, carbs100g: 34.0, protein100g: 5.5, fat100g: 3.5, servingSize: 100, servingLabel: '1개 (100g)' },
  { id: 'local-cupbap', name: '편의점 컵밥', aliases: ['cup rice', 'convenience store rice', 'cup bap'], source: 'custom', calories100g: 140, carbs100g: 27.0, protein100g: 5.0, fat100g: 2.0, servingSize: 220, servingLabel: '1개 (220g)' },
  { id: 'local-cvs-chicken', name: '닭가슴살 (편의점)', aliases: ['convenience chicken breast', 'cvs chicken'], source: 'custom', calories100g: 108, carbs100g: 2.0, protein100g: 22.0, fat100g: 1.5, servingSize: 100, servingLabel: '1팩 (100g)' },
  { id: 'local-cvs-sandwich', name: '샌드위치 (편의점)', aliases: ['convenience sandwich', 'cvs sandwich'], source: 'custom', calories100g: 220, carbs100g: 28.0, protein100g: 9.0, fat100g: 8.0, servingSize: 140, servingLabel: '1개 (140g)' },
  // ── 빵/디저트 ────────────────────────────────────────────────────────────────
  { id: 'local-croissant', name: '크로아상', aliases: ['croissant'], source: 'custom', calories100g: 406, carbs100g: 45.8, protein100g: 8.2, fat100g: 21.0, servingSize: 60, servingLabel: '1개 (60g)' },
  { id: 'local-bagel', name: '베이글', aliases: ['bagel'], source: 'custom', calories100g: 257, carbs100g: 50.0, protein100g: 10.0, fat100g: 1.6, servingSize: 90, servingLabel: '1개 (90g)' },
  { id: 'local-muffin', name: '머핀', aliases: ['muffin'], source: 'custom', calories100g: 357, carbs100g: 51.0, protein100g: 5.5, fat100g: 14.0, servingSize: 100, servingLabel: '1개 (100g)' },
  { id: 'local-donut', name: '도넛', aliases: ['donut', 'doughnut'], source: 'custom', calories100g: 420, carbs100g: 51.0, protein100g: 5.5, fat100g: 21.0, servingSize: 60, servingLabel: '1개 (60g)' },
  { id: 'local-ice-cream', name: '아이스크림 (바닐라)', aliases: ['ice cream', 'vanilla ice cream'], source: 'custom', calories100g: 200, carbs100g: 24.0, protein100g: 3.5, fat100g: 10.0, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-chocolate', name: '초콜릿 (밀크)', aliases: ['chocolate', 'milk chocolate'], source: 'custom', calories100g: 535, carbs100g: 59.0, protein100g: 8.0, fat100g: 30.0, servingSize: 30, servingLabel: '1/3판 (30g)' },
  // ── 음료 ────────────────────────────────────────────────────────────────────
  { id: 'local-americano', name: '아메리카노', aliases: ['americano', 'black coffee', 'espresso'], source: 'custom', calories100g: 2, carbs100g: 0, protein100g: 0.1, fat100g: 0, servingSize: 300, servingLabel: '1잔 (300ml)' },
  { id: 'local-latte', name: '카페라떼', aliases: ['latte', 'cafe latte', 'coffee latte'], source: 'custom', calories100g: 40, carbs100g: 4.0, protein100g: 2.5, fat100g: 1.5, servingSize: 350, servingLabel: '1잔 (350ml)' },
  { id: 'local-oj', name: '오렌지주스', aliases: ['orange juice', 'oj'], source: 'custom', calories100g: 45, carbs100g: 10.4, protein100g: 0.7, fat100g: 0.2, servingSize: 200, servingLabel: '1컵 (200ml)' },
  { id: 'local-sports-drink', name: '스포츠음료 (게토레이)', aliases: ['sports drink', 'gatorade', 'electrolyte drink'], source: 'custom', calories100g: 26, carbs100g: 6.7, protein100g: 0, fat100g: 0, servingSize: 500, servingLabel: '1병 (500ml)' },
  { id: 'local-cola', name: '콜라', aliases: ['cola', 'coke', 'soda'], source: 'custom', calories100g: 43, carbs100g: 10.6, protein100g: 0, fat100g: 0, servingSize: 350, servingLabel: '1캔 (350ml)' },
  { id: 'local-beer', name: '맥주', aliases: ['beer', 'lager', 'ale'], source: 'custom', calories100g: 43, carbs100g: 3.6, protein100g: 0.5, fat100g: 0, servingSize: 355, servingLabel: '1캔 (355ml)' },
  { id: 'local-soju', name: '소주', aliases: ['soju', 'korean soju'], source: 'custom', calories100g: 141, carbs100g: 0, protein100g: 0, fat100g: 0, servingSize: 50, servingLabel: '1잔 (50ml)' },
  { id: 'local-makgeolli', name: '막걸리', aliases: ['makgeolli', 'korean rice wine', 'rice wine'], source: 'custom', calories100g: 49, carbs100g: 5.0, protein100g: 0.8, fat100g: 0.1, servingSize: 300, servingLabel: '1사발 (300ml)' },
  // ── 견과류/씨앗 ──────────────────────────────────────────────────────────────
  { id: 'local-almond', name: '아몬드', aliases: ['almond', 'almonds'], source: 'custom', calories100g: 579, carbs100g: 21.6, protein100g: 21.2, fat100g: 49.9, servingSize: 30, servingLabel: '1줌 (30g)' },
  { id: 'local-peanut-butter', name: '땅콩버터', aliases: ['peanut butter', 'peanut'], source: 'custom', calories100g: 588, carbs100g: 20.0, protein100g: 25.0, fat100g: 50.0, servingSize: 32, servingLabel: '2큰술 (32g)' },
  { id: 'local-walnut', name: '호두', aliases: ['walnut', 'walnuts'], source: 'custom', calories100g: 650, carbs100g: 13.7, protein100g: 15.2, fat100g: 65.2, servingSize: 30, servingLabel: '1줌 (30g)' },
  { id: 'local-cashew', name: '캐슈너트', aliases: ['cashew', 'cashew nut'], source: 'custom', calories100g: 553, carbs100g: 30.2, protein100g: 18.2, fat100g: 43.9, servingSize: 30, servingLabel: '1줌 (30g)' },
  { id: 'local-sesame', name: '참깨', aliases: ['sesame', 'sesame seed'], source: 'custom', calories100g: 573, carbs100g: 23.4, protein100g: 17.7, fat100g: 49.7, servingSize: 10, servingLabel: '1큰술 (10g)' },
  // ── 단백질 보충제 ─────────────────────────────────────────────────────────────
  { id: 'local-whey-protein', name: '웨이 프로틴', aliases: ['whey protein', 'protein powder', 'whey'], source: 'custom', calories100g: 372, carbs100g: 6.2, protein100g: 75.0, fat100g: 5.0, servingSize: 30, servingLabel: '1스쿱 (30g)' },
  { id: 'local-casein-protein', name: '카제인 프로틴', aliases: ['casein protein', 'casein'], source: 'custom', calories100g: 370, carbs100g: 8.0, protein100g: 72.0, fat100g: 5.0, servingSize: 30, servingLabel: '1스쿱 (30g)' },
  { id: 'local-gainer', name: '게이너 (고탄수)', aliases: ['gainer', 'mass gainer', 'weight gainer'], source: 'custom', calories100g: 380, carbs100g: 68.0, protein100g: 20.0, fat100g: 3.0, servingSize: 75, servingLabel: '1서빙 (75g)' },
  // ── 기타 식재료/소스 ─────────────────────────────────────────────────────────
  { id: 'local-olive-oil', name: '올리브오일', aliases: ['olive oil'], source: 'custom', calories100g: 884, carbs100g: 0, protein100g: 0, fat100g: 100, servingSize: 14, servingLabel: '1큰술 (14g)' },
  { id: 'local-butter', name: '버터', aliases: ['butter'], source: 'custom', calories100g: 717, carbs100g: 0.6, protein100g: 0.9, fat100g: 81.0, servingSize: 10, servingLabel: '1조각 (10g)' },
  { id: 'local-honey', name: '꿀', aliases: ['honey'], source: 'custom', calories100g: 304, carbs100g: 82.4, protein100g: 0.3, fat100g: 0, servingSize: 21, servingLabel: '1큰술 (21g)' },
  { id: 'local-mayonnaise', name: '마요네즈', aliases: ['mayonnaise', 'mayo'], source: 'custom', calories100g: 680, carbs100g: 2.5, protein100g: 1.1, fat100g: 74.9, servingSize: 15, servingLabel: '1큰술 (15g)' },
]

function matchesQuery(term: string, q: string): boolean {
  if (term === q) return true
  if (term.startsWith(q + ' ') || term.endsWith(' ' + q) || term.includes(' ' + q + ' ')) return true
  if (term.startsWith(q)) return true
  return false
}

function searchLocal(query: string): LocalFood[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return KO_DB.filter(f => {
    const allTerms = [f.name.toLowerCase(), ...(f.aliases ?? []).map(a => a.toLowerCase())]
    return allTerms.some(t => matchesQuery(t, q) || t.includes(q))
  })
}

interface OFFProduct {
  _id: string
  product_name?: string
  product_name_ko?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'carbohydrates_100g'?: number
    'proteins_100g'?: number
    'fat_100g'?: number
  }
}

function normalizeProduct(p: OFFProduct): FoodItem | null {
  const n = p.nutriments
  if (!n) return null
  const cal = n['energy-kcal_100g'] ?? 0
  if (cal <= 0 && !n['proteins_100g'] && !n['carbohydrates_100g']) return null
  const name = p.product_name_ko || p.product_name || ''
  if (!name) return null
  return {
    id: p._id,
    name,
    brand: p.brands?.split(',')[0]?.trim(),
    calories100g: Math.round(cal),
    carbs100g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    protein100g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
    fat100g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
    source: 'openfoodfacts',
  }
}

async function fetchOFF(query: string): Promise<FoodItem[]> {
  try {
    // search_simple=1: 이름(name)만 검색, 재료(ingredients) 제외
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=15&fields=_id,product_name,product_name_ko,brands,nutriments`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products as OFFProduct[] ?? []).map(normalizeProduct).filter(Boolean) as FoodItem[]
  } catch {
    return []
  }
}

// 한글 포함 여부 판별
function hasKorean(s: string) { return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(s) }

// ── 식품의약품안전처 식품영양성분 DB ──────────────────────────────────────────

// 식약처 I2790 API는 버전/서비스에 따라 NUTR_CONT 또는 AMT_NUM 필드명을 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KFoodRow = Record<string, any>

function normalizeKFoodRow(row: KFoodRow): FoodItem | null {
  const name: string = row.FOOD_NM_KR ?? row.FOOD_NM ?? ''
  if (!name) return null
  const id: string = row.FOOD_CD ?? row.FOOD_NO ?? ''

  // NUTR_CONT 방식 (에너지, 단백질, 지방, 탄수화물)
  // AMT_NUM 방식 (AMT_NUM1=에너지, AMT_NUM7=탄수화물, AMT_NUM8=단백질, AMT_NUM9=지방)
  const cal     = parseFloat(row.NUTR_CONT1 ?? row.AMT_NUM1 ?? '0')
  const protein = parseFloat(row.NUTR_CONT3 ?? row.AMT_NUM8 ?? '0')
  const fat     = parseFloat(row.NUTR_CONT4 ?? row.AMT_NUM9 ?? '0')
  const carbs   = parseFloat(row.NUTR_CONT6 ?? row.AMT_NUM7 ?? '0')

  if (cal <= 0 && protein <= 0 && carbs <= 0) return null
  return {
    id: 'kfood-' + id,
    name,
    calories100g: Math.round(cal),
    carbs100g: Math.round(carbs * 10) / 10,
    protein100g: Math.round(protein * 10) / 10,
    fat100g: Math.round(fat * 10) / 10,
    source: 'kfood',
  }
}

async function fetchKFood(query: string): Promise<FoodItem[]> {
  try {
    const resp = await fetch(`/api/search-food?query=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!resp.ok) {
      console.warn('[kfood] serverless error:', resp.status)
      return []
    }
    const data = await resp.json()
    console.log('[kfood] raw response:', JSON.stringify(data).slice(0, 400))
    const rows: KFoodRow[] = data?.I2790?.row ?? []
    console.log('[kfood] rows count:', rows.length, rows[0] ? Object.keys(rows[0]).join(',') : 'no rows')
    return rows.map(normalizeKFoodRow).filter(Boolean) as FoodItem[]
  } catch (e) {
    console.warn('[kfood] fetch failed:', e)
    return []
  }
}

export async function searchFood(query: string, _lang = 'ko'): Promise<FoodItem[]> {
  if (!query.trim()) return []

  // 1) 로컬 DB — 항상 먼저 (한국어·영어 aliases 모두)
  const localResults = searchLocal(query)

  // 2) 한글 검색: 식약처 API 병렬 호출
  if (hasKorean(query)) {
    const kfoodResults = await fetchKFood(query)
    const seen = new Set(localResults.map(f => f.id))
    return [...localResults, ...kfoodResults.filter(f => !seen.has(f.id))]
  }

  // 3) 영문 검색: Open Food Facts
  const offResults = await fetchOFF(query)
  const q = query.toLowerCase()
  const filteredOff = offResults.filter(f => f.name.toLowerCase().includes(q))
  const seen = new Set(localResults.map(f => f.id))
  return [...localResults, ...filteredOff.filter(f => !seen.has(f.id))]
}

export function calcEntryNutrition(item: FoodItem, amountG: number) {
  const r = amountG / 100
  return {
    calories: Math.round(item.calories100g * r),
    carbs: Math.round(item.carbs100g * r * 10) / 10,
    protein: Math.round(item.protein100g * r * 10) / 10,
    fat: Math.round(item.fat100g * r * 10) / 10,
  }
}

export { KO_DB }
