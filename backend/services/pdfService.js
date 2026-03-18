const puppeteer = require("puppeteer")

async function generatePDF(html) {

  const browser = await puppeteer.launch()

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: ["load", "domcontentloaded", "networkidle0"]
  })

  await page.emulateMediaType("screen")

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true
  })

  await browser.close()

  return pdf
}

module.exports = generatePDF