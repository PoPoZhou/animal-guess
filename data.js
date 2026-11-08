// 知識表：教 AI 的資料。要改 AI 的知識，改這個檔案就好，不用動其他程式。
// AI 分三個階段問：先問種類，再問顏色，最後問細部特徵。

export const STAGES = [
  { id: 1, name: "種類", limit: 6, intro: "先判斷牠是哪一類動物。" },
  { id: 2, name: "顏色", limit: 3, intro: "種類大致確定了，接著看牠的顏色。" },
  { id: 3, name: "細部特徵", limit: 99, intro: "最後用細部特徵把剩下的分開。" },
];

// 第一階段：種類（每種動物只屬於一類）
export const GROUPS = [
  { key: "mammal", label: "哺乳類", question: "牠是哺乳類嗎？（媽媽會餵奶，像狗、獅子、鯨魚）" },
  { key: "bird", label: "鳥類", question: "牠是鳥類嗎？" },
  { key: "fish", label: "魚類", question: "牠是魚類嗎？" },
  { key: "reptile", label: "爬蟲類", question: "牠是爬蟲類嗎？（像蛇、蜥蜴、烏龜、鱷魚）" },
  { key: "amphibian", label: "兩棲類", question: "牠是兩棲類嗎？（像青蛙）" },
  { key: "insect", label: "昆蟲", question: "牠是昆蟲嗎？（六隻腳，像蝴蝶、螞蟻）" },
  { key: "other", label: "其他", question: "牠是沒有骨頭的小動物嗎？（像蜘蛛、螃蟹、蝸牛、章魚）" },
];

// 第二階段：顏色（一種動物可以有好幾種顏色）
export const COLORS = [
  { key: "black", label: "黑" },
  { key: "white", label: "白" },
  { key: "gray", label: "灰" },
  { key: "brown", label: "棕" },
  { key: "yellow", label: "黃橘" },
  { key: "red", label: "紅粉" },
  { key: "green", label: "綠" },
  { key: "blue", label: "藍" },
];
const COLOR_WORDS = {
  black: "黑色", white: "白色", gray: "灰色", brown: "棕色或咖啡色",
  yellow: "黃色或橘色", red: "紅色或粉紅色", green: "綠色", blue: "藍色",
};

// 第三階段：細部特徵
export const DETAILS = [
  { key: "fly", label: "會飛", question: "牠會飛嗎？" },
  { key: "water", label: "住水裡", question: "牠大部分時間待在水裡嗎？" },
  { key: "sea", label: "住海裡", question: "牠住在海裡嗎？" },
  { key: "meat", label: "吃動物", question: "牠主要吃其他動物嗎？" },
  { key: "fur", label: "有毛髮", question: "牠身上有毛髮嗎？（羽毛不算）" },
  { key: "small", label: "手掌大", question: "牠小到可以放在手掌上嗎？" },
  { key: "big", label: "比人大", question: "牠的體型比一個大人還大嗎？" },
  { key: "huge", label: "比車大", question: "牠比一台汽車還大嗎？" },
  { key: "pet", label: "寵物", question: "很多人把牠當寵物養嗎？" },
  { key: "farm", label: "農場", question: "牠常在農場被飼養嗎？" },
  { key: "stripes", label: "條紋", question: "牠身上有明顯的條紋嗎？" },
  { key: "spots", label: "斑點", question: "牠身上有明顯的斑點或花斑嗎？" },
  { key: "africa", label: "非洲", question: "野生的牠住在非洲嗎？" },
  { key: "asia", label: "亞洲", question: "野生的牠住在亞洲嗎？" },
  { key: "legs4", label: "四腳走路", question: "牠用四隻腳走路嗎？" },
  { key: "jump", label: "用跳的", question: "牠主要靠跳來移動嗎？" },
  { key: "tree", label: "住樹上", question: "牠常待在樹上嗎？" },
  { key: "horns", label: "有角", question: "牠頭上有角嗎？" },
  { key: "ears", label: "大耳朵", question: "牠的耳朵特別大或特別長嗎？" },
  { key: "neck", label: "長脖子", question: "牠的脖子特別長嗎？" },
  { key: "night", label: "夜行", question: "牠主要在晚上活動嗎？" },
  { key: "cold", label: "住冷處", question: "牠住在很冷的地方嗎？" },
  { key: "shell", label: "硬殼", question: "牠有硬硬的殼嗎？" },
  { key: "venom", label: "有毒", question: "牠有毒，或會螫人嗎？" },
];

// 所有問題，依階段排好。
export const FEATURES = [
  ...GROUPS.map((g) => ({ ...g, stage: 1 })),
  ...COLORS.map((c) => ({ key: `c_${c.key}`, label: c.label, question: `牠身上常見的顏色有${COLOR_WORDS[c.key]}嗎？`, stage: 2 })),
  ...DETAILS.map((d) => ({ ...d, stage: 3 })),
];

// group：種類；colors：常見顏色；yes：細部特徵中「是」的項目（沒列出的就是「否」）
export const ANIMALS = [
  // 哺乳類：家裡和農場
  { name: "狗", emoji: "🐶", group: "mammal", colors: ["brown", "white", "black"], yes: ["fur", "pet", "legs4"] },
  { name: "貓", emoji: "🐱", group: "mammal", colors: ["black", "white", "gray", "yellow"], yes: ["meat", "fur", "pet", "legs4", "night"] },
  { name: "兔子", emoji: "🐰", group: "mammal", colors: ["white", "gray", "brown"], yes: ["fur", "pet", "legs4", "jump", "ears"] },
  { name: "倉鼠", emoji: "🐹", group: "mammal", colors: ["brown", "white", "yellow"], yes: ["fur", "small", "pet", "legs4", "night"] },
  { name: "老鼠", emoji: "🐭", group: "mammal", colors: ["gray", "brown"], yes: ["fur", "small", "legs4", "night"] },
  { name: "馬", emoji: "🐴", group: "mammal", colors: ["brown", "black", "white"], yes: ["fur", "big", "farm", "legs4"] },
  { name: "牛", emoji: "🐮", group: "mammal", colors: ["black", "white", "brown"], yes: ["fur", "big", "farm", "legs4", "horns", "spots"] },
  { name: "豬", emoji: "🐷", group: "mammal", colors: ["red"], yes: ["farm", "legs4"] },
  { name: "羊", emoji: "🐐", group: "mammal", colors: ["white"], yes: ["fur", "farm", "legs4", "horns"] },
  // 哺乳類：野外
  { name: "獅子", emoji: "🦁", group: "mammal", colors: ["yellow", "brown"], yes: ["meat", "fur", "big", "africa", "legs4"] },
  { name: "老虎", emoji: "🐯", group: "mammal", colors: ["yellow", "black", "white"], yes: ["meat", "fur", "big", "stripes", "asia", "legs4"] },
  { name: "豹", emoji: "🐆", group: "mammal", colors: ["yellow", "black"], yes: ["meat", "fur", "spots", "africa", "asia", "legs4", "tree"] },
  { name: "狼", emoji: "🐺", group: "mammal", colors: ["gray"], yes: ["meat", "fur", "legs4", "cold"] },
  { name: "狐狸", emoji: "🦊", group: "mammal", colors: ["yellow", "white"], yes: ["meat", "fur", "legs4", "night", "ears"] },
  { name: "熊", emoji: "🐻", group: "mammal", colors: ["brown", "black"], yes: ["fur", "big", "legs4"] },
  { name: "北極熊", emoji: "🐻‍❄️", group: "mammal", colors: ["white"], yes: ["meat", "fur", "big", "legs4", "cold"] },
  { name: "熊貓", emoji: "🐼", group: "mammal", colors: ["black", "white"], yes: ["fur", "big", "asia", "legs4"] },
  { name: "浣熊", emoji: "🦝", group: "mammal", colors: ["gray", "black"], yes: ["fur", "stripes", "legs4", "night"] },
  { name: "大象", emoji: "🐘", group: "mammal", colors: ["gray"], yes: ["big", "huge", "africa", "asia", "legs4", "ears"] },
  { name: "河馬", emoji: "🦛", group: "mammal", colors: ["gray"], yes: ["water", "big", "huge", "africa", "legs4"] },
  { name: "犀牛", emoji: "🦏", group: "mammal", colors: ["gray"], yes: ["big", "huge", "africa", "asia", "legs4", "horns"] },
  { name: "長頸鹿", emoji: "🦒", group: "mammal", colors: ["yellow", "brown"], yes: ["fur", "big", "spots", "africa", "legs4", "neck"] },
  { name: "斑馬", emoji: "🦓", group: "mammal", colors: ["black", "white"], yes: ["fur", "big", "stripes", "africa", "legs4"] },
  { name: "駱駝", emoji: "🐫", group: "mammal", colors: ["brown", "yellow"], yes: ["fur", "big", "africa", "asia", "legs4"] },
  { name: "鹿", emoji: "🦌", group: "mammal", colors: ["brown"], yes: ["fur", "spots", "asia", "legs4", "horns"] },
  { name: "猴子", emoji: "🐒", group: "mammal", colors: ["brown"], yes: ["fur", "africa", "asia", "legs4", "tree"] },
  { name: "大猩猩", emoji: "🦍", group: "mammal", colors: ["black"], yes: ["fur", "big", "africa", "legs4"] },
  { name: "松鼠", emoji: "🐿️", group: "mammal", colors: ["brown", "gray"], yes: ["fur", "legs4", "tree"] },
  { name: "無尾熊", emoji: "🐨", group: "mammal", colors: ["gray"], yes: ["fur", "tree", "ears"] },
  { name: "袋鼠", emoji: "🦘", group: "mammal", colors: ["brown"], yes: ["fur", "jump"] },
  { name: "蝙蝠", emoji: "🦇", group: "mammal", colors: ["black", "brown"], yes: ["fly", "meat", "fur", "night"] },
  // 哺乳類：水裡
  { name: "海豚", emoji: "🐬", group: "mammal", colors: ["gray"], yes: ["water", "sea", "meat", "big"] },
  { name: "鯨魚", emoji: "🐋", group: "mammal", colors: ["gray", "blue"], yes: ["water", "sea", "meat", "big", "huge"] },
  { name: "海豹", emoji: "🦭", group: "mammal", colors: ["gray"], yes: ["water", "sea", "meat", "fur", "cold"] },
  { name: "水獺", emoji: "🦦", group: "mammal", colors: ["brown"], yes: ["water", "meat", "fur"] },
  // 鳥類
  { name: "雞", emoji: "🐔", group: "bird", colors: ["white", "red"], yes: ["farm"] },
  { name: "鴨子", emoji: "🦆", group: "bird", colors: ["white", "yellow"], yes: ["fly", "water", "farm"] },
  { name: "鸚鵡", emoji: "🦜", group: "bird", colors: ["green", "red", "blue", "yellow"], yes: ["fly", "pet", "tree"] },
  { name: "企鵝", emoji: "🐧", group: "bird", colors: ["black", "white"], yes: ["meat", "cold"] },
  { name: "老鷹", emoji: "🦅", group: "bird", colors: ["brown", "white"], yes: ["fly", "meat"] },
  { name: "貓頭鷹", emoji: "🦉", group: "bird", colors: ["brown", "gray"], yes: ["fly", "meat", "night", "tree"] },
  { name: "鴿子", emoji: "🕊️", group: "bird", colors: ["gray", "white"], yes: ["fly"] },
  { name: "天鵝", emoji: "🦢", group: "bird", colors: ["white"], yes: ["fly", "water", "neck"] },
  { name: "火鶴", emoji: "🦩", group: "bird", colors: ["red"], yes: ["fly", "water", "neck", "africa"] },
  { name: "孔雀", emoji: "🦚", group: "bird", colors: ["blue", "green"], yes: ["spots", "asia"] },
  // 魚類
  { name: "金魚", emoji: "🐟", group: "fish", colors: ["yellow", "red"], yes: ["water", "small", "pet"] },
  { name: "小丑魚", emoji: "🐠", group: "fish", colors: ["yellow", "white"], yes: ["water", "sea", "small", "stripes"] },
  { name: "河豚", emoji: "🐡", group: "fish", colors: ["yellow", "brown"], yes: ["water", "sea", "venom", "spots"] },
  { name: "鯊魚", emoji: "🦈", group: "fish", colors: ["gray", "white"], yes: ["water", "sea", "meat", "big"] },
  // 爬蟲類、兩棲類
  { name: "烏龜", emoji: "🐢", group: "reptile", colors: ["green", "brown"], yes: ["pet", "legs4", "shell"] },
  { name: "鱷魚", emoji: "🐊", group: "reptile", colors: ["green", "brown"], yes: ["water", "meat", "big", "africa", "legs4"] },
  { name: "蛇", emoji: "🐍", group: "reptile", colors: ["green", "brown"], yes: ["meat", "venom"] },
  { name: "蜥蜴", emoji: "🦎", group: "reptile", colors: ["green", "brown"], yes: ["meat", "legs4"] },
  { name: "青蛙", emoji: "🐸", group: "amphibian", colors: ["green"], yes: ["meat", "jump", "small"] },
  // 昆蟲
  { name: "蝴蝶", emoji: "🦋", group: "insect", colors: ["yellow", "blue", "black"], yes: ["fly", "spots", "small"] },
  { name: "蜜蜂", emoji: "🐝", group: "insect", colors: ["yellow", "black"], yes: ["fly", "stripes", "small", "venom"] },
  { name: "蚊子", emoji: "🦟", group: "insect", colors: ["black", "gray"], yes: ["fly", "small", "night"] },
  { name: "螞蟻", emoji: "🐜", group: "insect", colors: ["black"], yes: ["small"] },
  // 其他沒有骨頭的動物
  { name: "蜘蛛", emoji: "🕷️", group: "other", colors: ["black"], yes: ["meat", "small", "venom"] },
  { name: "蝸牛", emoji: "🐌", group: "other", colors: ["brown"], yes: ["small", "shell"] },
  { name: "螃蟹", emoji: "🦀", group: "other", colors: ["red"], yes: ["water", "sea", "shell"] },
  { name: "蝦子", emoji: "🦐", group: "other", colors: ["red"], yes: ["water", "sea", "small"] },
  { name: "章魚", emoji: "🐙", group: "other", colors: ["red"], yes: ["water", "sea", "meat"] },
];

// 把一種動物的種類、顏色和細部特徵合成一組「是」的特徵。
export function traitsOf(animal) {
  return [animal.group, ...animal.colors.map((c) => `c_${c}`), ...animal.yes];
}
