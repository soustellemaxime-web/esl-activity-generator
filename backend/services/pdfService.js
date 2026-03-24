const puppeteer = require("puppeteer")

async function generatePDF(html) {

  const browser = await puppeteer.launch()

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: ["load", "domcontentloaded", "networkidle0"]
  })

  await page.evaluate(async () => {
  const images = Array.from(document.images);

  await Promise.all(
      images.map(img => {
        if (img.complete) return;

        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });
  await page.emulateMediaType("print")

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true
  })

  await browser.close()

  return pdf
}

module.exports = generatePDF