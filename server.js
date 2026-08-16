const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;

loadDotEnv(path.join(rootDir, ".env"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
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

    if (req.method === "POST" && req.url === "/api/wp-draft") {
      await handleWordPressDraft(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/wp-existing-post") {
      await handleWordPressExistingPost(req, res);
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

server.listen(port, host, () => {
  console.log(`BlogMaker server running at http://${host}:${port}/`);
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
    const refineMessages = body.mode === "existing-rewrite"
      ? buildExistingSeoRefineMessages(body, markdown, seoReport)
      : body.mode === "generic"
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
    "sw-testing": "소프트웨어 테스팅 QA 테스트 자동화 품질 보증 회귀 테스트",
    "stock-beginner": "주식 초보 투자 기초 증시 시장 지표 포트폴리오",
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
    "sw-testing": ["테스팅", "QA", "테스트자동화", "품질보증"],
    "stock-beginner": ["주식", "투자", "초보", "시장지표"],
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
    "sw-testing": "SW 테스팅",
    "stock-beginner": "주식 초보",
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
    "최근 변화가 실무와 생활에 미치는 영향",
    "초보자가 알아야 할 핵심 개념과 적용 방법",
    "지금 확인해야 할 핵심 체크포인트",
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
  const categoryLabel = String(body.categoryLabel || "블로그").trim();
  const availableModels = await getOllamaImageModels();
  const model = String(body.model || availableModels[0]?.name || "").trim();

  if (!model) {
    sendJson(res, 400, {
      error: "Ollama 이미지 생성 모델이 설치되어 있지 않습니다. x/flux2-klein 또는 x/z-image-turbo를 설치한 뒤 다시 시도하세요.",
    });
    return;
  }

  const prompt = [
    "Clean Korean blog cover background, no text, no letters, no words.",
    "Muted professional background with subtle abstract shapes, soft depth, polished editorial style.",
    "Professional Korean blog thumbnail style, centered empty area for title overlay.",
    `Category: ${categoryLabel}.`,
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
  const categoryLabel = String(body.categoryLabel || "블로그").trim();

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

  try {
    const metadata = await generateWordPressImageMetadata(ai, Type, promptModel, title, content, categoryLabel);
    const specs = [
      { type: "featured", aspectRatio: "16:9", width: 1200, height: 630, overlayTitle: title },
      { type: "content", aspectRatio: "16:9", width: 1024, height: null, overlayTitle: "" },
    ];
    const images = [];

    for (const spec of specs) {
      const itemMetadata = normalizeImageMetadata(metadata[spec.type], title, spec.type, categoryLabel);
      const imageResponse = await ai.models.generateImages({
        model: imageModel,
        prompt: buildWordPressImagePrompt(itemMetadata.prompt, spec.type, categoryLabel),
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
  } catch (error) {
    const normalized = normalizeGoogleApiError(error);
    sendJson(res, normalized.statusCode, { error: normalized.message });
  }
}

async function handleWordPressDraft(req, res) {
  const body = await readJsonBody(req);
  const title = String(body.title || "").trim();
  const markdown = String(body.markdown || "").trim();

  if (!title || !markdown) {
    sendJson(res, 400, { error: "WordPress에 발행할 제목과 Markdown 본문이 필요합니다." });
    return;
  }

  const config = getWordPressConfig();
  const images = Array.isArray(body.images) ? body.images : [];
  const uploadedImages = [];

  for (const image of images) {
    if (!image?.dataUrl) continue;
    const uploaded = await uploadWordPressMedia(config, image);
    uploadedImages.push(uploaded);
  }

  const categoryIds = [];
  const tagIds = [];
  const warnings = [];

  if (body.category) {
    try {
      const category = await ensureWordPressTerm(config, "categories", String(body.category).trim());
      if (category?.id) categoryIds.push(category.id);
    } catch (error) {
      warnings.push(`카테고리 설정 실패: ${error.message}`);
    }
  }

  for (const tagName of Array.isArray(body.tags) ? body.tags : []) {
    const cleanTagName = String(tagName || "").trim();
    if (!cleanTagName) continue;

    try {
      const tag = await ensureWordPressTerm(config, "tags", cleanTagName);
      if (tag?.id) tagIds.push(tag.id);
    } catch (error) {
      warnings.push(`태그 설정 실패(${cleanTagName}): ${error.message}`);
    }
  }

  const featuredImage = uploadedImages.find((image) => image.type === "featured");
  const content = buildWordPressDraftContent(markdown, uploadedImages);
  const postPayload = {
    title,
    content,
    status: "draft",
    slug: String(body.slug || "").trim() || undefined,
    excerpt: String(body.metaDescription || "").trim() || undefined,
    categories: categoryIds,
    tags: tagIds,
    featured_media: featuredImage?.id || undefined,
  };
  const post = await wordpressRequest(config, "POST", "/posts", {
    json: removeUndefinedFields(postPayload),
  });

  await tryUpdateSeoPluginMeta(config, post.id, body, warnings);

  sendJson(res, 200, {
    id: post.id,
    status: post.status,
    link: post.link,
    editLink: post._links?.self?.[0]?.href || "",
    uploadedImages: uploadedImages.map((image) => ({
      id: image.id,
      type: image.type,
      sourceUrl: image.sourceUrl,
      filename: image.filename,
    })),
    warnings,
  });
}

async function handleWordPressExistingPost(req, res) {
  const body = await readJsonBody(req);
  const title = String(body.title || "").trim();
  const originalTitle = String(body.originalTitle || "").trim();
  const markdown = String(body.markdown || "").trim();

  if (!title || !markdown) {
    sendJson(res, 400, { error: "수정할 제목과 Markdown 본문이 필요합니다." });
    return;
  }

  const config = getWordPressConfig();
  const warnings = [];
  const post = await findWordPressPostByExactTitle(config, [originalTitle, title].filter(Boolean));

  if (!post) {
    sendJson(res, 404, { error: "동일한 제목의 기존 WordPress 글을 찾지 못했습니다." });
    return;
  }

  const existingRawContent = post.content?.raw || "";
  const content = buildWordPressUpdateContent(markdown, existingRawContent);
  const postPayload = removeUndefinedFields({
    title,
    content,
    excerpt: String(body.metaDescription || "").trim() || undefined,
  });
  const updatedPost = await wordpressRequest(config, "POST", `/posts/${post.id}`, {
    json: postPayload,
  });

  await tryUpdateSeoPluginMeta(config, post.id, body, warnings);

  sendJson(res, 200, {
    id: updatedPost.id,
    status: updatedPost.status,
    link: updatedPost.link,
    matchedTitle: normalizeComparableTitle(post.title?.raw || post.title?.rendered || ""),
    warnings,
  });
}

async function tryUpdateSeoPluginMeta(config, postId, body, warnings) {
  const focusKeyword = String(body.focusKeyword || "").trim();
  const seoTitle = String(body.seoTitle || body.title || "").trim();
  const metaDescription = String(body.metaDescription || "").trim();

  if (!postId || (!focusKeyword && !seoTitle && !metaDescription)) return;

  try {
    await wordpressRequest(config, "POST", `/posts/${postId}`, {
      json: {
        meta: removeUndefinedFields({
          _yoast_wpseo_focuskw: focusKeyword || undefined,
          _yoast_wpseo_title: seoTitle || undefined,
          _yoast_wpseo_metadesc: metaDescription || undefined,
          rank_math_focus_keyword: focusKeyword || undefined,
          rank_math_title: seoTitle || undefined,
          rank_math_description: metaDescription || undefined,
        }),
      },
    });
  } catch (error) {
    warnings.push(`SEO 플러그인 메타 자동 입력은 건너뜀: ${error.message}`);
  }
}

function getWordPressConfig() {
  const siteUrl = normalizeWordPressSiteUrl(process.env.WP_SITE_URL);
  const username = String(process.env.WP_USERNAME || "").trim();
  const appPassword = String(process.env.WP_APP_PASSWORD || "").trim();

  if (!siteUrl || !username || !appPassword) {
    throw new Error(".env에 WP_SITE_URL, WP_USERNAME, WP_APP_PASSWORD를 설정해 주세요.");
  }

  return {
    siteUrl,
    username,
    appPassword,
    authHeader: `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`,
  };
}

function normalizeWordPressSiteUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

async function wordpressRequest(config, method, endpoint, options = {}) {
  const headers = {
    Authorization: config.authHeader,
    Accept: "application/json",
    ...(options.headers || {}),
  };
  let body = options.body;

  if (options.json) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    body = JSON.stringify(options.json);
  }

  const response = await fetch(`${config.siteUrl}/wp-json/wp/v2${endpoint}`, {
    method,
    headers,
    body,
  });
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text.slice(0, 240) };
  }

  if (!response.ok) {
    const message = data.message || data.code || `WordPress 요청 실패: HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function findWordPressPostByExactTitle(config, titles) {
  const normalizedTitles = [...new Set(titles.map(normalizeComparableTitle).filter(Boolean))];
  if (!normalizedTitles.length) return null;

  for (const title of normalizedTitles) {
    const posts = await wordpressRequest(
      config,
      "GET",
      `/posts?search=${encodeURIComponent(title)}&status=any&context=edit&per_page=20`,
    );
    const exact = Array.isArray(posts)
      ? posts.find((post) => {
          const rawTitle = normalizeComparableTitle(post.title?.raw || "");
          const renderedTitle = normalizeComparableTitle(post.title?.rendered || "");
          return rawTitle === title || renderedTitle === title;
        })
      : null;

    if (exact) return exact;
  }

  return null;
}

function normalizeComparableTitle(value) {
  return decodeHtmlEntities(stripHtml(String(value || "")))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function uploadWordPressMedia(config, image) {
  const { buffer, mimeType } = dataUrlToBuffer(image.dataUrl);
  const filename = sanitizeFilename(image.filename || getDefaultWordPressImageFilename(image.type), mimeType);
  const metadata = image.metadata || {};
  const uploaded = await wordpressRequest(config, "POST", "/media", {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: buffer,
  });
  const mediaId = uploaded.id;

  if (mediaId) {
    await wordpressRequest(config, "POST", `/media/${mediaId}`, {
      json: removeUndefinedFields({
        title: String(metadata.title || "").trim() || undefined,
        caption: String(metadata.caption || "").trim() || undefined,
        alt_text: String(metadata.altText || "").trim() || undefined,
        description: String(metadata.description || "").trim() || undefined,
      }),
    });
  }

  return {
    id: mediaId,
    type: image.type || "",
    filename,
    sourceUrl: uploaded.source_url || uploaded.guid?.rendered || "",
    metadata,
  };
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error("이미지 데이터 URL 형식이 올바르지 않습니다.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function sanitizeFilename(filename, mimeType) {
  const fallbackExt = mimeType === "image/png" ? ".png" : ".webp";
  const safeName = String(filename || `wp-image${fallbackExt}`)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return /\.[a-z0-9]+$/i.test(safeName) ? safeName : `${safeName}${fallbackExt}`;
}

function getDefaultWordPressImageFilename(type) {
  if (type === "featured") return "wp-featured.webp";
  if (type === "content") return "wp-content-1.webp";
  return "wp-image.webp";
}

async function ensureWordPressTerm(config, taxonomy, name) {
  if (!name) return null;

  const existing = await wordpressRequest(config, "GET", `/${taxonomy}?search=${encodeURIComponent(name)}&per_page=20`);
  const exact = Array.isArray(existing)
    ? existing.find((term) => String(term.name || "").trim().toLowerCase() === name.toLowerCase())
    : null;

  if (exact) return exact;

  return wordpressRequest(config, "POST", `/${taxonomy}`, {
    json: { name },
  });
}

function buildWordPressDraftContent(markdown, uploadedImages) {
  const contentImage = uploadedImages.find((image) => image.type === "content");
  let content = stripWordPressImagePrompt(markdown).trim();

  content = insertMarkdownAfterIntro(content, "\n\n{{WP_CONTENT_IMAGE_1}}\n\n");
  content = stripFirstMarkdownHeading(content);
  content = markdownToWordPressHtml(content);

  return content
    .replace("{{WP_CONTENT_IMAGE_1}}", buildWordPressImageHtml(contentImage))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildWordPressUpdateContent(markdown, existingRawContent = "") {
  const preservedImages = extractWordPressImageBlocks(existingRawContent);
  let content = stripFirstMarkdownHeading(stripWordPressImagePrompt(markdown).trim());
  content = markdownToWordPressHtml(content);

  if (preservedImages[0]) {
    content = insertHtmlAfterFirstParagraph(content, preservedImages[0]);
  }

  if (preservedImages[1]) {
    content = insertHtmlBeforeWrapUp(content, preservedImages[1]);
  }

  if (preservedImages.length > 2) {
    content = `${content.trim()}\n\n${preservedImages.slice(2).join("\n\n")}`;
  }

  return content.replace(/\n{3,}/g, "\n\n").trim();
}

function extractWordPressImageBlocks(content) {
  const blocks = String(content || "").match(/<!--\s+wp:image[\s\S]*?<!--\s+\/wp:image\s+-->/g) || [];
  return [...new Set(blocks.map((block) => block.trim()).filter(Boolean))];
}

function insertHtmlAfterFirstParagraph(content, block) {
  const paragraphRegex = /(<!--\s+\/wp:paragraph\s+-->)/;
  if (paragraphRegex.test(content)) {
    return content.replace(paragraphRegex, `$1\n\n${block}`);
  }

  return `${block}\n\n${content}`;
}

function insertHtmlBeforeWrapUp(content, block) {
  const wrapUpRegex = /(<!--\s+wp:heading[\s\S]*?<h2[^>]*>(?:마무리(?:\s*정리)?|정리|결론)<\/h2>[\s\S]*?<!--\s+\/wp:heading\s+-->)/;
  if (wrapUpRegex.test(content)) {
    return content.replace(wrapUpRegex, `${block}\n\n$1`);
  }

  return `${content.trim()}\n\n${block}`;
}

function insertMarkdownAfterIntro(markdown, block) {
  const match = markdown.match(/^(#\s+.+\n\n[\s\S]*?)(\n{2,}##\s+)/);
  if (match) return markdown.replace(match[0], `${match[1]}${block}${match[2]}`);

  const titleMatch = markdown.match(/^(#\s+.+\n)/);
  if (titleMatch) return markdown.replace(titleMatch[0], `${titleMatch[0]}${block}`);

  return `${block}${markdown}`;
}

function insertMarkdownBeforeWrapUp(markdown, block) {
  const wrapUpRegex = /\n##\s+(?:마무리(?:\s*정리)?|정리|결론)(?=\s|$)/;
  if (wrapUpRegex.test(markdown)) return markdown.replace(wrapUpRegex, `${block}$&`);

  return `${markdown.trim()}${block}`;
}

function stripFirstMarkdownHeading(markdown) {
  return String(markdown || "").replace(/^#\s+.+\n+/, "").trim();
}

function buildWordPressImageHtml(image) {
  if (!image?.sourceUrl) return "";

  const metadata = image.metadata || {};
  const altText = escapeHtml(String(metadata.altText || ""));
  const title = escapeHtml(String(metadata.title || ""));
  const caption = escapeHtml(String(metadata.caption || ""));
  const idPart = image.id ? `{"id":${image.id},"sizeSlug":"large"}` : `{"sizeSlug":"large"}`;

  return `<!-- wp:image ${idPart} -->
<figure class="wp-block-image size-large"><img src="${escapeHtml(image.sourceUrl)}" alt="${altText}"${title ? ` title="${title}"` : ""}/>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>
<!-- /wp:image -->`;
}

function markdownToWordPressHtml(markdown) {
  const lines = String(markdown || "").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let codeLines = null;
  let tableLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<!-- wp:paragraph -->\n<p>${formatInlineMarkdown(paragraph.join(" "))}</p>\n<!-- /wp:paragraph -->`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<!-- wp:list -->\n<ul>${list.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ul>\n<!-- /wp:list -->`);
    list = [];
  };
  const flushTable = () => {
    if (!tableLines.length) return;
    html.push(markdownTableToHtml(tableLines));
    tableLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (codeLines) {
      if (trimmed.startsWith("```")) {
        html.push(`<!-- wp:code -->\n<pre class="wp-block-code"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>\n<!-- /wp:code -->`);
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      flushTable();
      codeLines = [];
      continue;
    }

    if (/^\{\{WP_CONTENT_IMAGE_[12]\}\}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushTable();
      html.push(trimmed);
      continue;
    }

    if (/^\|.+\|$/.test(trimmed)) {
      flushParagraph();
      flushList();
      tableLines.push(trimmed);
      continue;
    }

    if (tableLines.length) flushTable();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      html.push(`<!-- wp:heading {"level":${headingMatch[1].length}} -->\n<h${headingMatch[1].length}>${formatInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>\n<!-- /wp:heading -->`);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  if (codeLines) {
    html.push(`<!-- wp:code -->\n<pre class="wp-block-code"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>\n<!-- /wp:code -->`);
  }
  flushParagraph();
  flushList();
  flushTable();

  return html.join("\n\n");
}

function markdownTableToHtml(tableLines) {
  const rows = tableLines
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));

  if (!rows.length) return "";

  const [header, ...bodyRows] = rows;
  const headHtml = `<thead><tr>${header.map((cell) => `<th>${formatInlineMarkdown(cell)}</th>`).join("")}</tr></thead>`;
  const bodyHtml = `<tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;

  return `<!-- wp:table -->\n<figure class="wp-block-table"><table>${headHtml}${bodyHtml}</table></figure>\n<!-- /wp:table -->`;
}

function formatInlineMarkdown(value) {
  return escapeHtml(String(value || ""))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function removeUndefinedFields(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function normalizeGoogleApiError(error) {
  const rawMessage = String(error?.message || error || "").trim();
  let message = rawMessage;

  try {
    const parsed = JSON.parse(rawMessage);
    message = parsed?.error?.message || parsed?.message || rawMessage;
  } catch {
    const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        message = parsed?.error?.message || parsed?.message || rawMessage;
      } catch {
        message = rawMessage;
      }
    }
  }

  if (/API_KEY_INVALID|API key not valid|INVALID_ARGUMENT/i.test(`${rawMessage} ${message}`)) {
    return {
      statusCode: 400,
      message: "Gemini API 키가 유효하지 않습니다. .env의 GEMINI_API_KEY 또는 API_KEY 값을 새 키로 교체한 뒤 서버를 다시 시작해 주세요.",
    };
  }

  return {
    statusCode: 502,
    message: message || "Gemini 이미지 생성 요청 처리 중 오류가 발생했습니다.",
  };
}

async function loadGoogleGenAI() {
  try {
    return await import("@google/genai");
  } catch (error) {
    throw new Error("@google/genai 패키지가 설치되어 있지 않습니다. npm install을 실행한 뒤 다시 시도해 주세요.");
  }
}

async function generateWordPressImageMetadata(ai, Type, model, title, content, categoryLabel) {
  const prompt = `You are an expert WordPress blog image creator.
Based on the following blog title and content, generate image generation prompts and metadata for 2 images:
1. Featured Image (대표 이미지): a visually rich header background. The app will overlay the blog title later, so the generated image itself must contain no text.
2. Content Image (본문 이미지): one relevant supporting image for the article body. It must be useful on its own and contain no text.

Blog Title: ${title}
Blog Category: ${categoryLabel}
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
  }
}

Metadata writing rules:
- Write metadata (altText, title, caption, description) in Korean.
- Keep each image metadata distinct and context-aware.
- Make alt text and description clear for accessibility and SEO.
- Image prompts must be written entirely in English.
- Featured image prompts must describe an image-forward background with strong visual objects, scene, lighting, texture, and composition. Do not ask the image model to render the title; the app overlays the title separately.
- Content image prompts must describe only one central visual idea that directly supports the blog content.
- Image prompts must NOT include the blog title, any Korean words, or any quoted text to render inside the image.
- Image prompts must NOT mention brand or product names (e.g. "WordPress"), UI elements, or phrases like "title", "caption", or "label" — image models tend to render such words as garbled on-image text.
- Image prompts must NOT describe code snippets, screens, monitors, papers, books, signs, or any other object with visible writing on it — image models render such writing as garbled, illegible characters. Use abstract shapes, icons, or objects instead to represent those ideas.
- Image prompts must NOT describe diagrams, flowcharts, node/network graphs, UI mockups, wireframes, dashboards, or icons labeled with specific concept names (e.g. do not write "icon representing filter, map, reduce" or "nodes labeled with each step") — these layouts strongly trigger fake garbled text labels even when told not to render text. Prefer purely abstract gradients, geometric shapes, light/motion trails, metaphorical objects, or photorealistic scenes with no labeled parts instead.
- Image prompts must avoid embedded text, letters, numbers, logos, watermarks, signage, and UI screenshots. Avoid any text-like glyphs, pseudo-writing, keyboard legends, equations, labels, chart numbers, or decorative symbols.
- End every image prompt with this exact phrase: "no readable text, no letters, no numbers, no characters, no typography, no logos, no watermark".`;

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
        },
        required: ["featured", "content"],
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

function normalizeImageMetadata(metadata, blogTitle, type, categoryLabel) {
  const label = getWordPressImageTypeLabel(type);
  const fallbackPrompt = `Professional illustration about ${translateCategoryForImagePrompt(categoryLabel)}, clean editorial style, modern composition, no text, no letters, no characters, no logos, no watermark, no signage.`;

  return {
    prompt: String(metadata?.prompt || fallbackPrompt).trim(),
    altText: String(metadata?.altText || `${blogTitle} ${label}`).trim(),
    title: String(metadata?.title || `${blogTitle} ${label}`).trim(),
    caption: String(metadata?.caption || `${blogTitle} 내용을 시각적으로 설명한 ${label}입니다.`).trim(),
    description: String(metadata?.description || `${blogTitle} 블로그 글에 사용할 ${label} 이미지입니다.`).trim(),
  };
}

const CATEGORY_IMAGE_PROMPT_TRANSLATIONS = {
  "자바 공부": "Java programming study",
  "IT 이야기": "IT news and technology trends",
  "개발 이야기": "software development",
  "SW 테스팅": "software testing and QA",
  "주식 초보": "beginner stock investing",
  "AI 이야기": "artificial intelligence",
  "서버 설정": "server configuration and operations",
  "환경 설정": "development environment setup",
  "기존 블로그 수정": "blog content editing",
};

function translateCategoryForImagePrompt(categoryLabel) {
  return CATEGORY_IMAGE_PROMPT_TRANSLATIONS[String(categoryLabel || "").trim()] || "technology";
}

function buildWordPressImagePrompt(prompt, type, categoryLabel) {
  const role = type === "featured"
    ? "High-impact image-rich blog header background. Leave clean visual breathing room near the center for a title overlay that will be added later by the app. Do not render the title or any text."
    : "One clean, fully self-contained supporting image that directly matches the article topic and helps readers understand the content.";

  return [
    "No text, no letters, no words, no numbers, no characters, no typography, no pseudo-writing, no captions, no logos, no watermark, no signage, no UI chrome, no brand names, no code snippets, no papers, no documents, no sticky notes, no screens with visible writing, no diagrams, no flowcharts, no charts with numbers, no labeled nodes or icons, in any language or script.",
    role,
    prompt,
    `Professional ${translateCategoryForImagePrompt(categoryLabel)} illustration, polished, accessible, editorial quality.`,
    "Use natural objects, abstract shapes, lighting, depth, and scene composition instead of written elements.",
    "Remember: absolutely no readable text, letters, numbers, characters, or text-like marks anywhere in the image.",
  ].join(" ");
}

function getWordPressImageTypeLabel(type) {
  if (type === "featured") return "대표 이미지";
  if (type === "content") return "본문 이미지 1";
  return "본문 이미지";
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
- 얇은 요약문이 되지 않도록 FAQ, 실전 체크포인트, 주의점을 보강합니다.
- Markdown 본문만 출력합니다.
- 이미지 프롬프트 섹션은 작성하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 글을 SEO 기준에 맞게 수정해 주세요.

메뉴: ${body.categoryLabel || "블로그"}
핵심 키워드: ${body.keywords || body.categoryLabel || "블로그 주제"}

실패한 점검 항목:
${failedChecks || "- 제목, 키워드, H2 구조, 마무리 표를 전반적으로 개선해야 합니다."}

수정 기준:
- 제목은 25~70자 사이로 작성합니다.
- 첫 문단에 핵심 키워드를 자연스럽게 포함합니다.
- H2 섹션을 7개 이상 유지합니다.
- 마지막에는 마무리 정리 표를 포함합니다.
- FAQ 섹션에 질문 3개 이상과 구체적인 답변을 포함합니다.
- 실전 적용 방법, 체크리스트, 주의할 점 중 부족한 섹션을 추가합니다.
- 본문이 짧으면 고유한 설명과 예시를 추가해 한국어 기준 1,500자 이상으로 보완합니다.
- 원문을 복붙하지 말고 자연스럽게 다듬습니다.

기존 Markdown:
${markdown}`,
    },
  ];
}

function buildExistingSeoRefineMessages(body, markdown, seoReport) {
  const failedChecks = seoReport.checks
    .filter((check) => !check.passed)
    .map((check) => `- ${check.label}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `당신은 한국어 워드프레스 블로그 SEO 리라이트 전문 편집자입니다.

역할:
- 기존 블로그 글의 주제, 논지, 핵심 사례를 유지하면서 SEO 점검 실패 항목을 보완합니다.
- 원문을 그대로 복사하지 않고 새 문장으로 다시 씁니다.
- 검색엔진보다 독자에게 실제로 도움이 되는 설명, 체크리스트, FAQ를 보강합니다.
- Markdown 본문만 출력합니다.
- 이미지 프롬프트 섹션은 작성하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 기존 블로그 수정 결과가 SEO 점검에서 일부 기준을 통과하지 못했습니다.

핵심 키워드: ${body.keywords || body.categoryLabel || "기존 블로그 SEO 수정"}

미통과 항목:
${failedChecks || "- 제목, 키워드, H2 구조, FAQ, 마무리 표를 전반적으로 개선해야 합니다."}

재수정 기준:
- 제목은 25~70자 사이로 작성하고 핵심 키워드 1개 이상을 포함합니다.
- 첫 문단에 포커스 키워드를 자연스럽게 포함하고, 독자가 얻을 내용을 분명히 제시합니다.
- H2 섹션을 7개 이상 유지합니다.
- 본문 중간에 핵심 키워드를 과하지 않게 반복합니다.
- "실무 적용 방법", "체크리스트", "주의할 점" 섹션을 포함합니다.
- "자주 묻는 질문" H2 섹션을 만들고 질문 3개 이상에 답합니다.
- 마지막에는 Markdown 표 형태의 "마무리 정리"를 포함합니다.
- 본문이 짧으면 원문 주제에 맞는 설명과 사례를 추가해 한국어 기준 1,500자 이상으로 보완합니다.
- 원문 문장을 그대로 복사하지 말고 자연스럽게 새로 작성합니다.

현재 Markdown:
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
- 얇은 코드 요약문이 되지 않도록 FAQ, 초보자 실수, 직접 연습 과제를 보강합니다.
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
- "초보자가 자주 헷갈리는 부분", "직접 연습해 볼 과제", "자주 묻는 질문" 섹션을 보완합니다.
- FAQ에는 질문 3개 이상과 구체적인 답변을 포함합니다.
- 본문이 짧으면 설명과 예시를 추가해 한국어 기준 1,500자 이상으로 보완합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 작성하지 않습니다.

기존 Markdown:
${markdown}`,
    },
  ];
}

function auditSeoMarkdown(markdown, body) {
  if (body.mode === "generic" || body.mode === "existing-rewrite") {
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
  const plainTextLength = bodyWithoutCode.replace(/[#*_`>|-]/g, " ").replace(/\s+/g, " ").trim().length;
  const faqCount = (markdown.match(/^###\s+/gm) || []).length;
  const hasFaqSection = /##\s*(자주\s*묻는\s*질문|FAQ)/i.test(markdown);
  const hasPracticalSection = /##\s*(초보자가\s*자주\s*헷갈리는\s*부분|직접\s*연습|실전|체크리스트|주의|적용|활용)/i.test(markdown);
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
    {
      label: "본문이 얇은 콘텐츠로 보이지 않을 만큼 충분히 작성되어 있습니다.",
      passed: plainTextLength >= 1200,
    },
    {
      label: "FAQ 섹션이 있어 독자의 추가 질문에 답합니다.",
      passed: hasFaqSection && faqCount >= 3,
    },
    {
      label: "실전 적용, 연습 과제, 주의점 중 하나 이상을 포함합니다.",
      passed: hasPracticalSection,
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
  const keywords = String(body.keywords || body.categoryLabel || "블로그 주제")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = keywords[0] || "블로그 주제";
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
  const bodyWithoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const lowerBody = bodyWithoutCode.toLowerCase();
  const plainTextLength = bodyWithoutCode.replace(/[#*_`>|-]/g, " ").replace(/\s+/g, " ").trim().length;
  const faqCount = (markdown.match(/^###\s+/gm) || []).length;
  const hasFaqSection = /##\s*(자주\s*묻는\s*질문|FAQ)/i.test(markdown);
  const hasPracticalSection = /##\s*(실무|직접\s*연습|체크리스트|주의|적용|활용)/i.test(markdown);
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
      label: "H2 섹션이 7개 이상 포함되어 글 구조가 명확합니다.",
      passed: h2Count >= 7,
    },
    {
      label: "마무리 정리 표가 포함되어 있습니다.",
      passed: markdown.includes("|") && markdown.includes("---"),
    },
    {
      label: "본문이 얇은 콘텐츠로 보이지 않을 만큼 충분히 작성되어 있습니다.",
      passed: plainTextLength >= 1200,
    },
    {
      label: "FAQ 섹션이 있어 독자의 추가 질문에 답합니다.",
      passed: hasFaqSection && faqCount >= 3,
    },
    {
      label: "실전 적용, 체크리스트, 주의점 중 하나 이상을 포함합니다.",
      passed: hasPracticalSection,
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

function buildExistingBlogRewriteMessages(body) {
  const keywords = String(body.keywords || "").trim();
  const tone = String(body.tone || "SEO 재작성형").trim();

  return [
    {
      role: "system",
      content: `당신은 한국어 워드프레스 블로그 SEO 리라이트 전문 에디터입니다.

역할:
- 사용자가 붙여 넣은 기존 블로그 글을 바탕으로 워드프레스에 바로 붙여 넣을 Markdown 글을 새롭게 작성합니다.
- 원문의 주제, 핵심 주장, 실무 예시는 유지하되 문장과 구조는 새로 구성합니다.
- SEO 플러그인에서 빨간 항목이 남기 쉬운 제목, 첫 문단, 본문 길이, H2 구조, FAQ, 마무리 표를 적극적으로 보완합니다.
- 단순 요약문이나 키워드 나열을 피하고 독자가 실제로 실행할 수 있는 판단 기준을 제공합니다.
- Markdown 본문만 출력합니다. 안내문, 사과문, 평가표, 이미지 프롬프트 섹션은 출력하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 기존 블로그 글을 SEO 기준에 맞는 새 Markdown 글로 재작성해 주세요.

작성 톤: ${tone}
핵심 키워드: ${keywords || "기존 블로그 SEO 수정, 블로그 리라이트, 워드프레스 SEO"}

작성 규칙:
- 제목은 25~70자 사이로 작성하고 핵심 키워드 1개 이상을 포함합니다.
- 첫 문단 2~3문장 안에 포커스 키워드를 자연스럽게 포함하고, 독자가 이 글에서 얻는 답을 분명히 제시합니다.
- H2 섹션을 7개 이상 사용합니다.
- 원문 주제의 핵심 흐름을 유지하되 문장은 완전히 새롭게 작성합니다.
- 본문 중간에 핵심 키워드를 자연스럽게 반복하되 과도하게 나열하지 않습니다.
- "실무 적용 방법", "체크리스트", "주의할 점"을 각각 별도 H2 섹션으로 포함합니다.
- "자주 묻는 질문" H2 섹션을 만들고 질문 3개 이상과 구체적인 답변을 작성합니다.
- 마지막에는 "| 항목 | 정리 |" 형태의 마무리 정리 표를 포함합니다.
- 본문은 한국어 기준 최소 1,500자 이상으로 충분히 작성합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 작성하지 않습니다.

기존 블로그 글:
${body.input}`,
    },
  ];
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
- 단순 뉴스 요약이 아니라 독자에게 배경, 핵심 쟁점, 실전적 시사점, 앞으로 볼 점을 설명합니다.
- Google 검색과 AdSense 심사에 불리한 얇은 요약문을 피하고, 독자가 실제로 얻어갈 수 있는 고유한 설명을 충분히 제공합니다.
- 출처 문장을 복사하지 말고 완전히 새롭게 작성합니다.
- Markdown 본문만 출력합니다. 안내문, 사과문, 이미지 프롬프트 섹션은 출력하지 않습니다.`,
    },
    {
      role: "user",
      content: `아래 정보를 바탕으로 워드프레스용 블로그 글을 작성해 주세요.

메뉴: ${categoryLabel}
글 톤: ${tone}
핵심 키워드: ${keywords || "최신 이슈, 블로그 주제"}

선택된 최신 이슈:
${topicTitle ? `- 주제: ${topicTitle}` : ""}
${topicSummary ? `- 핵심 맥락: ${topicSummary}` : ""}
${topicSource ? `- 참고 출처: ${topicSource}` : ""}
${topicLink ? `- 참고 링크: ${topicLink}` : ""}

사용자 입력:
${body.input}

작성 규칙:
- 제목은 25~70자 사이로 작성하고 핵심 키워드 1개 이상을 포함합니다.
- 첫 문단 2~3문장 안에 핵심 키워드를 자연스럽게 포함하고, 독자가 이 글에서 얻는 답을 분명히 제시합니다.
- H2 섹션 7개 이상을 사용합니다.
- 중간에 불릿 목록을 1개 이상 포함합니다.
- 마지막에는 "| 항목 | 정리 |" 형태의 마무리 표를 포함합니다.
- 독자가 바로 활용할 수 있는 체크리스트, 실전 적용 방법, 주의할 점을 각각 별도 섹션으로 포함합니다.
- "자주 묻는 질문" H2 섹션을 만들고 질문 3개 이상과 구체적인 답변을 작성합니다.
- 단순한 정의나 뉴스 요약에 머무르지 말고, 왜 중요한지와 어떤 상황에서 써먹을 수 있는지를 설명합니다.
- 본문은 한국어 기준 최소 1,500자 이상이 되도록 충분히 작성합니다.
- 워드프레스 대표 이미지 프롬프트 섹션은 작성하지 않습니다.`,
    },
  ];
}

function buildMessages(body) {
  if (body.mode === "existing-rewrite") {
    return buildExistingBlogRewriteMessages(body);
  }

  if (body.mode === "generic") {
    return buildGenericBlogMessages(body);
  }
  const systemPrompt = `당신은 Java 프로그래밍 교육용 워드프레스 블로그 글 작성 도우미입니다.

역할:
- 사용자가 입력한 Java 문제, 데이터, 요구사항, 소스 코드를 바탕으로 워드프레스에 바로 게시 가능한 Markdown 글을 작성합니다.
- 대상 독자는 Java 초보자 또는 학생입니다.
- 설명은 친절한 강의체로 작성하되 과하게 길게 늘리지 않습니다.
- 단순 코드 나열이 아니라 초보자가 실제로 이해하고 다시 응용할 수 있는 고유한 설명을 제공합니다.

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
- "초보자가 자주 헷갈리는 부분" 섹션을 포함합니다.
- "직접 연습해 볼 과제" 섹션을 포함합니다.
- "자주 묻는 질문" 섹션을 만들고 질문 3개 이상에 답합니다.
- 본문은 한국어 기준 최소 1,500자 이상으로 작성합니다.
- 검색엔진보다 독자에게 도움이 되는 설명을 우선하고, 중복되거나 일반적인 문장은 줄입니다.
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
    const maxBodySize = 60_000_000;

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > maxBodySize) {
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
