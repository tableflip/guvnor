FROM node:4-wheezy

# So we can use an editor
ENV TERM xterm

# Install prerequisites
RUN apt-get update && \
  apt-get install -y libavahi-compat-libdnssd-dev nano

# Create guvnor group
RUN groupadd guvnor

# Create user to run processes as
RUN useradd -ms /bin/bash -G adm,dialout,cdrom,plugdev,floppy,tape,sudo,video,games,staff,users -g guvnor guvnor

# Set up npm config
RUN npm config set --global loglevel http

# Copy guvnor
RUN mkdir /opt/guvnor
COPY package.json /opt/guvnor/package.json
COPY bin /opt/guvnor/bin

RUN cd /opt/guvnor && \
  npm install --production

COPY lib /opt/guvnor/lib
COPY web /opt/guvnor/web

RUN cd /opt/guvnor && \
  npm link

# Start guvnor
CMD node /opt/guvnor/lib/daemon
