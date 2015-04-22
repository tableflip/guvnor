FROM debian:latest

# Change this to use io.js or a different version of node
ENV NODE_URL https://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x64.tar.gz
# ENV NODE_URL https://iojs.org/dist/v1.5.1/iojs-v1.5.1-linux-x64.tar.xz

# Change these to something else
ENV GUVNOR_ROOT_SECRET U9BmVFKxII4aksmt0+GG3c3Gj4dObSsF5uTBI4b3r44=
ENV GUVNOR_USER_SECRET zPZT1wRxnH4l3IIJup2fZd5GMfiQA7kJPYj5xYI4e68=

# This is the port guv-web will connect to
ENV REMOTE_PORT 60000

# node-inspector will listen on this port
ENV INSPECTOR_PORT 60001

# These are the start and end ports of a range that will be used to assign debug
# ports to running processes
# You should make this range large enough for your needs - if you change this
# don't forget to update the EXPOSE directives near the end of this file
ENV PROCESS_PORTS_START 60002
ENV PROCESS_PORTS_END 60020

# Update package list and install a flavour of node/iojs
RUN apt-get update
RUN apt-get install -y curl build-essential git python libavahi-compat-libdnssd-dev sudo
RUN cd /usr/local; curl -sS $NODE_URL | tar -xz
RUN ln -s /usr/local/*-linux-x64 /usr/local/node
RUN echo PATH=/usr/local/node/bin:$PATH > /etc/profile
ENV PATH /usr/local/node/bin:$PATH

# Install guvnor
RUN npm install -g guvnor --unsafe-perm

# Create guvnor group
RUN groupadd guvnor

# Create user to run processes as
RUN useradd -ms /bin/bash -G adm,dialout,cdrom,plugdev,floppy,tape,sudo,video,games,staff,users -g guvnor guvnor

# Create config directory
RUN mkdir /etc/guvnor

# Create config file to let guvnor-web connect
RUN node -e 'console.log(JSON.stringify([{"name": "root", "secret": "GUVNOR_ROOT_SECRET"}, {"name": "guvnor", "secret": "GUVNOR_USER_SECRET"}], null, 2))' \
  | sed s/GUVNOR_ROOT_SECRET/$GUVNOR_ROOT_SECRET/g \
  | sed s/GUVNOR_USER_SECRET/$GUVNOR_USER_SECRET/g \
  > /etc/guvnor/users.json

# Create config file to expose ports
RUN node -e 'console.log(JSON.stringify({"remote": {"port": "REMOTE_PORT", "inspector": {"port": "INSPECTOR_PORT"}}, "ports": {"start": "PROCESS_PORTS_START", "end": "PROCESS_PORTS_END"}}, null, 2))' \
  | sed s/REMOTE_PORT/$REMOTE_PORT/g \
  | sed s/INSPECTOR_PORT/$INSPECTOR_PORT/g \
  | sed s/PROCESS_PORTS_START/$PROCESS_PORTS_START/g \
  | sed s/PROCESS_PORTS_END/$PROCESS_PORTS_END/g \
  > /etc/guvnor/guvnor

# Set up permissions on config files
RUN chgrp -R guvnor /etc/guvnor
RUN chmod 0755 /etc/guvnor
RUN chmod 0600 /etc/guvnor/users.json
RUN chmod 0600 /etc/guvnor/guvnor

# Expose ports - n.b. if using docker 1.5 or above you can specify a range like:
# EXPOSE 60000-60020
EXPOSE 60000
EXPOSE 60001
EXPOSE 60002
EXPOSE 60003
EXPOSE 60004
EXPOSE 60005
EXPOSE 60006
EXPOSE 60007
EXPOSE 60008
EXPOSE 60009
EXPOSE 60010
EXPOSE 60011
EXPOSE 60012
EXPOSE 60013
EXPOSE 60014
EXPOSE 60015
EXPOSE 60016
EXPOSE 60017
EXPOSE 60018
EXPOSE 60019
EXPOSE 60020

# Remove the environmental variables we created
RUN unset GUVNOR_ROOT_SECRET; \
  unset GUVNOR_USER_SECRET; \
  unset NODE_URL; \
  unset REMOTE_PORT; \
  unset INSPECTOR_PORT; \
  unset PROCESS_PORTS_START; \
  unset PROCESS_PORTS_END

# Start guvnor
CMD guv --daemonise=false
