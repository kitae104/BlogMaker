const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;

loadDotEnv(path.join(rootDir, ".env"));

const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/generate") {
      await handleGenerate(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/cover-background") {
      await handleCoverBackground(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/wp-images") {
      await handleWordPressImages(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/ollama-image-models") {
      await handleOllamaImageModels(req, res);
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/trending-topics")) {
      await handleTrendingTopics(req, res);
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "지원하지 않는 요청 방식입니다." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`BlogMaker server running at http://127.0.0.1:${port}/`);
});

async function handleGenerate(req, res) {
  const body = await readJsonBody(req);
  const provider = String(body.provider || "").toLowerCase();
  const model = String(body.model || "").trim();

  if (!body.input || typeof body.input !== "string") {
    sendJson(res, 400, { error: "원본 입력 내용이 필요합니다." });
    return;
  }

  if (!["openai", "ollama"].includes(provider)) {
    sendJson(res, 400, { error: "provider는 openai 또는 ollama여야 합니다." });
    return;
  }

  const generatorOptions = { provider, model };
  let markdown = stripWordPressImagePrompt(await generateWithProvider(generatorOptions, buildMessages(body)));
  let seoReport = auditSeoMarkdown(markdown, body);

  if (body.seoAutoRefine !== false && !seoReport.passed) {
    const refineMessages = body.mode === "generic"
      ? buildGenericSeoRefineMessages(body, markdown, seoReport)
      : buildSeoRefineMessages(body, markdown, seoReport);
    markdown = stripWordPressImagePrompt(await generateWithProvider(generatorOptions, refineMessages));
    seoReport = auditSeoMarkdown(markdown, body);
    seoReport.revised = true;
  }

  sendJson(res, 200, { markdown, seoReport });
}

async function handleOllamaImageModels(req, res) {
  const models = await getOllamaImageModels();

  sendJson(res, 200, {
    models,
    recommended: models[0]?.name || "",
  });
}

async function handleTrendingTopics(req, res) {
  const requestUrl = new URL(req.url, "http://127.0.0.1");
  const category = String(requestUrl.searchParams.get("category") || "it").trim();
  const query = String(requestUrl.searchParams.get("q") || getDefaultTrendQuery(category)).trim();
  const topics = await searchTrendingTopics(query, category);

  sendJson(res, 200, { category, query, topics });
}

function getDefaultTrendQuery(category) {
  const queries = {
    it: "IT 기술 트렌드 클라우드 보안 디지털전환",
    programming: "소프트웨어 개발 프로그래밍 개발자 도구 AI 코딩",
    ai: "AI 인공지능 생성형AI 멀티모달 에이전트",
    server: "서버 운영 인프라 Kubernetes Docker 보안 모니터링",
    environment: "개발 환경 설정 IDE Node.js Docker Windows macOS 생산성",
  };

  return queries[category] || queries.it;
}

async function searchTrendingTopics(query, category) {
  const searchUrl = new URL("https://news.google.com/rss/search");
  searchUrl.searchParams.set("q", `${query} when:14d`);
  searchUrl.searchParams.set("hl", "ko");
  searchUrl.searchParams.set("gl", "KR");
  searchUrl.searchParams.set("ceid", "KR:ko");

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "BlogMaker/0.1 (+https://localhost)",
      "Accept": "application/rss+xml, application/xml, text/xml",
    },
  });
  const xml = await response.text();

  if (!response.ok) {
    throw new Error(`최신 주제 검색 실패: HTTP ${response.status}`);
  }

  const items = parseRssItems(xml).slice(0, 12);
  const topics = [];
  const seen = new Set();

  for (const item of items) {
    const title = cleanNewsTitle(item.title);
    if (!title || seen.has(title)) continue;

    const keywords = extractTopicKeywords(`${title} ${item.description} ${query}`, category);
    topics.push({
      title: toBlogTopicTitle(title, category),
      summary: stripHtml(item.description).slice(0, 180),
      keywords,
      source: item.source || extractHost(item.link),
      link: item.link,
      published: formatRssDate(item.pubDate),
    });
    seen.add(title);

    if (topics.length >= 5) break;
  }

  if (topics.length) return topics;

  return buildFallbackTopics(query, category);
}

function parseRssItems(xml) {
  return [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const itemXml = match[0];
    return {
      title: decodeXml(extractXmlTag(itemXml, "title")),
      link: decodeXml(extractXmlTag(itemXml, "link")),
      pubDate: decodeXml(extractXmlTag(itemXml, "pubDate")),
      source: decodeXml(extractXmlTag(itemXml, "source")),
      description: decodeXml(extractXmlTag(itemXml, "description")),
    };
  });
}

function extractXmlTag(xml, tagName) {
  const match = String(xml || "").match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value) {
  return decodeXml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanNewsTitle(title) {
  return stripHtml(title)
    .replace(/\s+-\s+[^-]{2,40}$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractHost(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "뉴스 검색";
  }
}

function formatRssDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function extractTopicKeywords(text, category) {
  const categoryTerms = {
    it: ["IT", "클라우드", "보안", "디지털전환"],
    programming: ["개발", "프로그래밍", "개발자", "도구"],
    ai: ["AI", "인공지능", "생성형AI", "에이전트"],
    server: ["서버", "인프라", "운영", "보안"],
    environment: ["개발환경", "설정", "툴체인", "생산성"],
  };
  const stopWords = new Set(["그리고", "하지만", "대한", "관련", "최근", "오늘", "이번", "하는", "있는", "없는", "으로", "에서", "뉴스", "단독"]);
  const words = stripHtml(text)
    .replace(/[^\p{L}\p{N}\s.+#-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !stopWords.has(word));
  const ranked = new Map();

  [...(categoryTerms[category] || []), ...words].forEach((word) => {
    ranked.set(word, (ranked.get(word) || 0) + 1);
  });

  return [...ranked.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([word]) => word)
    .slice(0, 6);
}

function toBlogTopicTitle(title, category) {
  const label = {
    it: "IT 이야기",
    programming: "개발 이야기",
    ai: "AI 이야기",
    server: "서버 설정",
    environment: "환경 설정",
  }[category] || "IT 이야기";

  if (title.length >= 18 && title.length <= 70) return title;
  return `${label}: ${title}`.slice(0, 80);
}

function buildFallbackTopics(query, category) {
  const keywords = extractTopicKeywords(query, category);
  return [
    "최근 기술 변화가 실무에 미치는 영향",
    "초보자가 알아야 할 핵심 개념과 적용 방법",
    "기업과 개발자가 지금 확인해야 할 체크포인트",
    "앞으로 6개월 동안 주목할 변화와 대응 전략",
    "도입 전에 비교해야 할 장점과 한계",
  ].map((suffix) => ({
    title: `${toBlogTopicTitle(query, category)} - ${suffix}`,
    summary: `${query} 관련 최신 흐름을 바탕으로 작성할 수 있는 블로그 주제입니다.`,
    keywords,
    source: "기본 추천",
    link: "",
    published: "",
  }));
}

async function handleCoverBackground(req, res) {
  const body = await readJsonBody(req);
  const title = String(body.title || "").trim();
  const keywords = String(body.keywords || "").trim();
  const availableModels = await getOllamaImageModels();
  const model = String(body.model || availableModels[0]?.name || "").trim();

  if (!model) {
    sendJson(res, 400, {
      error: "Ollama 이미지 생성 모델이 설치되어 있지 않습니다. x/flux2-klein 또는 x/z-image-turbo를 설치한 뒤 다시 시도하세요.",
    });
    return;
  }

  const prompt = [
    "Clean technology blog cover background, no text, no letters, no words.",
    "Muted gray background with subtle connected hexagon nodes, faint circuit lines, soft depth.",
    "Professional Korean programming education thumbnail style, centered empty area for title overlay.",
    title ? `Topic: ${title}.` : "",
    keywords ? `Keywords: ${keywords}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const endpoint = normalizeOllamaBaseUrl(process.env.OLLAMA_BASE_URL || "http://114.71.147.30:21434");
  const response = await fetch(`${endpoint}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
      n: 1,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || `Ollama 이미지 생성 실패: HTTP ${response.status}`);
  }

  const b64Json = data.data?.[0]?.b64_json;

  if (!b64Json) {
    throw new Error("Ollama 이미지 생성 응답에서 이미지 데이터를 찾지 못했습니다.");
  }

  sendJson(res, 200, {
    model,
    imageDataUrl: `data:image/png;base64,${b64Json}`,
  });
}

async function handleWordPressImages(req, res) {
  const body = await readJsonBody(req);
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();

  if (!title || !content) {
    sendJson(res, 400, { error: "이미지를 생성할 블로그 제목과 본문이 필요합니다." });
    return;
  }

  const { GoogleGenAI, Type } = await loadGoogleGenAI();
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    sendJson(res, 400, {
      error: "GEMINI_API_KEY 또는 API_KEY가 설정되어 있지 않습니다. .env 파일에 Gemini API 키를 추가해 주세요.",
    });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const promptModel = String(body.promptModel || process.env.GEMINI_PROMPT_MODEL || "gemini-2.5-flash-lite").trim();
  const imageModel = String(body.imageModel || process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-fast-generate-001").trim();
  const metadata = await generateWordPressImageMetadata(ai, Type, promptModel, title, content);
  const specs = [
    { type: "featured", aspectRatio: "16:9", width: 1200, height: 630, overlayTitle: title },
    { type: "content", aspectRatio: "16:9", width: 1024, height: null, overlayTitle: "" },
    { type: "contentSecondary", aspectRatio: "16:9", width: 1024, height: null, overlayTitle: "" },
  ];
  const images = [];

  for (const spec of specs) {
    const itemMetadata = normalizeImageMetadata(metadata[spec.type], title, spec.type);
    const imageResponse = await ai.models.generateImages({
      model: imageModel,
      prompt: buildWordPressImagePrompt(itemMetadata.prompt, spec.type),
      config: {
        numberOfImages: 1,
        aspectRatio: spec.aspectRatio,
        outputMimeType: "image/png",
      },
    });
    const firstImage = imageResponse.generatedImages?.[0]?.image;
    const base64Data = firstImage?.imageBytes || "";
    const mimeType = firstImage?.mimeType || "image/png";

    if (!base64Data) {
      throw new Error(`${getWordPressImageTypeLabel(spec.type)} 생성 결과에서 이미지 데이터를 찾지 못했습니다.`);
    }

    images.push({
      type: spec.type,
      imageDataUrl: `data:${mimeType};base64,${base64Data}`,
      metadata: itemMetadata,
      targetWidth: spec.width,
      targetHeight: spec.height,
      overlayTitle: spec.overlayTitle,
    });
  }

  sendJson(res, 200, { promptModel, imageModel, images });
}

async function loadGoogleGenAI() {
  try {
    return await import("@google/genai");
  } catch (error) {
    throw new Error("@google/genai 패키지가 설치되어 있지 않습니다. npm install을 실행한 뒤 다시 시도해 주세요.");
  }
}

async function generateWordPressImageMetadata(ai, Type, model, title, content) {
  const prompt = `You are an expert WordPress blog image creator.
Based on the following blog title and content, generate image generation prompts and metadata for 3 images:
1. Featured Image (대표 이미지)
2. Content Image 1 (본문 이미지 1)
3. Content Image 2 (본문 이미지 2)

Blog Title: ${title}
Blog Content:
${content}

Return the result as a JSON object with the following structure:
{
  "featured": {
    "prompt": "Image generation prompt in English...",
    "altText": "대체 텍스트 (Korean)",
    "title": "제목 (Korean)",
    "caption": "캡션 (Korean)",
    "description": "설명 (Korean)"
  },
  "content": {
    "prompt": "Image generation prompt in English...",
    "altText": "대체 텍스트 (Korean)",
    "title": "제목 (Korean)",
    "caption": "캡션 (Korean)",
    "description": "설명 (Korean)"
  },
  "contentSecondary": {
    "prompt": "Image generation prompt in English...",
    "altText": "대체 텍스트 (Korean)",
    "title": "제목 (Korean)",
    "caption": "캡션 (Korean)",
    "description": "설명 (Korean)"
  }
}

Metadata writing rules:
- Write metadata in Korean.
- Keep each image metadata distinct and context-aware.
- Make alt text and description clear for accessibility and SEO.
- Image prompts must avoid embedded text, letters, logos, watermarks, and UI screenshots unless the post content explicitly requires them.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          featured: getImageMetadataSchema(Type),
          content: getImageMetadataSchema(Type),
          contentSecondary: getImageMetadataSchema(Type),
        },
        required: ["featured", "content", "contentSecondary"],
      },
    },
  });

  return parseJsonObject(response.text || "{}");
}

function getImageMetadataSchema(Type) {
  return {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING },
      altText: { type: Type.STRING },
      title: { type: Type.STRING },
      caption: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ["prompt", "altText", "title", "caption", "description"],
  };
}

function normalizeImageMetadata(metadata, blogTitle, type) {
  const label = getWordPressImageTypeLabel(type);
  const fallbackPrompt = `Professional WordPress blog image for a Korean Java programming education article titled "${blogTitle}", clean technical illustration, modern editorial style, no text, no logos, no watermark.`;

  return {
    prompt: String(metadata?.prompt || fallbackPrompt).trim(),
    altText: String(metadata?.altText || `${blogTitle} ${label}`).trim(),
    title: String(metadata?.title || `${blogTitle} ${label}`).trim(),
    caption: String(metadata?.caption || `${blogTitle} 내용을 시각적으로 설명한 ${label}입니다.`).trim(),
    description: String(metadata?.description || `${blogTitle} 블로그 글에 사용할 ${label} 이미지입니다.`).trim(),
  };
}

function buildWordPressImagePrompt(prompt, type) {
  const role = type === "featured"
    ? "Create a high-impact WordPress featured image with strong composition and safe empty space for a title overlay."
    : "Create a clean WordPress in-content illustration that supports the article section without any overlaid text.";

  return [
    role,
    prompt,
    "No readable text, no captions, no logos, no watermark, no UI chrome.",
    "Professional Korean technology blog visual, polished, accessible, editorial quality.",
  ].join(" ");
}

function getWordPressImageTypeLabel(type) {
  if (type === "featured") return "대표 이미지";
  if (type === "content") return "본문 이미지 1";
  return "본문 이미지 2";
}

function parseJsonObject(value) {
  const text = String(value || "").trim();

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini 메타데이터 응답을 JSON으로 해석하지 못했습니다.");
    return JSON.parse(match[0]);
  }
}

async function getOllamaImageModels() {
  const endpoint = normalizeOllamaBaseUrl(process.env.OLLAMA_BASE_URL || "http://114.71.147.30:21434");
  const response = await fetch(`${endpoint}/api/tags`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Ollama 모델 목록 조회 실패: HTTP ${response.status}`);
  }

  return (data.models || [])
    .filter((model) => isOllamaImageGenerationModel(model.name || model.model || ""))
    .map((model) => ({
      name: model.name || model.model,
      size: model.size || 0,
      family: model.details?.family || "",
    }))
    .sort((a, b) => {
      const rank = (name) => {
        const lowerName = String(name).toLowerCase();
        if (lowerName.includes("flux2-klein")) return 0;
        if (lowerName.includes("z-image")) return 1;
        return 2;
      };

      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
    });
}

function isOllamaImageGenerationModel(modelName) {
  const lowerName = String(modelName || "").toLowerCase();

  return lowerName.includes("flux2-klein")
    || lowerName.includes("z-image")
    || lowerName.includes("image-turbo");
}

async function generateWithProvider(options, messages) {
  if (options.provider === "openai") {
    return generateWithOpenAI({ model: options.model, messages });
  }

  return generateWithOllama({ model: options.model, messages });
}

function stripWordPressImagePrompt(markdown) {
  return String(markdown || "")
    .replace(/\n{0,2}##[^\n]*(?:대표\s*이미지\s*프롬프트|image\s*prompt)[^\n]*[\s\S]*?(?=\n##\s+|$)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildGenericSeoRefineMessages(body, markdown, seoReport) {
  const failedChecks = seoReport.checks
    .filter((check) => !check.passed)
    .map((check) => `- ${check.label}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `당신은 한국어 워드프레스 블로그 SEO 편집자입니다.

역할:
- 기존 글의 주제와 논지를 유지하면서 SEO 점검 실패 항목만 보완합니다.
- Markdown 본문만 출력합니다.
- 이미지 프롬프트 섹션은 작성하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 글을 SEO 기준에 맞게 수정해 주세요.

메뉴: ${body.categoryLabel || "기술 블로그"}
핵심 키워드: ${body.keywords || "기술 이슈"}

실패한 점검 항목:
${failedChecks || "- 제목, 키워드, H2 구조, 마무리 표를 전반적으로 개선해야 합니다."}

수정 기준:
- 제목은 25~70자 사이로 작성합니다.
- 첫 문단에 핵심 키워드를 자연스럽게 포함합니다.
- H2 섹션을 5개 이상 유지합니다.
- 마지막에는 마무리 정리 표를 포함합니다.
- 원문을 복붙하지 말고 자연스럽게 다듬습니다.

기존 Markdown:
${markdown}`,
    },
  ];
}

function buildSeoRefineMessages(body, markdown, seoReport) {
  const failedChecks = seoReport.checks
    .filter((check) => !check.passed)
    .map((check) => `- ${check.label}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `당신은 워드프레스 블로그 SEO 편집자입니다.

역할:
- 기존 Markdown 글의 구조와 내용을 유지하되 SEO 기준에 맞게 수정합니다.
- Java 초보자를 위한 설명 톤과 원본 코드의 의미를 유지합니다.
- Markdown 본문만 출력합니다. 수정 이유나 평가표는 출력하지 않습니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 절대 작성하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 글은 SEO 점검에서 일부 기준을 통과하지 못했습니다.

SEO 키워드:
${body.keywords || "Java, Stream, sorted(), Comparator"}

미통과 항목:
${failedChecks || "- 전반적인 SEO 품질을 개선해야 합니다."}

수정 기준:
- 제목은 25~70자 사이로 작성하고 Java와 핵심 키워드를 포함합니다.
- 첫 소개 문단에 핵심 키워드를 자연스럽게 1회 이상 포함합니다.
- 본문 중간에도 SEO 키워드를 과하지 않게 반복합니다.
- H2 섹션 구조를 유지합니다.
- java, text 코드 블록 언어명을 유지합니다.
- 마지막에 마무리 정리 표를 유지합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 작성하지 않습니다.

기존 Markdown:
${markdown}`,
    },
  ];
}

function auditSeoMarkdown(markdown, body) {
  if (body.mode === "generic") {
    return auditGenericSeoMarkdown(markdown, body);
  }

  const keywords = String(body.keywords || "Java, Stream, sorted(), Comparator")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywords[0] || "Java";
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
  const bodyWithoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const lowerBody = bodyWithoutCode.toLowerCase();
  const matchedKeywordCount = keywords
    .slice(0, 5)
    .filter((keyword) => lowerBody.includes(keyword.toLowerCase())).length;
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  const checks = [
    {
      label: "제목에 Java와 핵심 키워드가 포함되어 있습니다.",
      passed: title.includes("Java") && title.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0]),
    },
    {
      label: "제목 길이가 검색 결과에서 읽기 좋은 25~70자 범위입니다.",
      passed: title.length >= 25 && title.length <= 70,
    },
    {
      label: "본문에 핵심 키워드가 자연스럽게 반복됩니다.",
      passed: matchedKeywordCount >= Math.min(3, keywords.length || 3),
    },
    {
      label: "H2 섹션이 7개 이상 포함되어 글 구조가 명확합니다.",
      passed: h2Count >= 7,
    },
    {
      label: "java와 text 코드 블록 언어명이 포함되어 있습니다.",
      passed: markdown.includes("```java") && markdown.includes("```text"),
    },
    {
      label: "마무리 정리 표가 포함되어 있습니다.",
      passed: markdown.includes("|") && markdown.includes("---"),
    },
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    revised: false,
  };
}

function auditGenericSeoMarkdown(markdown, body) {
  const keywords = String(body.keywords || body.categoryLabel || "기술 이슈")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywords[0] || "기술 이슈";
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
  const bodyWithoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const lowerBody = bodyWithoutCode.toLowerCase();
  const matchedKeywordCount = keywords
    .slice(0, 5)
    .filter((keyword) => lowerBody.includes(keyword.toLowerCase())).length;
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  const checks = [
    {
      label: "제목에 핵심 주제 또는 키워드가 포함되어 있습니다.",
      passed: title.toLowerCase().includes(primaryKeyword.toLowerCase().split(" ")[0]) || title.length >= 12,
    },
    {
      label: "제목 길이가 검색 결과에서 읽기 좋은 25~70자 범위입니다.",
      passed: title.length >= 25 && title.length <= 70,
    },
    {
      label: "본문에 핵심 키워드가 자연스럽게 반복됩니다.",
      passed: matchedKeywordCount >= Math.min(3, keywords.length || 3),
    },
    {
      label: "H2 섹션이 5개 이상 포함되어 글 구조가 명확합니다.",
      passed: h2Count >= 5,
    },
    {
      label: "마무리 정리 표가 포함되어 있습니다.",
      passed: markdown.includes("|") && markdown.includes("---"),
    },
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    revised: false,
  };
}

function buildGenericBlogMessages(body) {
  const categoryLabel = String(body.categoryLabel || "IT 이야기").trim();
  const keywords = String(body.keywords || "").trim();
  const tone = String(body.tone || "트렌드 분석형").trim();
  const selectedTopic = body.selectedTopic || {};
  const topicTitle = String(selectedTopic.title || "").trim();
  const topicSummary = String(selectedTopic.summary || "").trim();
  const topicSource = String(selectedTopic.source || "").trim();
  const topicLink = String(selectedTopic.link || "").trim();

  return [
    {
      role: "system",
      content: `당신은 한국어 워드프레스 블로그 전문 에디터입니다.

역할:
- 사용자가 선택하거나 입력한 주제를 바탕으로 검색 유입을 고려한 Markdown 블로그 글을 작성합니다.
- 단순 뉴스 요약이 아니라 독자에게 배경, 핵심 쟁점, 실무적 시사점, 앞으로 볼 점을 설명합니다.
- 출처 문장을 복사하지 말고 완전히 새롭게 작성합니다.
- Markdown 본문만 출력합니다. 안내문, 사과문, 이미지 프롬프트 섹션은 출력하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 정보를 바탕으로 워드프레스용 블로그 글을 작성해 주세요.

메뉴: ${categoryLabel}
글 톤: ${tone}
핵심 키워드: ${keywords || "최신 기술 이슈, 블로그 주제"}

선택된 최신 이슈:
${topicTitle ? `- 주제: ${topicTitle}` : ""}
${topicSummary ? `- 핵심 맥락: ${topicSummary}` : ""}
${topicSource ? `- 참고 출처: ${topicSource}` : ""}
${topicLink ? `- 참고 링크: ${topicLink}` : ""}

사용자 입력:
${body.input}

작성 규칙:
- 제목은 25~70자 사이로 작성하고 핵심 키워드 1개 이상을 포함합니다.
- 첫 문단에서 왜 지금 이 주제를 봐야 하는지 설명합니다.
- H2 섹션 5개 이상을 사용합니다.
- 중간에 불릿 목록을 1개 이상 포함합니다.
- 마지막에는 "| 항목 | 정리 |" 형태의 마무리 표를 포함합니다.
- 독자가 바로 활용할 수 있는 관점과 체크포인트를 포함합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 작성하지 않습니다.`,
    },
  ];
}

function buildMessages(body) {
  if (body.mode === "generic") {
    return buildGenericBlogMessages(body);
  }
  const systemPrompt = `당신은 Java 프로그래밍 교육용 워드프레스 블로그 글 작성 도우미입니다.

역할:
- 사용자가 입력한 Java 문제, 데이터, 요구사항, 소스 코드를 바탕으로 워드프레스에 바로 게시 가능한 Markdown 글을 작성합니다.
- 대상 독자는 Java 초보자 또는 학생입니다.
- 설명은 친절한 강의체로 작성하되 과하게 길게 늘리지 않습니다.

반드시 지킬 규칙:
- Markdown만 출력합니다. 앞뒤 안내 문장이나 코드펜스 바깥의 불필요한 설명은 붙이지 않습니다.
- 제목에는 Java와 핵심 개념명을 포함합니다.
- 기본 구성은 제목, 소개 문단, 문제, 데이터 또는 입력 예시, 요구사항, 전체 소스 코드, 핵심 코드 설명, 실행 결과, 개념 정리, 마무리 정리 순서로 작성합니다.
- 코드 블록에는 java 또는 text 언어명을 붙입니다.
- 소스 코드의 원본 흐름은 최대한 유지하되, 들여쓰기와 빈 줄은 읽기 좋게 정리합니다.
- 코드 오류가 있으면 "수정 제안"을 먼저 적고 수정한 코드를 제시합니다.
- 핵심 코드는 별도로 뽑아서 초보자가 이해하기 쉽게 설명합니다.
- 메서드 체이닝이 있으면 순서대로 해석합니다.
- 람다식, 메서드 참조, Stream, Comparator가 나오면 초보자 기준으로 설명합니다.
- SEO 키워드를 본문 중간에 자연스럽게 반복합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 절대 작성하지 않습니다.
- 글 마지막에는 핵심 정리 표를 포함합니다.`;

  const codeFixInstruction = body.includeCodeFixNotice
    ? "- 코드가 정상이라면 가독성만 정리했다는 짧은 안내를 포함합니다."
    : "- 코드 가독성 정리 안내 문장은 생략합니다.";

  const seoInstruction = `SEO 작성 기준:
- 제목은 25~70자 사이로 작성합니다.
- 제목에는 Java와 가장 중요한 핵심 키워드를 반드시 포함합니다.
- 첫 소개 문단에는 핵심 키워드를 자연스럽게 포함합니다.
- 본문 중간에도 SEO 키워드를 과하지 않게 반복합니다.
- H2 제목은 검색 사용자와 초보자가 이해하기 쉬운 문장으로 작성합니다.
- 코드 블록에는 반드시 java 또는 text 언어명을 붙입니다.
- 마지막에는 마무리 정리 표를 포함합니다.
- 키워드 나열만 반복하지 말고 문맥 안에서 자연스럽게 사용합니다.`;

  const userPrompt = `아래 입력을 워드프레스용 Java 교육 블로그 글로 작성해 주세요.

작성 톤: ${body.tone || "친절한 강의체"}
SEO 키워드: ${body.keywords || "Java, Stream, sorted(), Comparator"}

추가 조건:
${seoInstruction}
- 대표 이미지 프롬프트 섹션은 작성하지 않습니다.
${codeFixInstruction}

사용자 입력:
${body.input}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

async function generateWithOpenAI({ model, messages }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다. .env 파일 또는 환경 변수에 API 키를 설정해 주세요.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || "gpt-5.4-mini",
      input: messages,
      max_output_tokens: 6000,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI 요청 실패: HTTP ${response.status}`);
  }

  const outputText = data.output_text || extractOpenAIText(data);

  if (!outputText) {
    throw new Error("OpenAI 응답에서 생성된 텍스트를 찾지 못했습니다.");
  }

  return outputText.trim();
}

async function generateWithOllama({ model, messages }) {
  const endpoint = normalizeOllamaBaseUrl(process.env.OLLAMA_BASE_URL || "http://114.71.147.30:21434");
  const response = await fetch(`${endpoint}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || process.env.OLLAMA_MODEL || "qwen3.6:35b-a3b",
      stream: false,
      messages,
      options: {
        temperature: 0.4,
      },
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Ollama 요청 실패: HTTP ${response.status}`);
  }

  const outputText = data.message?.content || data.response;

  if (!outputText) {
    throw new Error("Ollama 응답에서 생성된 텍스트를 찾지 못했습니다.");
  }

  return outputText.trim();
}

function extractOpenAIText(data) {
  if (!Array.isArray(data.output)) return "";

  return data.output
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function normalizeOllamaBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(requestUrl.pathname);
  const relativePath = pathname === "/"
    ? "index.html"
    : path
        .normalize(pathname)
        .replace(/^(\.\.[/\\])+/, "")
        .replace(/^[/\\]/, "");
  const filePath = path.join(rootDir, relativePath);

  if (!filePath.startsWith(rootDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 250_000) {
        reject(new Error("요청 본문이 너무 큽니다."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON 형식이 올바르지 않습니다."));
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  });
}
