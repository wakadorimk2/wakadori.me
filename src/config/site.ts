export const site = {
  name: "わかどり",
  nameEn: "wakadori",
  heroWork: "vayria",
  curatedWorks: [
    "irys-fan-art",
    "ae2-dashboard",
    "tokoyami-towa-fan-art",
    "enterlight",
    "shishiro-botan-fan-art",
    "portfolio-ui",
  ],
  heroCopy: "絵とコードで、つくる。",
  heroCopyEn: "Illustration and code are both part of how I create.",
  about:
    "AIエンジニア兼イラストレーターのわかどりです。生成AIとキャラクター表現を組み合わせた、遊べる・会話できる体験を制作しています。LLMアプリの実装、プロンプト設計、対話の評価・改善から、キャラクターデザインやUIまで手がけています。",
  aboutEn:
    "I'm wakadori, an AI engineer and illustrator. I create playful, conversational experiences that bring generative AI and characters together, working across LLM applications, dialogue evaluation, illustration, and interface design.",
  description:
    "AIエンジニア兼イラストレーター・わかどりのポートフォリオ。イラスト、ソフトウェア、参加型AIキャラクターVayria（ヴェイリア）を紹介しています。",
  exhibition: {
    image: {
      src: "/images/vayria-kv.png",
      alt: "言葉のカードを手に、こちらへ微笑むヴェイリアの全身キービジュアル",
      width: 1446,
      height: 2048,
    },
    title: "Vayria（ヴェイリア）",
    subtitle: "言葉のカードで変わる、参加型AIキャラクター",
    description:
      "言葉のカードを入れ替えたり、声をかけたりして、その場の会話に参加できるAIキャラクターを制作しています。選んだ言葉が話題や反応に影響し、その組み合わせから思いがけない会話が生まれます。",
    experience: "会場ではiPadを操作しながら、カードと音声でヴェイリアとのやりとりを体験できます。",
    event: "生成AIなんでも展示会 Vol.6",
    date: "2026-09-23",
    dateLabel: "2026年9月23日（水・祝）",
    venue: "東京都立産業貿易センター 浜松町館",
    status: "出展予定",
  },
  links: [
    { label: "pixiv", href: "https://www.pixiv.net/users/75962333" },
    { label: "GitHub", href: "https://github.com/wakadorimk2" },
    { label: "Illustration on X", href: "https://x.com/wakadori_illust" },
    { label: "Tech on X", href: "https://x.com/wakadori_Mk2" },
  ],
} as const;
