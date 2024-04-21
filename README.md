# Senior Design Project
## EasyGrant

![tests](https://github.com/ColeHausman/EasyGrant/actions/workflows/test_ezgrant.yml/badge.svg?branch=main)
![Static Badge](https://img.shields.io/badge/v16%3E%3D-Node?logoColor=%237CFC00&label=Node)
![Static Badge](https://img.shields.io/badge/7--slim-Node?logoColor=%237CFC00&label=oraclelinux&labelColor=%235D3FD3)

If you want to run this app with your own database you can follow the steps below.
### Prerequisites:
1) Setup an OracleCloud free account
2) Create an Autonomous Data Warehouse
3) (Follow these instructions for downloading an instance wallet)[https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/connect-download-wallet.html#GUID-B06202D2-0597-41AA-9481-3B174F75D4B1]
4) Save your wallet in the `build-resource` directory

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
Note: Assuming system of at least 8 core CPU, if system has fewer than 8 cores please purchase a system from this decade
0) \[Arm-based mac only] \
`brew install colima` \
`colima start --arch aarch64 --vm-type=vz --vz-rosetta --cpu 8 --memory 8`
1) `cd` into the `automation` directory
2) Build using:
   ```
   docker build --platform linux/amd64 --pull -t automation .   
   ```
3) Run
   ```
   docker run --shm-size=1G --memory 8g --cpus="8" --platform=linux/amd64 -p 3000:3000 -v $(pwd):/app -ti --rm automation
    ```


## Requirements
- [Oracle Instant Client Library](https://www.oracle.com/cis/database/technologies/instant-client/downloads.html) (already built in docker image)
- Node v16 >=
- npm v9.5 >=
- [Docker](https://www.docker.com/products/docker-desktop/)
## Pushing Code Changes
1) `git checkout -b [branch_name]`, the branch_name should be descriptive of the change being made
2) `git add .`, `git commit -m "[descriptive commit message]`
3) `git push --set-upstream origin [branch_name]`
4) Now go to the GitHub repo and you should see this <img width="923" alt="pullrequest" src="https://github.com/ColeHausman/EasyGrant/assets/55408275/db81082b-ee2c-4fc2-a738-6f723579f497">
5) Click "Compare & Pull Request", this will take you to a PR template I made, fill out the information that is applicable \
for the checkboxes you can place an X between the brackets like so: "[X]"
6) Please wait for someone to review your pull request unless its trivial
7) If your PR for some reason doesnt have a big green box that says "Able To Merge" pls contact Cole
8) Once you merge you should see a button to delete the branch, go ahead and click that
9) You're done!

