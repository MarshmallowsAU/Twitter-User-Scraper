/**
 * Web Scraper
 *
 * Created by: Jerry M Yang
 */

const puppeteer = require("puppeteer-core");
const prompt = require("prompt-sync")({ sigint: true });

const getProfileInfo = async (page) =>
  await page.evaluate(() => {
    const $ = (selector) => document.querySelector(selector);
 
    return {
      profileName: $('[data-testid="UserName"] div span').innerText,
      username: $('[data-testid="UserName"] div:nth-of-type(2) span').innerText,
      followers: $('a[href$="/followers"]').innerText,
      following: $('a[href$="/following"]').innerText,
    };
  });
 
  const getTweets = async (page) =>
  await page.evaluate(() => {
    return [...document.querySelectorAll("article")].map((tweet) => {
      let  numReplies = tweet.querySelector('[data-testid="reply"]').innerText;
      let  numRetweets = tweet.querySelector('[data-testid="retweet"]').innerText;
      let  numLikes = tweet.querySelector('[data-testid="like"]').innerText;

      numReplies = (numReplies === '') ? '0' : numReplies;
      numRetweets = (numRetweets === '') ? '0' : numRetweets;
      numLikes = (numLikes === '') ? '0' : numLikes;

      return {
        text: tweet.querySelector('[data-testid="tweetText"]').innerText,
        timeSent: tweet.querySelector("time").dateTime,
        numReplies: numReplies,
        numRetweets: numRetweets,
        numLikes: numLikes,
      };
    });
  });
 
const getTwitterData = async (url) => {
  const _browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS-API-KEY}`,
  });
  const _page = await _browser.newPage();
  await _page.goto(url);
  await _page.waitForSelector(`article`);
 
  const profileData = await getProfileInfo(_page);
  const tweetsMetrics = await getTweets(_page);
 
  _browser.disconnect();
 
  return {
    ...profileData,
    tweets: tweetsMetrics,
  };
};

const scrapeUser = async () => {
  const url = prompt('Enter Profile URL to be Scraped: ');
  console.log(`Scraping Profile of: ${url}\n`);

  const data = await getTwitterData(url);

  console.log(` --- User Details ---\n`);
  console.log(`Profile Name:  ${data.profileName}\nUsername:      ${data.username}\nFollowers:     ${data.followers}\nFollowing:     ${data.following}\n`);
  console.log(` --- Tweets ---\n`);
  
  for (const tweet of data.tweets) {
    console.log(`> Tweet (${niceDate(tweet.timeSent)})\n\nMessage:\n${tweet.text}\n\nReplies: ${tweet.numReplies}${addWhiteSpace(tweet.numReplies.length)}| Retweets: ${tweet.numRetweets}${addWhiteSpace(tweet.numRetweets.length)}| Likes: ${tweet.numLikes}\n`);
    console.log(`----------\n`);
  }
}

const niceDate = (time) => {
  let niceDate = `Time: ${time.slice(11,19)} - ${(time.slice(0, 10)).replace(/-/g, ' ')}`;
  return niceDate;
}

const addWhiteSpace = (length) => {
  const whiteSpace = ' '.repeat(8-length);
  return whiteSpace;
}


scrapeUser();
