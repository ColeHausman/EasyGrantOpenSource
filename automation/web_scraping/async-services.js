const websiteList = require('./resources/website-list');
const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports.delay = delay;

const withBrowser = async (fn) => {
	const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox'],
    });
	try {
		return await fn(browser);
	} finally {
		await browser.close();
	}
}

module.exports.withBrowser = withBrowser;

const withPage = (browser) => async (fn) => {
	const page = await browser.newPage();
	try {
		return await fn(page);
	} finally {
		await page.close();
	}
}

module.exports.withPage = withPage;