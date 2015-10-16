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

# Create directories
RUN mkdir /opt/guvnor

# Install app dependencies and set up binaries
WORKDIR /opt/guvnor
COPY package.json /opt/guvnor/
COPY bin /opt/guvnor/bin
RUN npm install --production

# Copy guvnor
COPY . /opt/guvnor

# Start guvnor
CMD node /opt/guvnor/lib/daemon
