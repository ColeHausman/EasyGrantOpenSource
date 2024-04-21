const websiteList = require('./resources/website-list');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ora = require('ora');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const Listr = require('listr');
const bluebird = require("bluebird");
const dbServices = require("../database_communication/database-services");
const path = require('path');
require('dotenv').config({path : path.resolve(__dirname, '../build-resource/wallet/.env')});

const { delay, withBrowser, withPage } = require('./async-services');

const CONCURRENCY = 10;


async function findNumPagesArtistCommunities(){
    const spinner = ora('Finding last page...').start();
    spinner.color = 'red';
    delay(1000);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox'],
    });

    let i = 0;
    let foundEnd = false;

    try{
        const page = await browser.newPage();
        while(!foundEnd){
            spinner.text = `checking page ${i}...`
            await page.goto(websiteList[1]+`?page=${i}`).then(async () => {
                const noResidenciesMessage = await page.evaluate(() => {
                    const messageElement = document.querySelector('.view-empty');
                    if (messageElement) {
                      return messageElement.textContent;
                    }
                    return null;
                });
                if (noResidenciesMessage && noResidenciesMessage.includes("No residencies match your criteria.")) {
                    foundEnd = true;
                }
             });
             i++;
        }
    }catch(e){
        console.log(e);
    } finally {
        spinner.color = 'green';
        spinner.succeed(`Final page found at page ${i-1}`);
        delay(1000);
        await browser.close();
    }
    return i-1;
}

module.exports.findNumPagesArtistCommunities = findNumPagesArtistCommunities;

async function scrapeArtistCommunities(pageNumber){
    const grants = [];

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.goto(websiteList[1]+`?page=${pageNumber}`).then(async () => {
            const noResidenciesMessage = await page.evaluate(() => {
                const messageElement = document.querySelector('.view-empty');
                if (messageElement) {
                  return messageElement.textContent;
                }
                return null;
            });
            if (noResidenciesMessage && noResidenciesMessage.includes("No residencies match your criteria.")) {
                console.log("No residencies found for this page.");
                throw new Error("No residencies found for this page."); // Stop the function
            }
            const childContent = await page.$eval('.view-content', e => e.innerHTML);
            const $ = cheerio.load(childContent, null, false);

            
            
            const grantEntries = $('.views-row');
            grantEntries.each(async (idx, grantEntry) => {
                
                const title = $(grantEntry).find('.field--name-title').text();
                const link = `https://artistcommunities.org${$(grantEntry).find('a').attr('href')}`;
                const organization = $(grantEntry).find('.field__item a').text();
                const location = $(grantEntry).find('.field-pseudo-field--pseudo-residency-region').text();
                const description = $(grantEntry).find('.field--name-field-residency-description').text();
                const applicationType = $(grantEntry).find('.field--name-field-application-type .field__item').text();
                grants.push({
                    'title':title, 
                    'location':location,
                    'link':null,
                    'amount':null,
                    'description':description,
                    'free':'Y',
                    'eligibility':null,
                    'deadline':null,
                    'internalLink':link, 
                    'appLink':null,
                    'organization':organization, 
                    'applicationType':applicationType,
                });
            });
        });
    } catch(err) {  
        console.log(err);
        return [];
    } finally {
        await browser.close();
    }
    return grants;
}

module.exports.scrapeArtistCommunities = scrapeArtistCommunities;



async function scrapeArtistCommunitiesSubLink(grants){
    await withBrowser(async (browser) => {
        await bluebird.each(grants, async (grant) => {
            await withPage(browser)(async (page) => {
                await page.goto(`${grant.internalLink}`);
                const linkedContent = await page.content();
                const linked$ = cheerio.load(linkedContent);
                const linkedDescription = linked$('.field--name-field-discipline').text();

                const stipend = linked$('.field--name-field-artist-stipend .field--name-field-amount').text();

                const residencyFee = linked$('.ield--name-field-residency-fees .field--name-field-amount').text();

                const appFee = linked$('.field--name-field-application-fee .field--name-field-amount').text();

                if(appFee){
                    const fee = parseFloat(appFee);
                    if(fee > 0){
                        grant.free = 'N';
                    }
                }else if(residencyFee){
                    const rfee = parseFloat(residencyFee);
                    if(rfee > 0){
                        grant.free = 'N';
                    }
                }

                grant.amount = stipend;

                const appPage = linked$('.open-call-list a').attr('href');

                grant.appLink = appPage ? appPage: null;

                const eligibilityArr = linkedDescription.split('\n').map(line => line.trim()).filter(Boolean);

                if (eligibilityArr.length > 0) {
                    eligibilityArr.shift();
                }
                grant.eligibility = eligibilityArr;
            });
        });
    }, { concurrency: CONCURRENCY });
    return grants;
}

module.exports.scrapeArtistCommunitiesSubLink = scrapeArtistCommunitiesSubLink;

async function scrapeArtistCommunitiesAppLink(grants){
    await withBrowser(async (browser) => {
        await bluebird.each(grants, async (grant) => {
            await withPage(browser)(async (page) => {
                if(grant.appLink){
                    try{
                        await page.goto(`https://artistcommunities.org${grant.appLink}`);
                        const appContent = await page.content();
                        const appLinked$ = cheerio.load(appContent);
            
                        const dateMatch = appLinked$('.field--name-field-deadline').text().match(/(\w+ \d{1,2}, \d{4})/);
                        const dateMatchBackup = appLinked$('.field--name-field-deadline').text().match(/Deadline\n(.+)/);
            
                        const deadline = dateMatch ? dateMatch[0] : dateMatchBackup ? dateMatchBackup[0].trim() : null;
                        const link = appLinked$('.field--name-field-application-url a').attr('href');
            
                        grant.link = link;
                        grant.deadline = deadline;
            
                        delete grant.internalLink;
                        delete grant.appLink;
                    } catch (navigationError){
                        console.log(navigationError);
                    }
                }else{
                    grant.link = grant.internalLink;
                    delete grant.internalLink;
                    delete grant.appLink;
                }
            });
        });
    }, { concurrency: CONCURRENCY });
    return grants;
}

module.exports.scrapeArtistCommunitiesAppLink = scrapeArtistCommunitiesAppLink;