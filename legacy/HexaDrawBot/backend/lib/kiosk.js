const puppeteer = require("puppeteer-core");

const findChrome = async () =>
  require(`${process.cwd()}/node_modules/carlo/lib/find_chrome`)({
    channel: ["*"]
  }).then(({ executablePath }) => executablePath);

const launch = async port => {
  const url = `http://localhost:${port}`;
  console.log(`launch kiosk ${url}`);

  // https://github.com/GoogleChrome/puppeteer/blob/v1.20.0/docs/api.md#puppeteerlaunchoptions
  const options = {
    timeout: 120000,
    localDataDir: `${process.cwd()}/.local-data`,
    userDataDir: `${process.cwd()}/.user-data`,
    executablePath: await findChrome(),
    pipe: true,
    headless: false,
    args: [
      // https://peter.sh/experiments/chromium-command-line-switches/
      "--no-default-browser-check",
      "--no-first-run",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-gesture-requirement-for-media-playback",
      "--use-fake-ui-for-media-stream",
      "--incognito",
      "--app=data:text/plain,",
      //"--start-fullscreen",
      //"--kiosk",
      "--disable-infobars",
      "--disable-session-crashed-bubble",
      "--noerrdialogs",
      "--no-sandbox",
      "--remote-debugging-port=9222"
    ],
    ignoreDefaultArgs: ["--mute-audio"],
    defaultViewport: null
  };
  const browser = await puppeteer.launch(options);
  const page = await browser.pages().then(([page]) => page);

  page.on("close", async () => {
    try {
      await browser.close();
    } catch (error) {
      console.error(error);
    } finally {
      process.exit(0);
    }
  });

  page.goto(url);
  page.bringToFront();
};

module.exports = launch;
