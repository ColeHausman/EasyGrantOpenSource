FROM oraclelinux:7-slim
# Adding Oracle Instant client
ADD linux-binaries/oracle-instantclient*.rpm /tmp/
# Oracle and Node.js setup
RUN yum -y install oracle-release-el7 oracle-nodejs-release-el7 && \
    yum-config-manager --disable ol7_developer_EPEL && \
    yum -y install /tmp/oracle-instantclient*.rpm nodejs && \
     rm -rf /var/cache/yum && \
     rm -f /tmp/oracle-instantclient*.rpm && \
     echo /usr/lib/oracle/12.2/client64/lib > /etc/ld.so.conf.d/oracle-instantclient12.2.conf && \
     ldconfig

RUN yum -y install wget
RUN yum-config-manager --enable ol7_optional_latest
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm && \
    yum install -y google-chrome-stable_current_x86_64.rpm


# Set Oracle Instant Client Path 
ENV PATH=$PATH:/usr/lib/oracle/12.2/client64/bin


# Installing procps (for ps command)
RUN yum install -y procps

# Set the working directory 
WORKDIR /app
# Copy package.json to leverage Docker cache
COPY package.json package.json
COPY package-lock.json package-lock.json

# Install nodemon and concurrently globally
RUN npm install -g nodemon concurrently 

# Install dependencies
RUN npm install

# Copy all files
ADD . /app/

# move wallet credentials to default dir for Oracle
COPY build-resource/wallet/* /usr/lib/oracle/19.3/client64/lib/network/admin/
ENV TNS_ADMIN=/usr/lib/oracle/19.3/client64/lib/network/admin/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD false

EXPOSE 3000

CMD ["npm", "start"]
