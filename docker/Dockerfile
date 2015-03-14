FROM debian:latest

# Change this to use io.js or a different version of node
ENV NODE_URL https://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x64.tar.gz
# ENV NODE_URL https://iojs.org/dist/v1.5.1/iojs-v1.5.1-linux-x64.tar.xz

ENV GUVNOR_ROOT_SECRET U9BmVFKxII4aksmt0+GG3c3Gj4dObSsF5uTBI4b3r44=
ENV GUVNOR_USER_SECRET zPZT1wRxnH4l3IIJup2fZd5GMfiQA7kJPYj5xYI/e68=

# Update package list and install a flavour of node/iojs
RUN apt-get update
RUN apt-get install -y curl build-essential git python libavahi-compat-libdnssd-dev sudo
RUN cd /usr/local; curl -sS $NODE_URL | tar -xz
RUN ln -s /usr/local/*-linux-x64 /usr/local/node
RUN echo PATH=/usr/local/node/bin:$PATH > /etc/profile
ENV PATH /usr/local/node/bin:$PATH

# Create guvnor group
RUN groupadd guvnor

# Create user to run processes as
RUN useradd -ms /bin/bash -g guvnor guvnor

# Install guvnor
RUN npm install -g guvnor --unsafe-perm

# Create config file to let guvnor-web connect
RUN mkdir /etc/guvnor
RUN echo [{\"name\": \"root\", \"secret\": \"$GUVNOR_ROOT_SECRET\"}, {\"name\": \"guvnor\", \"secret\": \"$GUVNOR_USER_SECRET\"}] > /etc/guvnor/users.json
RUN chgrp -R guvnor /etc/guvnor
RUN chmod 0755 /etc/guvnor
RUN chmod 0600 /etc/guvnor/users.json
RUN cat /etc/guvnor/users.json

# Expose the remote monitoring port
EXPOSE 57483

# Remove the environmental variables we created
RUN unset GUVNOR_ROOT_SECRET; unset GUVNOR_USER_SECRET; unset NODE_URL

CMD guv --daemonise=false
