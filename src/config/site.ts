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
    "AIプロダクトエンジニア兼イラストレーターのわかどりです。AIとキャラクターとゲームを組み合わせて、実際に触って会話できる体験を作っています。リアルタイム音声対話やLLMアプリの実装から、キャラクターデザイン、UIまで手がけています。",
  aboutEn:
    "I'm wakadori, an AI product engineer and illustrator. I combine AI, characters, and games into experiences you can actually touch and talk to, working across real-time voice interaction, LLM applications, character design, and interface design.",
  description:
    "AIプロダクトエンジニア兼イラストレーター・わかどりのポートフォリオ。イラスト、ソフトウェア、参加型AIキャラクターVayria（ヴェイリア）などを紹介しています。",
  exhibition: {
    image: {
      src: "/images/vayria-kv.png",
      alt: "言葉のカードを手に、こちらへ微笑むヴェイリアの全身キービジュアル",
      width: 1446,
      height: 2048,
    },
    title: "Vayria（ヴェイリア）",
    subtitle: "言葉のカードで変わる、参加型AI Tuber",
    description:
      "ヴェイリアは、来場者がその場で会話に参加できるAI Tuberです。カードを入力するとキャラクターの「脳内ワード」が入れ替わり、話題や反応が変わります。音声対話、リアルタイムTTS/STT、Web UIをひとつの体験として統合しました。",
    experience:
      "会場ではiPadからカードと音声でヴェイリアとやりとりしていただき、言葉の組み合わせから生まれる思いがけない会話を体験していただきました。",
    event: "生成AIなんでも展示会 Vol.6",
    date: "2026-09-23",
    dateLabel: "2026年9月23日（水・祝）",
    venue: "東京都立産業貿易センター 浜松町館",
    status: "出展しました",
    photo: {
      src: "/images/vayria-booth.webp",
      alt: "展示会のブース。ポスターとチラシの前に、ヴェイリアの顔が映るiPadが置かれている",
      width: 1200,
      height: 1600,
    },
  },
  featuredArticle: {
    source: "note",
    title: "【生成AIなんでも展示会】AITuberを展示したら、本というUXの強さに気づいた",
    href: "https://note.com/wakadori_mk3/n/n48114ab91972",
  },
  experiments: [
    {
      title: "7AI村",
      year: 2026,
      description:
        "7 Days to Die の世界で複数のAIエージェントを生活させる実験。自律行動、資源消費、建築、防衛、会話を実装し、無人稼働から動画化まで行いました。",
    },
    {
      title: "AIを使った動画・MV制作",
      year: 2026,
      description:
        "SunoとDaVinci Resolveを使ったMV制作や、AI支援による動画編集・字幕・サムネイル制作の実験。",
    },
  ],
  links: [
    { label: "pixiv", href: "https://www.pixiv.net/users/75962333" },
    { label: "GitHub", href: "https://github.com/wakadorimk2" },
    { label: "Illustration on X", href: "https://x.com/wakadori_illust" },
    { label: "Tech on X", href: "https://x.com/wakadori_Mk2" },
  ],
} as const;
