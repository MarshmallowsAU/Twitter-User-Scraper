/**
 * Twitter User Scraper
 *
 * Created by: Jerry M Yang
 * Date: 15/04/2023
 */

const puppeteer = require("puppeteer-core");
const prompt = require("prompt-sync")({ sigint: true });

/**
 * getProfileInfo
 * 
 * Given a downloaded HTTP page, extracts and returns
 * information about the user contained within the page.
 * 
 * @param { page } page 
 * @returns { profileName, username, followers, following }
 */
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
  
  /**
   * getTweets
   * 
   * Given a downloaded HTTP page, extracts and returns
   * information about all the tweets made in that page.
   * 
   * @param { page } page 
   * @returns { text, timeSent, numReplies, numRetweets , numLikes }
   */
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

/**
 * getTwitterData
 * 
 * When given a Twitter User URL returns an object
 * that contains information about the user and the
 * Tweets that they have made.
 * 
 * @param { string } url 
 * @returns { profile, tweets }
 */
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

/**
 * niceDate
 * 
 * Given the date returned by the scraper, it returns
 * a revised string that has the date in a nicer looking
 * format.
 * 
 * @param { string } time 
 * @returns { string }
 */
const niceDate = (time) => {
  let niceDate = `Time: ${time.slice(11,19)} - ${(time.slice(0, 10)).replace(/-/g, ' ')}`;
  return niceDate;
}

/**
 * addWhiteSpace
 * 
 * Given a length returns a string of whitespace of
 * length: 8 - length to ensure consistent whitespace.
 * 
 * @param { number } length 
 * @returns { string }
 */
const addWhiteSpace = (length) => {
  const whiteSpace = ' '.repeat(8-length);
  return whiteSpace;
}

/**
 * scrapeUser
 * 
 * When called prompts the user to enter a user profile
 * URL of a Twitter User. It then prints out all information
 * related to that user.
 * 
 * @param {}
 * @returns {}
 */
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

scrapeUser();
