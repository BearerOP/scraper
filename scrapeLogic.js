const { chromium } = require("playwright");
const metascraper = require("metascraper")([
  require("metascraper-title")(),
  require("metascraper-description")(),
  require("metascraper-logo")(),
  require("metascraper-image")(),
  require("metascraper-url")(),
  require("metascraper-publisher")(),
]);

const scrapePage = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

    const isX = url.includes("x.com") || url.includes("twitter.com");

    let data = {
      title: "",
      description: "",
      logo: "https://img.logo.dev/x.com",
      url,
      image: "",
      publisher: "X",
    };

    if (isX) {
      if (/\/status\/\d+/.test(url)) {
        // Tweet (post)
        await page.waitForTimeout(2000);
        data.title = await page
          .$eval("article div[lang]", (el) => el.innerText)
          .catch(() => "");

        data.description = data.title;

        data.image = await page
          .$eval('article img[src*="twimg.com/media"]', (el) => el.src)
          .catch(() => "");
      } else {
        // Profile
        await page.waitForTimeout(3000);

        data.title =
          (await page
            .$eval('div[data-testid="UserName"] h2', (el) => el.textContent)
            .catch(() => "")) ||
          (await page
            .$eval(
              'div[data-testid="UserName"] > div > div > span',
              (el) => el.textContent
            )
            .catch(() => ""));

        data.description =
          (await page
            .$eval('div[data-testid="UserDescription"]', (el) => el.textContent)
            .catch(() => "")) ||
          (await page
            .$eval('meta[name="description"]', (el) => el.content)
            .catch(() => ""));

        data.image = await page
          .$$eval("img", (imgs) => {
            const profileImg = imgs.find(
              (img) =>
                img.src.includes("profile_images") && !img.src.includes("emoji")
            );
            return profileImg?.src || "";
          })
          .catch(() => "");

        if (!data.title) {
          data.title = await page.title().catch(() => "");
        }
      }
    } else {
      // Fallback for all other websites
      const html = await page.content();
      const meta = await metascraper({ html, url });

      // Fallback logo handling
      if (!meta.logo) {
        const favicon = await page
          .$eval('link[rel="icon"], link[rel="shortcut icon"]', (el) => el.href)
          .catch(() => "");

        meta.logo =
          favicon ||
          `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
      }

      data = {
        title: meta.title || "",
        description: meta.description || "",
        logo: meta.logo || "",
        url,
        image: meta.image || "",
        publisher: meta.publisher || "",
      };
    }

    await browser.close();
    return res.json(data);
  } catch (error) {
    console.error("Scrape Error:", error);
    if (browser) await browser.close();
    return res.status(500).json({ error: "Failed to scrape metadata" });
  }
};

module.exports = {
  scrapePage,
};
