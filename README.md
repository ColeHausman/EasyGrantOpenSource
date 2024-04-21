# Senior Design Project
## EasyGrant

![tests](https://github.com/ColeHausman/EasyGrant/actions/workflows/test_ezgrant.yml/badge.svg?branch=main)
![Static Badge](https://img.shields.io/badge/v16%3E%3D-Node?logoColor=%237CFC00&label=Node)
![Static Badge](https://img.shields.io/badge/7--slim-Node?logoColor=%237CFC00&label=oraclelinux&labelColor=%235D3FD3)

## Overview
This is my undergraduate senior design project. EasyGrant is a fullstack webapp built with React with the goal of making it easier for students and faculty to find applicable research grants. This project was proposed by Professor Emily Martin of Bucknell University, a co-founder of em<sup>2</sup>CONNECT. This project had a budget of exactly $0 which gave few choices of a cloud database provider. I chose Oracle Cloud's "always free" tier which affords plenty of storage and `Node-oracledb` can be (somewhat*) easily integrated into a simple `expressjs` backend. 

**`oracledb` does not like arm macs which is why this project is dockerized in oraclelinux*

## Notable Features
- NLP powered search bar that translates your search phrases into Oracle SQL and returns results sorted by relevancy
- Admin Dashboard that allows admins to monitor, edit, delete, and approve user submitted research grants
- Research Grant submission page that allows anyone to send admins research grants they've found
- Multi-threaded web-scraper built with Puppeteer and Cheerioto to automatically update the database with new research grants

The code for the webapp can be found in the `ezgrant` directory. \
The code for the web-scraper can be found in the `automation` directory.

## Build
If you want to run this app with your own database you can follow the steps below. \
Please note that this code is not production ready
### Prerequisites:
1) Setup an OracleCloud free account
2) Create an Autonomous Data Warehouse
3) [Follow these instructions for downloading an instance wallet](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/connect-download-wallet.html#GUID-B06202D2-0597-41AA-9481-3B174F75D4B1)
4) Save your wallet in the `ezgrant/build-resource` directory as well as `automation/build-resource` if you want to run the web-scraper

The following schema is required if you wish to use the existing server endpoints:
```
| Name        | Null?    | Type           |
|-------------|----------|----------------|
| NAME        |          | VARCHAR2(255)  |
| LOCATION    |          | VARCHAR2(255)  |
| LINK        | NOT NULL | VARCHAR2(255)  |
| AMOUNT      |          | VARCHAR2(255)  |
| ABOUT       |          | VARCHAR2(4000) |
| FREE        |          | CHAR(1)        |
| ELIGIBILITY |          | VARCHAR2(255)  |
| DEADLINE    |          | VARCHAR2(250)  |
```

### Requirements
- [Oracle Instant Client Library](https://www.oracle.com/cis/database/technologies/instant-client/downloads.html) (already built in docker image)
- Node v16 >=
- npm v9.5 >=
- [Docker](https://www.docker.com/products/docker-desktop/)

 ### Docker build:
1) `cd` into the `ezgrant` directory
2) Build using:
   ```
   docker buildx build --platform linux/amd64 --pull -t ezgrants .
   ```
3) Run
   ```
   docker run -p 8080:8080 -v $(pwd):/app -ti --rm ezgrants
    ```

### Testing
In directory `ezgrant`, with `node_modules` installed run:
```
npm run test
```

## Automated Web Scraping

### Docker build:
0) [Arm-based mac only] `brew install colima`
   ```
   colima start --arch aarch64 --vm-type=vz --vz-rosetta --cpu <NUM CPU CORES> --memory <NUM GIGS OF RAM>
   ```
1) `cd` into the `automation` directory
2) Build using:
   ```
   docker build --platform linux/amd64 --pull -t automation .   
   ```
3) Run
   ```
   docker run --shm-size=1G --memory <NUM GIGS OF RAM>g --cpus="<NUM CPU CORES>" --platform=linux/amd64 -p 3000:3000 -v $(pwd):/app -ti --rm automation
    ```

